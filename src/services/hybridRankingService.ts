/**
 * Cloud Ranking Service Wrapper
 * AWS DynamoDB ランキングシステム
 * 
 * 機能:
 * - AWS DynamoDBをプライマリ
 * - 統一されたランキングAPI
 */

import { CloudRankingService } from './cloudRankingService';
import type { CloudRankingResult, CloudRankingEntry } from './cloudRankingService';

// 型定義をローカルで定義（旧LocalRankingServiceから移行）
export interface RankingEntry {
  rank: number;
  userId: string;
  username?: string;
  displayName: string;
  score: number;
  timestamp: string;
  isCurrentUser: boolean;
}

export interface RankingData {
  rankings: RankingEntry[];
  userRank: RankingEntry | null;
  totalPlayers: number;
  lastUpdated: string;
}

export interface HybridRankingConfig {
  useCloud: boolean;
  fallbackToLocal: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
}

export class HybridRankingService {
  private static instance: HybridRankingService;
  private cloudService: CloudRankingService;
  
  private config: HybridRankingConfig = {
    useCloud: true,
    fallbackToLocal: false, // LocalStorage削除により無効化
    autoSync: false, // 同期機能削除
    syncInterval: 5 // 5分間隔（未使用）
  };

  private constructor() {
    this.cloudService = CloudRankingService.getInstance();
  }

  public static getInstance(): HybridRankingService {
    if (!HybridRankingService.instance) {
      HybridRankingService.instance = new HybridRankingService();
    }
    return HybridRankingService.instance;
  }

  /**
   * 設定を更新
   */
  public updateConfig(config: Partial<HybridRankingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 Hybrid ranking config updated:', this.config);
  }

  /**
   * スコアを送信（クラウドのみ）
   */
  public async submitScore(gameType: string, score: number, metadata?: any): Promise<void> {
    console.log('🎯 Cloud score submission:', { gameType, score, metadata });

    // クラウドに保存（DynamoDBのみ）
    if (this.config.useCloud) {
      try {
        await this.cloudService.submitScore(gameType, score, metadata);
        console.log('✅ Cloud score saved successfully');
      } catch (error) {
        console.error('❌ Cloud score save failed:', error);
        throw error; // エラーを上位に伝播
      }
    } else {
      throw new Error('Cloud service is disabled');
    }
  }



  /**
   * トップ1位プレイヤーを取得（クラウドのみ）
   */
  public async getTopPlayer(gameType: string): Promise<RankingEntry | null> {
    console.log('🥇 Fetching cloud top player for:', gameType);

    try {
      const cloudTopPlayer = await this.cloudService.getTopPlayer(gameType);
      if (cloudTopPlayer) {
        console.log('✅ Cloud top player fetched successfully');
        return this.convertCloudEntryToLocal(cloudTopPlayer);
      }
      return null;
    } catch (error) {
      console.error('❌ Cloud top player fetch failed:', error);
      return null;
    }
  }

