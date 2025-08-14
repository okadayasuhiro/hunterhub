/**
 * AWS DynamoDB Cloud Ranking Service
 * LocalStorageからクラウドDBへの移行用サービス
 */

import { generateClient } from 'aws-amplify/api';
import { createGameScore, createUserProfile, updateUserProfile } from '../graphql/mutations';
import { listGameScores, getUserProfile } from '../graphql/queries';
import type { 
  CreateGameScoreInput, 
  CreateUserProfileInput,
  UpdateUserProfileInput,
  GameScore,
  UserProfile,
  ModelGameScoreFilterInput,
  ModelUserProfileFilterInput
} from '../API';
import { UserIdentificationService } from './userIdentificationService';

export interface CloudRankingEntry {
  rank: number;
  userId: string;
  username?: string;
  displayName: string;
  score: number;
  timestamp: string;
  isCurrentUser: boolean;
}

export interface CloudRankingResult {
  rankings: CloudRankingEntry[];
  userRank: CloudRankingEntry | null;
  totalPlayers: number;
  lastUpdated: string;
}

export class CloudRankingService {
  private static instance: CloudRankingService;
  private client = generateClient();
  private userService: UserIdentificationService;

  private constructor() {
    this.userService = UserIdentificationService.getInstance();
  }

  public static getInstance(): CloudRankingService {
    if (!CloudRankingService.instance) {
      CloudRankingService.instance = new CloudRankingService();
    }
    return CloudRankingService.instance;
  }

  /**
   * ゲームスコアをクラウドDBに保存
   */
  public async submitScore(gameType: string, score: number, metadata?: any): Promise<void> {
    try {
      const userId = await this.userService.getCurrentUserId();
      const username = await this.userService.getUsername();
      const displayName = username || `ユーザー${userId.substring(0, 6)}`;
      
      const input: CreateGameScoreInput = {
        userId,
        gameType,
        score,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        displayName
      };

      console.log('🌐 Submitting score to cloud:', input);
      
      const result = await this.client.graphql({
        query: createGameScore,
        variables: { input }
      });

      console.log('✅ Cloud score submission successful:', result);

      // ユーザープロファイルも更新
      await this.updateUserProfile();

    } catch (error) {
      console.error('❌ Failed to submit score to cloud:', error);
      throw error;
    }
  }

