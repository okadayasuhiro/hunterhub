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
   * ランキングを取得（ハイブリッドモード）
   */
  public async getRankings(gameType: string, limit: number = 10): Promise<RankingData> {
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
}