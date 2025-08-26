// ゲーム履歴管理サービス（DynamoDB + LocalStorage ハイブリッド）
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory } from '../types/game';
import { STORAGE_KEYS } from '../types/game';
import { UserIdentificationService } from './userIdentificationService';

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
      gameData
      playedAt
      displayName
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
        gameData
        playedAt
        displayName
      }
    }
  }
`;

const GAME_HISTORIES_BY_USER_ID = `
  query GameHistoriesByUserId($userId: String!, $filter: ModelGameHistoryFilterInput, $limit: Int, $sortDirection: ModelSortDirection) {
    gameHistoriesByUserId(userId: $userId, filter: $filter, limit: $limit, sortDirection: $sortDirection) {
      items {
        id
        userId
        gameType
        gameData
        playedAt
        displayName
      }
    }
  }
`;

// GameHistory型定義
interface CloudGameHistory {
  id: string;
  userId: string;
  gameType: string;
  gameData: string;
  playedAt: string;
  displayName: string;
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
        gameData: JSON.stringify(gameData),
        playedAt: new Date().toISOString(),
        displayName
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
      console.log(`🔍 DEBUG: Query filter - userId: ${userId}, gameType: ${gameType}, limit: ${limit}`);

      // 修正: gameHistoriesByUserIdクエリを使用してuserIdでインデックス検索
      const queryVariables = {
        userId: userId,
        filter: {
          gameType: { eq: gameType }
        },
        limit,
        sortDirection: 'DESC' // 新しい順
      };

      console.log(`🔍 DEBUG: Using gameHistoriesByUserId query`);
      console.log(`🔍 DEBUG: GraphQL variables:`, JSON.stringify(queryVariables, null, 2));

      const result = await getClient().graphql({
        query: GAME_HISTORIES_BY_USER_ID,
        variables: queryVariables
      });

      console.log(`🔍 DEBUG: GraphQL result:`, result);

      const cloudHistories = ((result as any).data?.gameHistoriesByUserId?.items || []) as CloudGameHistory[];
      console.log(`🔍 DEBUG: Raw cloudHistories count: ${cloudHistories.length}`);
      
      if (cloudHistories.length > 0) {
        console.log(`🔍 DEBUG: Sample cloudHistory:`, cloudHistories[0]);
      }
      
      // 日付でソート（新しい順）
      const sortedHistories = cloudHistories
        .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
        .map(item => {
          console.log(`🔍 DEBUG: Parsing gameData:`, item.gameData);
          return JSON.parse(item.gameData) as T;
        });

      console.log(`✅ Loaded ${sortedHistories.length} ${gameType} histories from cloud`);
      
      return sortedHistories;

    } catch (error) {
      console.error(`❌ Failed to load ${gameType} game history from cloud:`, error);
      
      // フォールバック：ローカルストレージから取得
      return this.getFromLocalStorage<T>(gameType);
    }
  }

  /**
   * 最新のゲーム履歴を取得
   */
  public async getLatestGameHistory<T extends GameHistoryData>(
    gameType: 'reflex' | 'target' | 'sequence'
  ): Promise<T | null> {
    // 修正: limitを指定せずに全データを取得してから最新を選択
    const histories = await this.getGameHistory<T>(gameType);
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
      gameData: JSON.stringify(gameData),
      playedAt: new Date().toISOString(),
      displayName
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
