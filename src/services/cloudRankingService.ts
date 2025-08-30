/**
 * AWS DynamoDB Cloud Ranking Service
 * LocalStorageからクラウドDBへの移行用サービス
 */

import { generateClient } from 'aws-amplify/api';
import { createGameScore, createUserProfile, updateUserProfile } from '../graphql/mutations';
import { listGameScores, getUserProfile, listUserProfiles, userProfilesByUserId } from '../graphql/queries';
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
  xLinked?: boolean;
  xDisplayName?: string;
  xProfileImageUrl?: string;
}

export interface CloudRankingResult {
  rankings: CloudRankingEntry[];
  userRank: CloudRankingEntry | null;
  totalPlayers: number;
  totalCount: number;
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



      // ユーザープロファイルも更新
      await this.updateUserProfile();

    } catch (error) {
      console.error('Failed to submit score to cloud:', error);
      throw error;
    }
  }

  /**
   * 複数ユーザーのUserProfileを個別取得
   */
  private async getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
    const profileMap = new Map<string, UserProfile>();
    
    // 個別取得で安全に処理
    const profilePromises = userIds.map(async (userId) => {
      try {
        const result = await this.client.graphql({
          query: userProfilesByUserId,
          variables: {
            userId: userId,
            limit: 1
          }
        });
        
        const profiles = result.data?.userProfilesByUserId?.items || [];
        if (profiles.length > 0) {
          return { userId, profile: profiles[0] as UserProfile };
        }
        return null;
      } catch (error) {
        console.warn(`Failed to fetch profile for user ${userId.substring(0, 8)}...`);
        return null;
      }
    });
    
    try {
      const results = await Promise.all(profilePromises);
      results.forEach(result => {
        if (result && result.profile) {
          profileMap.set(result.userId, result.profile);
        }
      });
    } catch (error) {
      console.error('Failed to fetch user profiles:', error);
    }
    
    return profileMap;
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



      const result = await this.client.graphql({
        query: listGameScores,
        variables: { 
          filter
          // limitを削除して全データを取得
        }
      });

      const gameScores = result.data?.listGameScores?.items || [];
      
      // デバッグ: 生データの確認
      // console.log(`🔍 Debug: Raw scores count for ${gameType}:`, gameScores.length);
      // console.log(`🔍 Debug: Raw scores sample:`, gameScores.slice(0, 3).map(s => ({
      //   userId: s.userId.substring(0, 8),
      //   score: s.score,
      //   displayName: s.displayName,
      //   timestamp: s.timestamp
      // })));
      
      // デバッグ: 最新のスコアを確認
      const sortedByTime = gameScores.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      // console.log(`🔍 Debug: Most recent scores for ${gameType}:`, sortedByTime.slice(0, 5).map(s => ({
      //   userId: s.userId.substring(0, 8),
      //   score: s.score,
      //   timestamp: s.timestamp,
      //   displayName: s.displayName
      // })));
      
      // 全スコアをソート（同一ユーザーの複数スコアも含む）
      const sortedScores = this.sortScoresByGameType(gameScores as GameScore[], gameType);
      
      // デバッグ: ソート後の全スコアの確認
      // console.log(`🔍 Debug: All sorted scores count for ${gameType}:`, sortedScores.length);
      // console.log(`🔍 Debug: Top 10 sorted scores sample:`, sortedScores.slice(0, 10).map(s => ({
      //   userId: s.userId.substring(0, 8),
      //   score: s.score,
      //   displayName: s.displayName
      // })));
      
      // 全ユーザーのUserProfileを一括取得
      const userIds = sortedScores.slice(0, limit).map(score => score.userId);
      const userProfiles = await this.getUserProfiles(userIds);
      
      // デバッグ: 取得したUserProfileの詳細を出力（開発環境のみ）
      if (import.meta.env.DEV) {
        console.log(`📊 Retrieved ${userProfiles.size} user profiles for ranking`);
        userProfiles.forEach((profile, userId) => {
          console.log(`🔍 UserProfile Debug - User ${userId.slice(-4)}:`, {
            xLinked: profile.xLinked,
            xDisplayName: profile.xDisplayName,
            xProfileImageUrl: profile.xProfileImageUrl,
            username: profile.username
          });
        });
      }
      
      // 現在ユーザーのX連携情報を事前取得（UserServiceを優先）
      let currentUserXLinked = false;
      let currentUserXDisplayName: string | null = null;
      
      try {
        // UserService（LocalStorage）を最優先で確認
        currentUserXLinked = await this.userService.isXLinked();
        if (currentUserXLinked) {
          currentUserXDisplayName = await this.userService.getDisplayName();
        }
      } catch (error) {
        // UserServiceが失敗した場合のみDynamoDBから取得
        const currentUserProfile = userProfiles.get(userId);
        if (currentUserProfile?.xLinked && currentUserProfile.xDisplayName) {
          currentUserXLinked = true;
          currentUserXDisplayName = currentUserProfile.xDisplayName;
        }
      }

      // ランキング形式に変換
      const rankings: CloudRankingEntry[] = await Promise.all(sortedScores.slice(0, limit).map(async (score, index) => {
        let finalDisplayName = `ユーザー${score.userId.substring(0, 6)}`;
        let finalUsername = undefined;

        // 現在ユーザーの場合はUserService（LocalStorage）を最優先
        if (score.userId === userId) {
          if (currentUserXLinked && currentUserXDisplayName) {
            if (!currentUserXDisplayName.startsWith('ハンター')) {
              finalDisplayName = currentUserXDisplayName;
              finalUsername = currentUserXDisplayName;
            }
          } else {
            // X連携解除時はUserServiceからハンター名を取得
            try {
              const hunterName = await this.userService.getHunterName();
              finalDisplayName = hunterName || `ユーザー${score.userId.substring(0, 6)}`;
            } catch (error) {
              finalDisplayName = `ユーザー${score.userId.substring(0, 6)}`;
            }
          }
        } else {
          // 他のユーザーの場合：現在のUserProfile状態を優先
          const userProfile = userProfiles.get(score.userId);
          if (userProfile?.xLinked && userProfile.xDisplayName) {
            // 現在X連携中の場合はX名を表示
            finalDisplayName = userProfile.xDisplayName;
            finalUsername = userProfile.xDisplayName;
          } else if (userProfile?.username) {
            // X連携していない、または解除済みの場合はusernameを表示
            finalDisplayName = userProfile.username;
          } else {
            // UserProfileが見つからない場合は過去のdisplayNameを使用（フォールバック）
            finalDisplayName = score.displayName || `ユーザー${score.userId.substring(0, 6)}`;
            finalUsername = score.displayName || undefined;
          }
        }

        // X連携情報を取得
        const userProfile = userProfiles.get(score.userId);
        const isXLinked = userProfile?.xLinked || false;
        const xDisplayName = userProfile?.xDisplayName || undefined;
        const xProfileImageUrl = userProfile?.xProfileImageUrl || undefined;
        
        // デバッグログ追加（開発環境のみ）
        if (import.meta.env.DEV) {
          console.log(`🔍 CloudRankingService Debug - User ${score.userId.slice(-4)}:`, {
            userProfile: userProfile ? 'found' : 'not found',
            isXLinked,
            xDisplayName,
            xProfileImageUrl,
            fullProfile: userProfile
          });
        }

        return {
          rank: index + 1,
          userId: score.userId,
          username: finalUsername,
          displayName: finalDisplayName,
          score: score.score,
          timestamp: score.timestamp,
          isCurrentUser: score.userId === userId,
          xLinked: isXLinked,
          xDisplayName: xDisplayName,
          xProfileImageUrl: xProfileImageUrl
        };
      }));

      // 現在ユーザーのランクを検索（ユーザー別最高スコアで計算）
      const bestScores = this.getBestScorePerUser(gameScores as GameScore[]);
      const userRank = rankings.find(entry => entry.isCurrentUser) || null;

      // 総プレイヤー数はユニークプレイヤー数
      const totalPlayers = bestScores.length;

      // プレイ回数は全期間のデータをカウント
      // console.log(`🔍 Debug: Total scores: ${gameScores.length}`);

      return {
        rankings,
        userRank,
        totalPlayers,
        totalCount: gameScores.length, // 全期間のプレイ回数
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to fetch cloud rankings:', error);
      
      // エラー時は空のランキングを返す
      return {
        rankings: [],
        userRank: null,
        totalPlayers: 0,
        totalCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 特定スコアでの順位を計算（結果画面用）
   */
  public async getCurrentScoreRank(gameType: string, currentScore: number): Promise<{rank: number, totalPlayers: number} | null> {
    try {
      const userId = await this.userService.getCurrentUserId();
      
      const filter: ModelGameScoreFilterInput = {
        gameType: { eq: gameType }
      };

      const result = await this.client.graphql({
        query: listGameScores,
        variables: { 
          filter
          // limitを削除して全データを取得
        }
      });

      const gameScores = result.data?.listGameScores?.items || [];
      
      // 全スコアから現在スコアより良いスコアの数を数える
      const betterScoresCount = gameScores.filter(score => score.score < currentScore).length;
      
      // 順位は「自分より良いスコア数 + 1」
      const rank = betterScoresCount + 1;
      // 総順位数：全スコア数 + 現在のスコア（1つ）
      const totalPlayers = gameScores.length;
      
      // 詳細デバッグ: 現在スコア周辺のスコアを確認
      const sortedAllScores = gameScores.sort((a, b) => a.score - b.score);
      const currentScoreIndex = sortedAllScores.findIndex(score => score.score >= currentScore);
      const surroundingScores = sortedAllScores.slice(Math.max(0, currentScoreIndex - 3), currentScoreIndex + 4);
      
      console.log(`🔍 Debug: Current score rank calculation:`, {
        currentScore,
        betterScoresCount,
        rank,
        totalPlayers,
        gameType,
        totalScoresCount: gameScores.length,
        userId: userId.substring(0, 8),
        surroundingScores: surroundingScores.map((s, i) => ({
          index: Math.max(0, currentScoreIndex - 3) + i + 1,
          score: s.score,
          userId: s.userId.substring(0, 8),
          isCurrentScore: s.score === currentScore ? '← CURRENT' : ''
        }))
      });
      
      return { rank, totalPlayers };

    } catch (error) {
      console.error('Failed to calculate current score rank:', error);
      return null;
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
   * 特定ゲームの1位プレイヤーを取得（最適化版）
   * Phase 2: 最小限のデータ取得でトッププレイヤーのみ取得
   */
  public async getTopPlayerOptimized(gameType: string): Promise<CloudRankingEntry | null> {
    const startTime = performance.now();
    
    try {
      const userId = await this.userService.getCurrentUserId();
      
      const filter: ModelGameScoreFilterInput = {
        gameType: { eq: gameType }
      };

      // 修正: 全データを取得して正確な1位を確保
      const result = await this.client.graphql({
        query: listGameScores,
        variables: { 
          filter
          // limitを削除して全データを取得（1位の正確性を保証）
        }
      });

      const gameScores = result.data?.listGameScores?.items || [];
      
      if (gameScores.length === 0) {
        return null;
      }
      
      // スコアソート（1位のみ必要）
      const sortedScores = this.sortScoresByGameType(gameScores as GameScore[], gameType);
      const topScore = sortedScores[0];
      
      if (!topScore) {
        return null;
      }

      // 1位プレイヤーのプロファイル取得
      const profileMap = await this.getUserProfiles([topScore.userId]);
      const profile = profileMap.get(topScore.userId);
      
      const topPlayer: CloudRankingEntry = {
        rank: 1,
        userId: topScore.userId,
        username: profile?.username || undefined,
        displayName: profile?.xDisplayName || profile?.username || topScore.displayName || `ハンター${topScore.userId.slice(-4)}`,
        score: topScore.score,
        timestamp: topScore.timestamp,
        isCurrentUser: topScore.userId === userId
      };

      const endTime = performance.now();
      if (import.meta.env.DEV) {
        console.log(`🚀 Optimized top player for ${gameType}: ${(endTime - startTime).toFixed(2)}ms`);
      }

      return topPlayer;
      
    } catch (error) {
      console.error(`❌ Failed to get optimized top player for ${gameType}:`, error);
      return null;
    }
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
   * 全ゲームのトップ1位プレイヤーを取得（最適化版）
   * Phase 2: 最小限のデータ取得で高速化
   */
  public async getAllTopPlayersOptimized(): Promise<{
    reflex: CloudRankingEntry | null;
    target: CloudRankingEntry | null;
    sequence: CloudRankingEntry | null;
  }> {
    const startTime = performance.now();
    
    try {
      const [reflex, target, sequence] = await Promise.all([
        this.getTopPlayerOptimized('reflex'),
        this.getTopPlayerOptimized('target'),
        this.getTopPlayerOptimized('sequence')
      ]);

      const endTime = performance.now();
      if (import.meta.env.DEV) {
        console.log(`🚀 Optimized all top players: ${(endTime - startTime).toFixed(2)}ms`);
      }

      return { reflex, target, sequence };
    } catch (error) {
      console.error('❌ Failed to fetch optimized all top players:', error);
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
      // reflex, target, sequence: 全て小さいほど良い（ミリ秒）
      // sequence も完了時間なので小さいほど良い
      return a.score - b.score; // 昇順（小さいほど良い）
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
        // reflex, target, sequence: 全て小さいほど良い（時間ベース）
        if (score.score < existing.score) {
          userScores.set(score.userId, score);
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
      
      // 移行完了後、LocalStorageのバックアップは不要（DynamoDBが正式版）
      console.log('ℹ️ LocalStorage backup skipped - DynamoDB is now the single source of truth');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * 総プレイヤー数をCount専用クエリで取得（データ転送なし）
   * パフォーマンス最適化: データ取得せずカウントのみ
   */
  public async getTotalPlayerCount(gameType: string): Promise<number> {
    try {
      console.log(`🔍 Getting total player count for ${gameType} (count-only query)`);
      
      let totalCount = 0;
      let nextToken: string | null = null;
      
      // ページネーションでカウントのみ取得（データは取得しない）
      do {
        const variables: any = {
          filter: {
            gameType: { eq: gameType }
          },
          limit: 1000 // 大きなページサイズでカウント効率化
        };
        
        if (nextToken) {
          variables.nextToken = nextToken;
        }
        
        const result: any = await this.client.graphql({
          query: listGameScores,
          variables
        });
        
        const items = result.data?.listGameScores?.items || [];
        totalCount += items.length;
        nextToken = result.data?.listGameScores?.nextToken || null;
        
        console.log(`📊 Count batch: +${items.length}, total: ${totalCount}, hasNext: ${!!nextToken}`);
        
      } while (nextToken);
      
      console.log(`✅ Total player count for ${gameType}: ${totalCount} (optimized count)`);
      return totalCount;
      
    } catch (error) {
      console.error(`❌ Failed to get total player count for ${gameType}:`, error);
      return 0;
    }
  }

  /**
   * 総プレイヤー数を超最適化クエリで取得（Phase 2）
   * 最小限のフィールドのみ取得してデータ転送量を最小化
   */
  public async getTotalPlayerCountOptimized(gameType: string): Promise<number> {
    const startTime = performance.now();
    
    try {
      if (import.meta.env.DEV) {
        console.log(`🚀 Getting optimized total player count for ${gameType}`);
      }
      
      let totalCount = 0;
      let nextToken: string | null = null;
      
      // カスタムクエリ: idのみ取得してデータ転送量を最小化
      const minimalCountQuery = `
        query ListGameScoresMinimal($filter: ModelGameScoreFilterInput, $limit: Int, $nextToken: String) {
          listGameScores(filter: $filter, limit: $limit, nextToken: $nextToken) {
            items {
              id
            }
            nextToken
          }
        }
      `;
      
      // ページネーションで最小限データのみ取得
      do {
        const variables: any = {
          filter: {
            gameType: { eq: gameType }
          },
          limit: 2000 // より大きなページサイズで効率化
        };
        
        if (nextToken) {
          variables.nextToken = nextToken;
        }
        
        const result: any = await this.client.graphql({
          query: minimalCountQuery,
          variables
        });
        
        const items = result.data?.listGameScores?.items || [];
        totalCount += items.length;
        nextToken = result.data?.listGameScores?.nextToken || null;
        
        if (import.meta.env.DEV) {
          console.log(`🚀 Optimized count batch: +${items.length}, total: ${totalCount}, hasNext: ${!!nextToken}`);
        }
        
      } while (nextToken);
      
      const endTime = performance.now();
      if (import.meta.env.DEV) {
        console.log(`🚀 Optimized total player count for ${gameType}: ${totalCount} (${(endTime - startTime).toFixed(2)}ms)`);
      }
      
      return totalCount;
      
    } catch (error) {
      console.error(`❌ Failed to get optimized total player count for ${gameType}:`, error);
      // フォールバック: 従来版を使用
      return this.getTotalPlayerCount(gameType);
    }
  }

  /**
   * 現在スコアの順位を最適化クエリで計算
   * パフォーマンス最適化: 上位10件のみ取得 + Count専用クエリ
   */
  public async getCurrentScoreRankOptimized(gameType: string, currentScore: number): Promise<any> {
    try {
      console.log(`🎯 Calculating optimized rank for ${gameType}, score: ${currentScore}`);
      
      // 1. 上位10件のみ取得
      const top10Result = await this.getRankings(gameType, 10);
      console.log(`📊 Top 10 fetched: ${top10Result.rankings.length} entries`);
      
      // 2. 総プレイヤー数をCount専用で取得
      const totalPlayers = await this.getTotalPlayerCount(gameType);
      console.log(`👥 Total players: ${totalPlayers}`);
      
      // 3. 10位以内判定
      if (top10Result.rankings.length < 10) {
        // 全体で10人未満の場合
        const exactRank = this.calculateExactRank(currentScore, top10Result.rankings);
        console.log(`✅ Small pool rank: ${exactRank}/${totalPlayers}`);
        return {
          rank: exactRank,
          totalPlayers,
          isTop10: true,
          top10Threshold: null
        };
      }
      
      const top10Threshold = top10Result.rankings[9].score; // 10位のスコア
      console.log(`🎯 10th place threshold: ${top10Threshold}, current: ${currentScore}`);
      
      if (currentScore <= top10Threshold) {
        // 10位以内の場合
        const exactRank = this.calculateExactRank(currentScore, top10Result.rankings);
        console.log(`✅ Top 10 rank: ${exactRank}/${totalPlayers}`);
        return {
          rank: exactRank,
          totalPlayers,
          isTop10: true,
          top10Threshold
        };
      } else {
        // ランキング圏外の場合
        console.log(`📍 Out of ranking: score ${currentScore} > threshold ${top10Threshold}`);
        return {
          rank: null,
          totalPlayers,
          isTop10: false,
          top10Threshold
        };
      }
      
    } catch (error) {
      console.error(`❌ Failed to calculate optimized rank for ${gameType}:`, error);
      return {
        rank: null,
        totalPlayers: 0,
        isTop10: false
      };
    }
  }

  /**
   * 上位10件内での正確な順位を計算
   */
  private calculateExactRank(currentScore: number, topRankings: CloudRankingEntry[]): number {
    // 現在スコアより良いスコアの数を数える
    const betterScoresCount = topRankings.filter(entry => entry.score < currentScore).length;
    const rank = betterScoresCount + 1;
    console.log(`🔢 Exact rank calculation: ${betterScoresCount} better scores, rank: ${rank}`);
    return rank;
  }
}