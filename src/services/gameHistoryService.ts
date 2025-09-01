// ゲーム履歴管理サービス（DynamoDB + LocalStorage ハイブリッド）
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory } from '../types/game';
import { STORAGE_KEYS } from '../types/game';
import { UserIdentificationService } from './userIdentificationService';
import { gameHistoriesByUserId } from '../graphql/queries';
import { ModelSortDirection } from '../API';

// Amplify設定チェック
const getClient = () => {
    try {
        return generateClient();
    } catch (error) {
        console.error('Amplify has not been configured. Please call Amplify.configure() before using this service.');
        throw error;
    }
};

// GraphQL mutations and queries
const CREATE_GAME_HISTORY = `
  mutation CreateGameHistory($input: CreateGameHistoryInput!) {
    createGameHistory(input: $input) {
      id
      userId
      gameType
      score
      details
      timestamp
      createdAt
      updatedAt
    }
  }
`;

const LIST_GAME_HISTORIES = `
  query ListGameHistories($filter: ModelGameHistoryFilterInput, $limit: Int) {
    listGameHistories(filter: $filter, limit: $limit) {
      items {
        id
        userId
        gameType
        score
        details
        timestamp
        createdAt
        updatedAt
      }
    }
  }
`;



// GameHistory型定義
interface CloudGameHistory {
  id: string;
  userId: string;
  gameType: string;
  score: number;
  details: string; // gameData → details
  timestamp: string; // playedAt → timestamp
  createdAt?: string;
  updatedAt?: string;
}

// ゲーム履歴の統合型
type GameHistoryData = ReflexGameHistory | TargetTrackingHistory | SequenceGameHistory;

export class GameHistoryService {
  private static instance: GameHistoryService;
  private userService = UserIdentificationService.getInstance();

  private constructor() {}

  public static getInstance(): GameHistoryService {
    if (!GameHistoryService.instance) {
      GameHistoryService.instance = new GameHistoryService();
    }
    return GameHistoryService.instance;
  }

  /**
   * ゲーム履歴をクラウドに保存
   */
  public async saveGameHistory<T extends GameHistoryData>(
    gameType: 'reflex' | 'target' | 'sequence',
    gameData: T
  ): Promise<void> {
    try {
      const userId = await this.userService.getCurrentUserId();
      const userProfile = await this.userService.getCurrentUserProfile();
      const displayName = this.userService.getDisplayName();

      console.log(`💾 Saving ${gameType} game history to cloud...`);

      const input = {
        userId,
        gameType,
        score: gameData.score || 0, // スキーマに合わせて追加
        details: JSON.stringify(gameData), // gameData → details
        timestamp: new Date().toISOString() // playedAt → timestamp
        // 🔧 一時修正: 現在のスキーマに存在しないフィールドを除去
        // displayName
      };

      const result = await getClient().graphql({
        query: CREATE_GAME_HISTORY,
        variables: { input }
      });

      console.log(`✅ ${gameType} game history saved to cloud:`, result);

      // ローカルストレージからも削除（移行完了）
      this.clearLocalHistory(gameType);

    } catch (error) {
      console.error(`❌ Failed to save ${gameType} game history to cloud:`, error);
      
      // フォールバック：ローカルストレージに保存
      this.saveToLocalStorage(gameType, gameData);
    }
  }