  /**
   * 特定ゲームタイプのランキングを取得
   */
  public async getRankings(gameType: string, limit: number = 10): Promise<CloudRankingResult> {
    try {
      const userId = await this.userService.getCurrentUserId();
      
      const filter: ModelGameScoreFilterInput = {
        gameType: { eq: gameType }
      };

      console.log('🌐 Fetching cloud rankings for:', gameType);

      const result = await this.client.graphql({
        query: listGameScores,
        variables: { 
          filter,
          limit: 1000 // 大きな値で全データ取得後、クライアントサイドでソート
        }
      });

      const gameScores = result.data?.listGameScores?.items || [];
      
      // スコアでソート（ゲームタイプに応じて）
      const sortedScores = this.sortScoresByGameType(gameScores as GameScore[], gameType);
      
      // ユーザー別の最高スコアのみを取得
      const userBestScores = this.getBestScorePerUser(sortedScores);
      
      // ランキング形式に変換
      const rankings: CloudRankingEntry[] = userBestScores.slice(0, limit).map((score, index) => ({
        rank: index + 1,
        userId: score.userId,
        username: score.displayName || undefined,
        displayName: score.displayName || `ユーザー${score.userId.substring(0, 6)}`,
        score: score.score,
        timestamp: score.timestamp,
        isCurrentUser: score.userId === userId
      }));

      // 現在ユーザーのランクを検索
      const userRank = rankings.find(entry => entry.isCurrentUser) || null;

      console.log('✅ Cloud rankings fetched successfully:', rankings);

      return {
        rankings,
        userRank,
        totalPlayers: userBestScores.length,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to fetch cloud rankings:', error);
      
      // エラー時は空のランキングを返す
      return {
        rankings: [],
        userRank: null,
        totalPlayers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * トップ1位プレイヤーを取得
   */
  public async getTopPlayer(gameType: string): Promise<CloudRankingEntry | null> {
    const result = await this.getRankings(gameType, 1);
    return result.rankings.length > 0 ? result.rankings[0] : null;
  }

  /**
   * 全ゲームのトップ1位プレイヤーを取得
   */
  public async getAllTopPlayers(): Promise<{
    reflex: CloudRankingEntry | null;
    target: CloudRankingEntry | null;
    sequence: CloudRankingEntry | null;
  }> {
    try {
      const [reflex, target, sequence] = await Promise.all([
        this.getTopPlayer('reflex'),
        this.getTopPlayer('target'),
        this.getTopPlayer('sequence')
      ]);

      return { reflex, target, sequence };
    } catch (error) {
      console.error('❌ Failed to fetch all top players:', error);
      return { reflex: null, target: null, sequence: null };
    }
  }

  /**
   * ユーザープロファイルを更新
   */
  private async updateUserProfile(): Promise<void> {
    try {
      const userId = await this.userService.getCurrentUserId();
      const username = await this.userService.getUsername();
      
      // 既存プロファイルを確認
      const filter: ModelUserProfileFilterInput = {
        userId: { eq: userId }
      };

      const existingResult = await this.client.graphql({
        query: `query ListUserProfiles($filter: ModelUserProfileFilterInput) {
          listUserProfiles(filter: $filter) {
            items {
              id
              userId
              username
              totalGamesPlayed
              createdAt
              lastActiveAt
              fingerprintQuality
            }
          }
        }`,
        variables: { filter }
      });

      const existingProfiles = (existingResult as any).data?.listUserProfiles?.items || [];
      
      if (existingProfiles.length > 0) {
        // 既存プロファイルを更新
        const profile = existingProfiles[0] as UserProfile;
        const updateInput: UpdateUserProfileInput = {
          id: profile.id,
          totalGamesPlayed: (profile.totalGamesPlayed || 0) + 1,
          lastActiveAt: new Date().toISOString(),
          username: username || profile.username
        };

        await this.client.graphql({
          query: updateUserProfile,
          variables: { input: updateInput }
        });

        console.log('✅ User profile updated successfully');
      } else {
        // 新規プロファイル作成
        const createInput: CreateUserProfileInput = {
          userId,
          username: username || undefined,
          totalGamesPlayed: 1,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          fingerprintQuality: 100
        };

        await this.client.graphql({
          query: createUserProfile,
          variables: { input: createInput }
        });

        console.log('✅ User profile created successfully');
      }
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
    }
  }

  /**
   * ゲームタイプに応じてスコアをソート
   */
  private sortScoresByGameType(scores: GameScore[], gameType: string): GameScore[] {
    return scores.sort((a, b) => {
      // reflex, target: 小さいほど良い（ミリ秒）
      // sequence: 大きいほど良い（スコア）
      if (gameType === 'sequence') {
        return b.score - a.score; // 降順
      } else {
        return a.score - b.score; // 昇順
      }
    });
  }

  /**
   * ユーザー別の最高スコアのみを取得
   */
  private getBestScorePerUser(scores: GameScore[]): GameScore[] {
    const userScores = new Map<string, GameScore>();
    
    scores.forEach(score => {
      const existing = userScores.get(score.userId);
      if (!existing) {
        userScores.set(score.userId, score);
      } else {
        // より良いスコアの場合は更新
        const gameType = score.gameType;
        if (gameType === 'sequence') {
          // sequence: 大きいほど良い
          if (score.score > existing.score) {
            userScores.set(score.userId, score);
          }
        } else {
          // reflex, target: 小さいほど良い
          if (score.score < existing.score) {
            userScores.set(score.userId, score);
          }
        }
      }
    });

    return Array.from(userScores.values());
  }

  /**
   * LocalStorageからクラウドDBへのデータ移行
   */
  public async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('🔄 Starting migration from LocalStorage to Cloud DB...');
      
      // LocalStorageからデータを取得
      const localScores = localStorage.getItem('hunterhub_global_scores');
      if (!localScores) {
        console.log('ℹ️ No local scores to migrate');
        return;
      }

      const scores = JSON.parse(localScores);
      console.log('📊 Found local scores to migrate:', scores.length);

      // 各スコアをクラウドに移行
      for (const score of scores) {
        try {
          await this.submitScore(score.gameType, score.score, score.metadata);
          console.log('✅ Migrated score:', score);
        } catch (error) {
          console.error('❌ Failed to migrate score:', score, error);
        }
      }

      console.log('🎉 Migration completed successfully');
      
      // 移行完了後、LocalStorageをバックアップとして保持
      localStorage.setItem('hunterhub_global_scores_backup', localScores);
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}