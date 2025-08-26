import { GameHistoryService } from './gameHistoryService';
import { HybridRankingService } from './hybridRankingService';
import type { RankingEntry } from './hybridRankingService';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory } from '../types/game';

/**
 * HomePage用の統合データ型定義
 */
export interface HomePageData {
  lastResults: {
    reflex?: {
      primaryStat: string;
      primaryValue: string;
      date: string;
    };
    target?: {
      primaryStat: string;
      primaryValue: string;
      date: string;
    };
    sequence?: {
      primaryStat: string;
      primaryValue: string;
      date: string;
    };
  };
  playCounts: {
    reflex: number;
    target: number;
    sequence: number;
  };
  topPlayers: {
    reflex?: RankingEntry | null;
    target?: RankingEntry | null;
    sequence?: RankingEntry | null;
  };
  loadTime: number;
}

/**
 * HomePage専用の統合データ取得サービス
 * 複数のAPI呼び出しを1回の呼び出しに統合してパフォーマンスを最適化
 */
export class HomePageService {
  private static instance: HomePageService;
  private gameHistoryService: GameHistoryService;
  private hybridRankingService: HybridRankingService;

  private constructor() {
    this.gameHistoryService = GameHistoryService.getInstance();
    this.hybridRankingService = HybridRankingService.getInstance();
  }

  public static getInstance(): HomePageService {
    if (!HomePageService.instance) {
      HomePageService.instance = new HomePageService();
    }
    return HomePageService.instance;
  }

  /**
   * HomePage用の全データを統合取得（Phase 3最適化）
   * 従来の7回のAPI呼び出しを1回に統合
   */
  public async getHomePageDataOptimized(): Promise<HomePageData> {
    const startTime = performance.now();
    
    try {
      console.log('🚀 Phase 3: Starting integrated HomePage data fetch...');

      // 並列実行で全データを取得（最適化済みメソッドを使用）
      const [
        // 最新ゲーム履歴（3ゲーム分）
        reflexLatest,
        targetLatest, 
        sequenceLatest,
        // 総プレイ回数（3ゲーム分）
        reflexPlayCount,
        targetPlayCount,
        sequencePlayCount,
        // トッププレイヤー（3ゲーム分を一括取得）
        topPlayersData
      ] = await Promise.all([
        // GameHistory最適化版（limit=1）
        this.gameHistoryService.getLatestGameHistory<ReflexGameHistory>('reflex'),
        this.gameHistoryService.getLatestGameHistory<TargetTrackingHistory>('target'),
        this.gameHistoryService.getLatestGameHistory<SequenceGameHistory>('sequence'),
        
        // PlayCount最適化版（最小限クエリ）
        this.hybridRankingService.getTotalPlayCountOptimized('reflex'),
        this.hybridRankingService.getTotalPlayCountOptimized('target'),
        this.hybridRankingService.getTotalPlayCountOptimized('sequence'),
        
        // TopPlayers最適化版（一括取得）
        this.hybridRankingService.getAllTopPlayersOptimized()
      ]);

      // データ変換・整形
      const lastResults: HomePageData['lastResults'] = {};
      
      if (reflexLatest) {
        lastResults.reflex = {
          primaryStat: '平均反応時間',
          primaryValue: `${(reflexLatest.averageTime / 1000).toFixed(5)}s`,
          date: new Date(reflexLatest.date).toLocaleDateString('ja-JP')
        };
      }
      
      if (targetLatest) {
        lastResults.target = {
          primaryStat: '総合時間',
          primaryValue: `${(targetLatest.totalTime / 1000).toFixed(3)}s`,
          date: new Date(targetLatest.date).toLocaleDateString('ja-JP')
        };
      }
      
      if (sequenceLatest) {
        lastResults.sequence = {
          primaryStat: '完了時間',
          primaryValue: `${(sequenceLatest.completionTime / 1000).toFixed(3)}s`,
          date: new Date(sequenceLatest.date).toLocaleDateString('ja-JP')
        };
      }

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      const result: HomePageData = {
        lastResults,
        playCounts: {
          reflex: reflexPlayCount || 0,
          target: targetPlayCount || 0,
          sequence: sequencePlayCount || 0
        },
        topPlayers: {
          reflex: topPlayersData.reflex,
          target: topPlayersData.target,
          sequence: topPlayersData.sequence
        },
        loadTime
      };

      console.log(`✅ Phase 3: Integrated data fetch completed in ${loadTime.toFixed(2)}ms`);
      console.log('📊 Phase 3: Data summary:', {
        hasReflexHistory: !!reflexLatest,
        hasTargetHistory: !!targetLatest,
        hasSequenceHistory: !!sequenceLatest,
        playCounts: result.playCounts,
        hasTopPlayers: {
          reflex: !!result.topPlayers.reflex,
          target: !!result.topPlayers.target,
          sequence: !!result.topPlayers.sequence
        }
      });

      return result;

    } catch (error) {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.error('❌ Phase 3: Integrated data fetch failed:', error);
      
      // エラー時のフォールバック（空データ）
      return {
        lastResults: {},
        playCounts: {
          reflex: 0,
          target: 0,
          sequence: 0
        },
        topPlayers: {
          reflex: null,
          target: null,
          sequence: null
        },
        loadTime
      };
    }
  }

  /**
   * LocalStorageからクラウドへの移行処理
   * HomePage読み込み時に1回だけ実行
   */
  public async migrateLocalToCloud(): Promise<void> {
    try {
      await this.gameHistoryService.migrateLocalToCloud();
    } catch (error) {
      console.error('❌ Failed to migrate local data to cloud:', error);
    }
  }
}
