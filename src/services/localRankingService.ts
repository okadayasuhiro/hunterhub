/**
 * ローカルランキングサービス
 * LocalStorageベースのランキングシステム（プロトタイプ版）
 * 後でサーバーサイドランキングに移行予定
 */

import { UserIdentificationService } from './userIdentificationService';

export interface GameScore {
  userId: string;
  gameType: string;
  score: number;
  timestamp: string;
  sessionId: string;
  metadata?: any;
}

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

export class LocalRankingService {
  private static instance: LocalRankingService;
  private userService: UserIdentificationService;
  
  private readonly STORAGE_KEYS = {
    GLOBAL_SCORES: 'hunterhub_global_scores',
    RANKING_CACHE: 'hunterhub_ranking_cache',
    LAST_SYNC: 'hunterhub_last_ranking_sync'
  };

  private constructor() {
    this.userService = UserIdentificationService.getInstance();
  }

  public static getInstance(): LocalRankingService {
    if (!LocalRankingService.instance) {
      LocalRankingService.instance = new LocalRankingService();
    }
    return LocalRankingService.instance;
  }

  /**
   * スコアを登録
   */
  public async submitScore(gameType: string, score: number, metadata?: any): Promise<void> {
    const userId = await this.userService.getCurrentUserId();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const gameScore: GameScore = {
      userId,
      gameType,
      score,
      timestamp: new Date().toISOString(),
      sessionId,
      metadata
    };

    // 既存スコアを取得
    const existingScores = this.getAllScores();
    
    // 新しいスコアを追加
    existingScores.push(gameScore);
    
    // 保存
    localStorage.setItem(this.STORAGE_KEYS.GLOBAL_SCORES, JSON.stringify(existingScores));
    
    console.log(`📊 Score submitted: ${gameType} - ${score} for user ${userId.substring(0, 8)}...`);
  }

  /**
   * 全スコアを取得
   */
  private getAllScores(): GameScore[] {
    try {
      const scoresData = localStorage.getItem(this.STORAGE_KEYS.GLOBAL_SCORES);
      return scoresData ? JSON.parse(scoresData) : [];
    } catch (error) {
      console.error('Failed to parse scores data:', error);
      return [];
    }
  }

  /**
   * ユーザーごとの最高スコアを計算
   */
  private calculateUserBestScores(gameScores: GameScore[]): GameScore[] {
    const userBestScores = new Map<string, GameScore>();
    
    gameScores.forEach(score => {
      const existing = userBestScores.get(score.userId);
      if (!existing || this.isBetterScore(score.score, existing.score, score.gameType)) {
        userBestScores.set(score.userId, score);
      }
    });
    
    return Array.from(userBestScores.values());
  }

  /**
   * より良いスコアかどうか判定（ゲームタイプ別）
   */
  private isBetterScore(newScore: number, existingScore: number, gameType: string): boolean {
    // 反射神経・ターゲット追跡・数字順序ゲームは時間なので小さい方が良い
    return newScore < existingScore;
  }

  /**
   * ユーザーIDからユーザー名を取得
   */
  private async getUsernameByUserId(userId: string): Promise<string | null> {
    try {
      // 現在のユーザーIDと一致する場合のみユーザー名を取得
      const currentUserId = await this.userService.getCurrentUserId();
      if (userId === currentUserId) {
        return await this.userService.getUsername();
      }
      return null;
    } catch (error) {
      console.error('Failed to get username:', error);
      return null;
    }
  }

  /**
   * ランキングデータを取得
   */
  public async getRankings(gameType: string, limit: number = 50): Promise<RankingData> {
    const userId = await this.userService.getCurrentUserId();
    const allScores = this.getAllScores();
    
    // 指定ゲームタイプのスコアをフィルタリング
    const gameScores = allScores.filter(score => score.gameType === gameType);
    
    // ユーザーごとのベストスコアを計算
    const userBestScores = this.calculateUserBestScores(gameScores);
    
    // ベストスコアをランキング順にソート（全ゲーム共通で昇順）
    const sortedRankings = userBestScores
      .sort((a, b) => {
        // reflex, target, sequence: 全て小さいほど良い（ミリ秒）
        // sequence も完了時間なので小さいほど良い
        if (a.score !== b.score) return a.score - b.score; // 昇順
        // 同じスコアの場合は日時が新しい順
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, limit);
    
    // ランキング情報を生成（ユーザー名付き）
    const rankings: RankingEntry[] = await Promise.all(
      sortedRankings.map(async (entry, index) => {
        const username = await this.getUsernameByUserId(entry.userId);
        const displayName = username || `ユーザー${entry.userId.substring(0, 6)}`;
        
        return {
          rank: index + 1,
          userId: entry.userId,
          username: username || undefined,
          displayName,
          score: entry.score,
          timestamp: entry.timestamp,
          isCurrentUser: entry.userId === userId
        };
      })
    );
    
    // 現在ユーザーのランク情報を取得
    const userRank = rankings.find(entry => entry.isCurrentUser) || null;
    
    return {
      rankings,
      userRank,
      totalPlayers: userBestScores.length, // ユニークユーザー数に修正
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 指定ゲームタイプの1位プレイヤーを取得
   */
  public async getTopPlayer(gameType: string): Promise<RankingEntry | null> {
    try {
      const rankingData = await this.getRankings(gameType, 1);
      return rankingData.rankings.length > 0 ? rankingData.rankings[0] : null;
    } catch (error) {
      console.error('Failed to get top player:', error);
      return null;
    }
  }

  /**
   * 全ゲームの1位プレイヤーを一括取得
   */
  public async getAllTopPlayers(): Promise<{
    reflex: RankingEntry | null;
    target: RankingEntry | null;
    sequence: RankingEntry | null;
  }> {
    try {
      const [reflexTop, targetTop, sequenceTop] = await Promise.all([
        this.getTopPlayer('reflex'),
        this.getTopPlayer('target'),
        this.getTopPlayer('sequence')
      ]);

      return {
        reflex: reflexTop,
        target: targetTop,
        sequence: sequenceTop
      };
    } catch (error) {
      console.error('Failed to get all top players:', error);
      return {
        reflex: null,
        target: null,
        sequence: null
      };
    }
  }

  /**
   * ユーザーの統計情報を取得
   */
  public async getUserStats(gameType?: string): Promise<{
    totalGames: number;
    bestScore: number | null;
    averageScore: number | null;
    recentGames: GameScore[];
    rank: number | null;
  }> {
    const userId = await this.userService.getCurrentUserId();
    const allScores = this.getAllScores();
    
    // ユーザーのスコアをフィルタリング
    let userScores = allScores.filter(score => score.userId === userId);
    
    if (gameType) {
      userScores = userScores.filter(score => score.gameType === gameType);
    }
    
    // 統計計算
    const totalGames = userScores.length;
    const bestScore = totalGames > 0 ? Math.min(...userScores.map(s => s.score)) : null;
    const averageScore = totalGames > 0 ? 
      userScores.reduce((sum, s) => sum + s.score, 0) / totalGames : null;
    
    // 最近のゲーム（最新5件）
    const recentGames = userScores
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    
    // ランク取得（指定ゲームタイプがある場合のみ）
    let rank: number | null = null;
    if (gameType && bestScore !== null) {
      const rankings = await this.getRankings(gameType);
      const userRankEntry = rankings.userRank;
      rank = userRankEntry ? userRankEntry.rank : null;
    }
    
    return {
      totalGames,
      bestScore,
      averageScore,
      recentGames,
      rank
    };
  }

  /**
   * データクリア（テスト用）
   */
  public clearAllRankingData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ All ranking data cleared');
  }
}
