import { GameHistoryService } from './gameHistoryService';
import { HybridRankingService, type RankingEntry } from './hybridRankingService';
import { UserIdentificationService } from './userIdentificationService';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory } from '../types/game';

export interface HomePageData {
  lastResults: {
    reflex?: { primaryStat: string; primaryValue: string; date: string };
    target?: { primaryStat: string; primaryValue: string; secondaryStat: string; secondaryValue: string; date: string };
    sequence?: { primaryStat: string; primaryValue: string; secondaryStat: string; secondaryValue: string; date: string };
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
  loadTime: number; // 読み込み時間を追加
}

export class HomePageService {
  private static instance: HomePageService;
  private gameHistoryService: GameHistoryService;
  private hybridRankingService: HybridRankingService;
  private userService: UserIdentificationService;

  private constructor() {
    this.gameHistoryService = GameHistoryService.getInstance();
    this.hybridRankingService = HybridRankingService.getInstance();
    this.userService = UserIdentificationService.getInstance();
  }

  public static getInstance(): HomePageService {
    if (!HomePageService.instance) {
      HomePageService.instance = new HomePageService();
    }
    return HomePageService.instance;
  }

  public async migrateLocalToCloud(): Promise<void> {
    await this.gameHistoryService.migrateLocalToCloud();
  }

  public async getHomePageDataOptimized(): Promise<HomePageData> {
    const startTime = performance.now();
    try {
      const userId = await this.userService.getCurrentUserId();

      // 7つのAPI呼び出しを並列実行で統合
      const [
        reflexLatest,
        targetLatest,
        sequenceLatest,
        reflexPlayCount,
        targetPlayCount,
        sequencePlayCount,
        topPlayers
      ] = await Promise.all([
        this.gameHistoryService.getLatestGameHistory<ReflexGameHistory>('reflex'),
        this.gameHistoryService.getLatestGameHistory<TargetTrackingHistory>('target'),
        this.gameHistoryService.getLatestGameHistory<SequenceGameHistory>('sequence'),
        this.hybridRankingService.getTotalPlayCountOptimized('reflex'),
        this.hybridRankingService.getTotalPlayCountOptimized('target'),
        this.hybridRankingService.getTotalPlayCountOptimized('sequence'),
        this.hybridRankingService.getAllTopPlayersOptimized()
      ]);

      // 前回記録の整形
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
          primaryStat: '合計時間',
          primaryValue: `${targetLatest.totalTime.toFixed(3)}s`,
          secondaryStat: '平均反応',
          secondaryValue: `${targetLatest.averageReactionTime.toFixed(3)}s`,
          date: new Date(targetLatest.date).toLocaleDateString('ja-JP')
        };
      }
      if (sequenceLatest) {
        lastResults.sequence = {
          primaryStat: '完了時間',
          primaryValue: `${sequenceLatest.completionTime.toFixed(3)}s`,
          secondaryStat: '平均タップ間隔',
          secondaryValue: `${sequenceLatest.averageClickInterval.toFixed(3)}s`,
          date: new Date(sequenceLatest.date).toLocaleDateString('ja-JP')
        };
      }

      const playCounts: HomePageData['playCounts'] = {
        reflex: reflexPlayCount,
        target: targetPlayCount,
        sequence: sequencePlayCount,
      };

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`🚀 Phase 3最適化: ホームページデータ統合取得完了 (${loadTime.toFixed(2)}ms)`);

      return {
        lastResults,
        playCounts,
        topPlayers,
        loadTime
      };
    } catch (error) {
      console.error('❌ HomePageService統合取得エラー:', error);
      throw error;
    }
  }
}