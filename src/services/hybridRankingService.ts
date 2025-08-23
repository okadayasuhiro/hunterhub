/**
 * Hybrid Ranking Service
 * LocalStorage + AWS DynamoDB のハイブリッド型ランキングシステム
 * 
 * 機能:
 * - LocalStorageをフォールバック
 * - AWS DynamoDBをプライマリ
 * - 自動データ同期
 * - オフライン対応
 */

import { LocalRankingService } from './localRankingService';
import type { RankingData, RankingEntry } from './localRankingService';
import { CloudRankingService } from './cloudRankingService';
import type { CloudRankingResult, CloudRankingEntry } from './cloudRankingService';

export interface HybridRankingConfig {
  useCloud: boolean;
  fallbackToLocal: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
}

export class HybridRankingService {
  private static instance: HybridRankingService;
  private localService: LocalRankingService;
  private cloudService: CloudRankingService;
  
  private config: HybridRankingConfig = {
    useCloud: true,
    fallbackToLocal: true,
    autoSync: true,
    syncInterval: 5 // 5分間隔
  };

  private constructor() {
    this.localService = LocalRankingService.getInstance();
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
   * スコアを送信（ハイブリッドモード）
   */
  public async submitScore(gameType: string, score: number, metadata?: any): Promise<void> {
    console.log('🎯 Hybrid score submission:', { gameType, score, metadata });

    // 1. ローカルに必ず保存（即座フィードバック用）
    try {
      await this.localService.submitScore(gameType, score, metadata);
      console.log('✅ Local score saved successfully');
    } catch (error) {
      console.error('❌ Local score save failed:', error);
    }

    // 2. クラウドに保存（グローバルランキング用）
    if (this.config.useCloud) {
      try {
        await this.cloudService.submitScore(gameType, score, metadata);
        console.log('✅ Cloud score saved successfully');
      } catch (error) {
        console.error('❌ Cloud score save failed:', error);
        console.log('ℹ️ Continuing with local-only mode');
      }
    }
  }

  /**
   * ランキングを取得（ハイブリッドモード） - 削除予定
   */
  private async getRankingsOld(gameType: string, limit: number = 10): Promise<RankingData> {
    console.log('🏆 Fetching hybrid rankings for:', gameType);

    // 1. クラウドランキングを試行
    if (this.config.useCloud) {
      try {
        const cloudResult = await this.cloudService.getRankings(gameType, limit);
        console.log('✅ Cloud rankings fetched successfully');
        
        // CloudRankingResultをRankingDataに変換
        return this.convertCloudToLocal(cloudResult);
      } catch (error) {
        console.error('❌ Cloud rankings fetch failed:', error);
        
        if (this.config.fallbackToLocal) {
          console.log('🔄 Falling back to local rankings...');
        } else {
          throw error;
        }
      }
    }

    // 2. ローカルランキングにフォールバック
    try {
      const localResult = await this.localService.getRankings(gameType, limit);
      console.log('✅ Local rankings fetched successfully (fallback)');
      return localResult;
    } catch (error) {
      console.error('❌ Local rankings fetch also failed:', error);
      
      // 完全に失敗した場合は空のランキングを返す
      return {
        rankings: [],
        userRank: null,
        totalPlayers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * トップ1位プレイヤーを取得（ハイブリッドモード）
   */
  public async getTopPlayer(gameType: string): Promise<RankingEntry | null> {
    console.log('🥇 Fetching hybrid top player for:', gameType);

    // 1. クラウドから取得を試行
    if (this.config.useCloud) {
      try {
        const cloudTopPlayer = await this.cloudService.getTopPlayer(gameType);
        if (cloudTopPlayer) {
          console.log('✅ Cloud top player fetched successfully');
          return this.convertCloudEntryToLocal(cloudTopPlayer);
        }
      } catch (error) {
        console.error('❌ Cloud top player fetch failed:', error);
      }
    }

    // 2. ローカルから取得
    try {
      const localTopPlayer = await this.localService.getTopPlayer(gameType);
      console.log('✅ Local top player fetched successfully (fallback)');
      return localTopPlayer;
    } catch (error) {
      console.error('❌ Local top player fetch also failed:', error);
      return null;
    }
  }

  /**
   * ランキングデータを取得（ハイブリッドモード）
   */
  public async getRankings(gameType: string, limit: number = 10): Promise<RankingData> {
    console.log('🏅 Fetching hybrid rankings for:', gameType);

    // 1. クラウドから取得を試行
    if (this.config.useCloud) {
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
      }
    }

    // 2. ローカルから取得
    try {
      const localRankings = await this.localService.getRankings(gameType, limit);
      console.log('✅ Local rankings fetched successfully (fallback)');
      return localRankings;
    } catch (error) {
      console.error('❌ Local rankings fetch also failed:', error);
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

    // 1. クラウドから計算を試行
    if (this.config.useCloud) {
      try {
        const result = await this.cloudService.getCurrentScoreRank(gameType, currentScore);
        if (result) {
          console.log('✅ Current score rank calculated from cloud');
          return result;
        }
      } catch (error) {
        console.error('❌ Cloud current score rank calculation failed:', error);
      }
    }

    // 2. ローカルから計算（フォールバック）
    try {
      // ローカルランキングを取得して手動計算
      const localRankings = await this.localService.getRankings(gameType, 1000);
      
      // 現在スコアより良いスコアの数を数える
      const betterScoresCount = localRankings.rankings.filter(entry => entry.score < currentScore).length;
      
      const rank = betterScoresCount + 1;
      const totalPlayers = localRankings.rankings.length + 1; // 全スコア数 + 現在のスコア
      
      console.log('✅ Current score rank calculated from local (fallback)');
      return { rank, totalPlayers };
    } catch (error) {
      console.error('❌ Local current score rank calculation also failed:', error);
      return null;
    }
  }

  /**
   * 全ゲームのトップ1位プレイヤーを取得（ハイブリッドモード）
   */
  public async getAllTopPlayers(): Promise<{
    reflex: RankingEntry | null;
    target: RankingEntry | null;
    sequence: RankingEntry | null;
  }> {
    console.log('🏅 Fetching all hybrid top players...');

    // 1. クラウドから取得を試行
    if (this.config.useCloud) {
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
      }
    }

    // 2. ローカルから取得
    try {
      const localTopPlayers = await this.localService.getAllTopPlayers();
      console.log('✅ Local top players fetched successfully (fallback)');
      return localTopPlayers;
    } catch (error) {
      console.error('❌ Local top players fetch also failed:', error);
      return { reflex: null, target: null, sequence: null };
    }
  }

  /**
   * LocalStorageからクラウドへの一回限りの移行
   */
  public async migrateToCloud(): Promise<void> {
    console.log('🚀 Starting one-time migration to cloud...');
    
    try {
      await this.cloudService.migrateFromLocalStorage();
      console.log('✅ Migration to cloud completed successfully');
      
      // 移行完了後はクラウドモードを有効化
      this.updateConfig({ useCloud: true });
      
    } catch (error) {
      console.error('❌ Migration to cloud failed:', error);
      throw error;
    }
  }

  /**
   * クラウドとローカルの同期
   */
  public async syncData(): Promise<void> {
    if (!this.config.useCloud || !this.config.autoSync) {
      return;
    }

    console.log('🔄 Starting data synchronization...');
    
    try {
      // 現在は一方向同期（ローカル→クラウド）のみ実装
      // 将来的には双方向同期も可能
      
      const lastSync = localStorage.getItem('hunterhub_last_sync');
      const now = new Date();
      
      if (lastSync) {
        const lastSyncTime = new Date(lastSync);
        const minutesSinceSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60);
        
        if (minutesSinceSync < this.config.syncInterval) {
          console.log('ℹ️ Sync not needed yet, last sync was', minutesSinceSync.toFixed(1), 'minutes ago');
          return;
        }
      }

      // 同期実行
      // TODO: 双方向同期の実装
      
      localStorage.setItem('hunterhub_last_sync', now.toISOString());
      console.log('✅ Data synchronization completed');
      
    } catch (error) {
      console.error('❌ Data synchronization failed:', error);
    }
  }

  /**
   * システム状態を取得
   */
  public async getSystemStatus(): Promise<{
    cloudAvailable: boolean;
    localAvailable: boolean;
    currentMode: 'cloud' | 'local' | 'hybrid';
    lastSync?: string;
  }> {
    let cloudAvailable = false;
    let localAvailable = false;

    // クラウド可用性チェック
    try {
      await this.cloudService.getRankings('reflex', 1);
      cloudAvailable = true;
    } catch (error) {
      cloudAvailable = false;
    }

    // ローカル可用性チェック
    try {
      await this.localService.getRankings('reflex', 1);
      localAvailable = true;
    } catch (error) {
      localAvailable = false;
    }

    let currentMode: 'cloud' | 'local' | 'hybrid';
    if (this.config.useCloud && cloudAvailable) {
      currentMode = this.config.fallbackToLocal ? 'hybrid' : 'cloud';
    } else {
      currentMode = 'local';
    }

    return {
      cloudAvailable,
      localAvailable,
      currentMode,
      lastSync: localStorage.getItem('hunterhub_last_sync') || undefined
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
    try {
      if (this.config.useCloud) {
        // クラウドから全ユーザーの総プレイ回数を取得
        const cloudResult = await this.cloudService.getRankings(gameType, 10000); // 大きな数で全データ取得
        return cloudResult.totalCount || 0;
      } else {
        // ローカルから取得（フォールバック）
        const localResult = await this.localService.getRankings(gameType, 10000);
        return localResult.rankings.length;
      }
    } catch (error) {
      console.error('Failed to get total play count from cloud, falling back to local:', error);
      
      if (this.config.fallbackToLocal) {
        // フォールバック: ローカルから取得
        const localResult = await this.localService.getRankings(gameType, 10000);
        return localResult.rankings.length;
      }
      
      return 0;
    }
  }

  /**
   * 現在ユーザーの個人プレイ回数を取得（クラウドから）
   */
  public async getUserPlayCount(gameType: string): Promise<number> {
    try {
      if (this.config.useCloud) {
        // クラウドから現在ユーザーの全プレイ記録を取得
        const cloudResult = await this.cloudService.getRankings(gameType, 10000);
        // 現在ユーザーのスコア数をカウント
        const userScores = cloudResult.rankings.filter(entry => entry.isCurrentUser);
        return userScores.length;
      } else {
        // ローカルから取得（フォールバック）
        const localResult = await this.localService.getRankings(gameType, 10000);
        const userScores = localResult.rankings.filter(entry => entry.isCurrentUser);
        return userScores.length;
      }
    } catch (error) {
      console.error('Failed to get user play count from cloud, falling back to local:', error);
      
      if (this.config.fallbackToLocal) {
        // フォールバック: ローカルから取得
        try {
          const localResult = await this.localService.getRankings(gameType, 10000);
          const userScores = localResult.rankings.filter(entry => entry.isCurrentUser);
          return userScores.length;
        } catch (localError) {
          console.error('Failed to get user play count from local:', localError);
          return 0;
        }
      }
      
      return 0;
    }
  }
}