  /**
   * ランキングデータを取得（クラウドのみ）
   */
  public async getRankings(gameType: string, limit: number = 10): Promise<RankingData> {
    console.log('🏅 Fetching cloud rankings for:', gameType);

    try {
      const cloudRankings = await this.cloudService.getRankings(gameType, limit);
      console.log('✅ Cloud rankings fetched successfully');
      
      // CloudRankingResult を RankingData に変換
      return {
        rankings: cloudRankings.rankings.map(entry => this.convertCloudEntryToLocal(entry)),
        userRank: cloudRankings.userRank ? this.convertCloudEntryToLocal(cloudRankings.userRank) : null,
        totalPlayers: cloudRankings.totalPlayers,
        lastUpdated: cloudRankings.lastUpdated
      };
    } catch (error) {
      console.error('❌ Cloud rankings fetch failed:', error);
      return {
        rankings: [],
        userRank: null,
        totalPlayers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 特定スコアでの順位を計算（結果画面用）
   */
  public async getCurrentScoreRank(gameType: string, currentScore: number): Promise<{rank: number, totalPlayers: number} | null> {
    console.log('🎯 Calculating current score rank for:', gameType, 'score:', currentScore);

    try {
      const result = await this.cloudService.getCurrentScoreRank(gameType, currentScore);
      if (result) {
        console.log('✅ Current score rank calculated from cloud');
        return result;
      }
      return null;
    } catch (error) {
      console.error('❌ Cloud current score rank calculation failed:', error);
      return null;
    }
  }

  /**
   * 全ゲームのトップ1位プレイヤーを取得（クラウドのみ）
   */
  public async getAllTopPlayers(): Promise<{
    reflex: RankingEntry | null;
    target: RankingEntry | null;
    sequence: RankingEntry | null;
  }> {
    console.log('🏅 Fetching all cloud top players...');

    try {
      const cloudTopPlayers = await this.cloudService.getAllTopPlayers();
      console.log('✅ Cloud top players fetched successfully');
      
      return {
        reflex: cloudTopPlayers.reflex ? this.convertCloudEntryToLocal(cloudTopPlayers.reflex) : null,
        target: cloudTopPlayers.target ? this.convertCloudEntryToLocal(cloudTopPlayers.target) : null,
        sequence: cloudTopPlayers.sequence ? this.convertCloudEntryToLocal(cloudTopPlayers.sequence) : null
      };
    } catch (error) {
      console.error('❌ Cloud top players fetch failed:', error);
      return { reflex: null, target: null, sequence: null };
    }
  }

  /**
   * システム状態を取得
   */
  public async getSystemStatus(): Promise<{
    cloudAvailable: boolean;
    currentMode: 'cloud';
  }> {
    let cloudAvailable = false;

    // クラウド可用性チェック
    try {
      await this.cloudService.getRankings('reflex', 1);
      cloudAvailable = true;
    } catch (error) {
      cloudAvailable = false;
    }

    return {
      cloudAvailable,
      currentMode: 'cloud'
    };
  }

  /**
   * CloudRankingResultをRankingDataに変換
   */
  private convertCloudToLocal(cloudResult: CloudRankingResult): RankingData {
    return {
      rankings: cloudResult.rankings.map(entry => this.convertCloudEntryToLocal(entry)),
      userRank: cloudResult.userRank ? this.convertCloudEntryToLocal(cloudResult.userRank) : null,
      totalPlayers: cloudResult.totalPlayers,
      lastUpdated: cloudResult.lastUpdated
    };
  }

  /**
   * CloudRankingEntryをRankingEntryに変換
   */
  private convertCloudEntryToLocal(cloudEntry: CloudRankingEntry): RankingEntry {
    return {
      rank: cloudEntry.rank,
      userId: cloudEntry.userId,
      username: cloudEntry.username,
      displayName: cloudEntry.displayName,
      score: cloudEntry.score,
      timestamp: cloudEntry.timestamp,
      isCurrentUser: cloudEntry.isCurrentUser
    };
  }

  /**
   * 全ユーザーの総プレイ回数を取得
   */
  public async getTotalPlayCount(gameType: string): Promise<number> {
    console.log(`🔍 CloudRankingService: Getting total play count for ${gameType}`);
    
    try {
      console.log(`🔍 CloudRankingService: Attempting to get total play count from cloud for ${gameType}`);
      // クラウドから全ユーザーの総プレイ回数を取得
      const cloudResult = await this.cloudService.getRankings(gameType, 10000); // 大きな数で全データ取得
      console.log(`🔍 CloudRankingService: Cloud result for ${gameType}:`, {
        totalCount: cloudResult.totalCount,
        rankingsLength: cloudResult.rankings.length,
        totalPlayers: cloudResult.totalPlayers
      });
      return cloudResult.totalCount || 0;
    } catch (error) {
      console.error(`❌ CloudRankingService: Failed to get total play count for ${gameType}:`, error);
      return 0;
    }
  }

  /**
   * 現在ユーザーの個人プレイ回数を取得（クラウドから）
   */
  public async getUserPlayCount(gameType: string): Promise<number> {
    try {
      // クラウドから現在ユーザーの全プレイ記録を取得
      const cloudResult = await this.cloudService.getRankings(gameType, 10000);
      // 現在ユーザーのスコア数をカウント
      const userScores = cloudResult.rankings.filter(entry => entry.isCurrentUser);
      return userScores.length;
    } catch (error) {
      console.error('Failed to get user play count from cloud:', error);
      return 0;
    }
  }
}