  /**
   * ゲーム履歴をクラウドから取得
   */
  public async getGameHistory<T extends GameHistoryData>(
    gameType: 'reflex' | 'target' | 'sequence',
    limit: number = 10
  ): Promise<T[]> {
    try {
      const userId = await this.userService.getCurrentUserId();

      console.log(`📖 Loading ${gameType} game history from cloud...`);

      // 修正: gameHistoriesByUserIdクエリを使用してuserIdでインデックス検索
      // 注意: byUserIdインデックスにSort Keyが定義されていないため、sortDirectionは使用不可
      const queryVariables = {
        userId: userId,
        filter: {
          gameType: { eq: gameType }
        },
        limit
        // sortDirection: ModelSortDirection.DESC // GSIにSort Keyがないため削除
      };

      // 一時的に本番でもデバッグログを表示（問題調査のため）
      // console.log(`🔍 DEBUG: GameHistory query for ${gameType}:`, {
      //   userId: userId.substring(0, 8) + '...',
      //   gameType,
      //   limit
      // });

      // 🚨 緊急修正2: より安全なアプローチ - 全データ取得後にフィルタリング
      const result = await getClient().graphql({
        query: `
          query ListAllGameHistories($limit: Int) {
            listGameHistories(limit: $limit) {
              items {
                id
                userId
                gameType
                score
                details
                timestamp
                createdAt
                updatedAt
                __typename
              }
            }
          }
        `,
        variables: {
          limit: 200 // 十分な数を取得
        }
      });

      // 🔍 詳細デバッグ: GraphQLレスポンスの生データを確認
      const resultData = (result as any).data;
      // console.log(`🔍 DETAILED DEBUG: GraphQL response for ${gameType}:`, {
      //   hasData: !!resultData,
      //   hasListGameHistories: !!resultData?.listGameHistories,
      //   hasItems: !!resultData?.listGameHistories?.items,
      //   rawResponse: resultData?.listGameHistories
      // });

      const allHistories = ((result as any).data?.listGameHistories?.items || []) as CloudGameHistory[];
      
      // クライアント側でuserIdとgameTypeでフィルタリング
      const cloudHistories = allHistories.filter(history => 
        history.userId === userId && history.gameType === gameType
      );
      
      // console.log(`🔍 FILTER DEBUG: ${gameType} filtering results:`, {
      //   totalHistories: allHistories.length,
      //   userHistories: allHistories.filter(h => h.userId === userId).length,
      //   gameTypeHistories: allHistories.filter(h => h.gameType === gameType).length,
      //   filteredHistories: cloudHistories.length,
      //   targetUserId: userId.substring(0, 8) + '...',
      //   targetGameType: gameType
      // });
      
      // 一時的に本番でもデバッグログを表示（問題調査のため）
      // console.log(`🔍 DEBUG: Raw GameHistory result for ${gameType}:`, {
      //   totalItems: cloudHistories.length,
      //   sampleItems: cloudHistories.slice(0, 2).map(item => ({
      //     id: item.id,
      //     gameType: item.gameType,
      //     playedAt: item.playedAt,
      //     userId: item.userId.substring(0, 8) + '...'
      //   }))
      // });

      // 🚨 緊急デバッグ: 反射神経ゲームの場合、全GameHistoryを確認
      // if (gameType === 'reflex' && cloudHistories.length === 0) {
      //   console.log(`🚨 EMERGENCY DEBUG: No reflex histories found, checking all GameHistory data...`);
      //   
      //   try {
      //     // 全GameHistoryデータを取得（ユーザーフィルターなし）
      //     const allHistoryResult = await getClient().graphql({
      //       query: `
      //         query ListAllGameHistories {
      //           listGameHistories(limit: 100) {
      //             items {
      //               id
      //               userId
      //               gameType
      //               playedAt
      //               displayName
      //             }
      //           }
      //         }
      //       `
      //     });
      //     
      //     const allHistories = (allHistoryResult as any).data?.listGameHistories?.items || [];
      //     const reflexHistories = allHistories.filter((h: any) => h.gameType === 'reflex');
      //     const userReflexHistories = allHistories.filter((h: any) => h.gameType === 'reflex' && h.userId === userId);
      //     
      //     console.log(`🚨 EMERGENCY DEBUG: GameHistory analysis:`, {
      //       totalHistories: allHistories.length,
      //       totalReflexHistories: reflexHistories.length,
      //       userReflexHistories: userReflexHistories.length,
      //       currentUserId: userId.substring(0, 8) + '...',
      //       reflexHistorySample: reflexHistories.slice(0, 3).map((h: any) => ({
      //         userId: h.userId.substring(0, 8) + '...',
      //         gameType: h.gameType,
      //         playedAt: h.playedAt
      //       }))
      //     });
      //   } catch (debugError) {
      //     console.error(`🚨 EMERGENCY DEBUG failed:`, debugError);
      //   }
      // }
      
      // DynamoDBからの結果をアプリケーション側でソート（新しい順）し、指定された件数に制限
      const sortedHistories = cloudHistories
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // playedAt → timestamp
        .slice(0, limit) // 指定された件数に制限
        .map(item => JSON.parse(item.details) as T); // gameData → details

      console.log(`✅ Loaded ${sortedHistories.length} ${gameType} histories from cloud`);
      
      return sortedHistories;

    } catch (error) {
      // 🚨 緊急修正: DNS/接続エラーのログ抑制
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Game history fetch failed for ${gameType}`);
      }
      
      // フォールバック：ローカルストレージから取得
      return this.getFromLocalStorage<T>(gameType);
    }
  }

  /**
   * 最新のゲーム履歴を取得（最適化版）
   */
  public async getLatestGameHistory<T extends GameHistoryData>(
    gameType: 'reflex' | 'target' | 'sequence'
  ): Promise<T | null> {
    // 最適化: 最新1件のみ取得（limit=1）
    const histories = await this.getGameHistory<T>(gameType, 1);
    return histories.length > 0 ? histories[0] : null;
  }

  /**
   * ローカルストレージからクラウドへの一回限りの移行
   */
  public async migrateLocalToCloud(): Promise<void> {
    console.log('🚀 Starting game history migration to cloud...');

    try {
      // 各ゲームの履歴を移行
      await this.migrateGameTypeToCloud('reflex');
      await this.migrateGameTypeToCloud('target');
      await this.migrateGameTypeToCloud('sequence');

      console.log('✅ Game history migration completed successfully');
    } catch (error) {
      console.error('❌ Game history migration failed:', error);
    }
  }

  /**
   * 特定ゲームタイプの移行
   */
  private async migrateGameTypeToCloud(gameType: 'reflex' | 'target' | 'sequence'): Promise<void> {
    const localHistories = this.getFromLocalStorage<GameHistoryData>(gameType);
    
    if (localHistories.length === 0) {
      console.log(`ℹ️ No local ${gameType} history to migrate`);
      return;
    }

    console.log(`📤 Migrating ${localHistories.length} ${gameType} histories...`);

    // 各履歴を個別にクラウドに保存（移行専用：LocalStorageは削除しない）
    for (const history of localHistories) {
      try {
        await this.saveGameHistoryToCloud(gameType, history);
        console.log(`✅ Migrated ${gameType} history: ${history.date}`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${gameType} history:`, error);
      }
    }
    
    // 移行完了後にLocalStorageをクリア
    this.clearLocalHistory(gameType);
    console.log(`🗑️ Cleared local ${gameType} history after migration`);
  }

  /**
   * ゲーム履歴をクラウドのみに保存（移行専用：LocalStorageは削除しない）
   */
  private async saveGameHistoryToCloud<T extends GameHistoryData>(
    gameType: 'reflex' | 'target' | 'sequence',
    gameData: T
  ): Promise<void> {
    const userId = await this.userService.getCurrentUserId();
    const displayName = this.userService.getDisplayName();

    const input = {
      userId,
      gameType,
      score: gameData.score || 0, // スキーマに合わせて追加
      details: JSON.stringify(gameData), // gameData → details
      timestamp: new Date().toISOString() // playedAt → timestamp
      // 🔧 一時修正: 現在のスキーマに存在しないフィールドを除去
      // displayName
    };

    const client = getClient();
    const result = await client.graphql({
      query: CREATE_GAME_HISTORY,
      variables: { input }
    });

    console.log(`✅ ${gameType} game history saved to cloud (migration):`, result);
  }

  /**
   * ローカルストレージに保存（フォールバック）
   */
  private saveToLocalStorage<T extends GameHistoryData>(
    gameType: 'reflex' | 'target' | 'sequence',
    gameData: T
  ): void {
    const storageKey = this.getStorageKey(gameType);
    const existingHistory = this.getFromLocalStorage<T>(gameType);
    const updatedHistory = [gameData, ...existingHistory].slice(0, 10);
    
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
    console.log(`💾 Saved ${gameType} history to localStorage (fallback)`);
  }

  /**
   * ローカルストレージから取得
   */
  private getFromLocalStorage<T extends GameHistoryData>(
    gameType: 'reflex' | 'target' | 'sequence'
  ): T[] {
    const storageKey = this.getStorageKey(gameType);
    const historyData = localStorage.getItem(storageKey);
    
    if (!historyData) return [];
    
    try {
      return JSON.parse(historyData) as T[];
    } catch (error) {
      console.error(`❌ Failed to parse ${gameType} history from localStorage:`, error);
      return [];
    }
  }

  /**
   * ローカルストレージをクリア
   */
  private clearLocalHistory(gameType: 'reflex' | 'target' | 'sequence'): void {
    const storageKey = this.getStorageKey(gameType);
    localStorage.removeItem(storageKey);
    console.log(`🗑️ Cleared local ${gameType} history after cloud migration`);
  }

  /**
   * ストレージキーを取得
   */
  private getStorageKey(gameType: 'reflex' | 'target' | 'sequence'): string {
    switch (gameType) {
      case 'reflex': return STORAGE_KEYS.REFLEX_HISTORY;
      case 'target': return STORAGE_KEYS.TARGET_HISTORY;
      case 'sequence': return STORAGE_KEYS.SEQUENCE_HISTORY;
    }
  }
}
