/**
 * DynamoDBデータクリーンアップユーティリティ
 */

import { generateClient } from 'aws-amplify/api';
import { listGameScores, listGameHistories } from '../graphql/queries';
import { deleteGameScore, deleteGameHistory } from '../graphql/mutations';
import type { GameScore, GameHistory } from '../API';

export class DataCleanupService {
  private client = generateClient();

  /**
   * 指定日時より古いGameScoreレコードを削除
   */
  public async cleanupOldGameScores(gameType: string, beforeDate: Date): Promise<number> {
    console.log(`🧹 Cleaning up GameScore records for ${gameType} before ${beforeDate.toISOString()}`);
    
    try {
      // 古いレコードを取得
      const result = await this.client.graphql({
        query: listGameScores,
        variables: {
          filter: {
            gameType: { eq: gameType },
            timestamp: { lt: beforeDate.toISOString() }
          }
        }
      });

      const oldScores = result.data?.listGameScores?.items || [];
      console.log(`🔍 Found ${oldScores.length} old GameScore records to delete`);

      // 削除実行
      let deletedCount = 0;
      for (const score of oldScores) {
        try {
          await this.client.graphql({
            query: deleteGameScore,
            variables: {
              input: { id: score.id }
            }
          });
          deletedCount++;
          console.log(`✅ Deleted GameScore: ${score.id}`);
        } catch (error) {
          console.error(`❌ Failed to delete GameScore ${score.id}:`, error);
        }
      }

      console.log(`🧹 Cleanup completed: ${deletedCount}/${oldScores.length} GameScore records deleted`);
      return deletedCount;

    } catch (error) {
      console.error(`❌ Failed to cleanup GameScore records:`, error);
      throw error;
    }
  }

  /**
   * 指定日時より古いGameHistoryレコードを削除
   */
  public async cleanupOldGameHistories(gameType: string, beforeDate: Date): Promise<number> {
    console.log(`🧹 Cleaning up GameHistory records for ${gameType} before ${beforeDate.toISOString()}`);
    
    try {
      // 古いレコードを取得
      const result = await this.client.graphql({
        query: listGameHistories,
        variables: {
          filter: {
            gameType: { eq: gameType },
            playedAt: { lt: beforeDate.toISOString() }
          }
        }
      });

      const oldHistories = result.data?.listGameHistories?.items || [];
      console.log(`🔍 Found ${oldHistories.length} old GameHistory records to delete`);

      // 削除実行
      let deletedCount = 0;
      for (const history of oldHistories) {
        try {
          await this.client.graphql({
            query: deleteGameHistory,
            variables: {
              input: { id: history.id }
            }
          });
          deletedCount++;
          console.log(`✅ Deleted GameHistory: ${history.id}`);
        } catch (error) {
          console.error(`❌ Failed to delete GameHistory ${history.id}:`, error);
        }
      }

      console.log(`🧹 Cleanup completed: ${deletedCount}/${oldHistories.length} GameHistory records deleted`);
      return deletedCount;

    } catch (error) {
      console.error(`❌ Failed to cleanup GameHistory records:`, error);
      throw error;
    }
  }

  /**
   * 全ゲームタイプの古いデータをクリーンアップ
   */
  public async cleanupAllOldData(beforeDate: Date): Promise<{
    gameScores: number;
    gameHistories: number;
  }> {
    const gameTypes = ['reflex', 'target', 'sequence'];
    let totalGameScores = 0;
    let totalGameHistories = 0;

    for (const gameType of gameTypes) {
      try {
        const gameScoreCount = await this.cleanupOldGameScores(gameType, beforeDate);
        const gameHistoryCount = await this.cleanupOldGameHistories(gameType, beforeDate);
        
        totalGameScores += gameScoreCount;
        totalGameHistories += gameHistoryCount;
      } catch (error) {
        console.error(`❌ Failed to cleanup data for ${gameType}:`, error);
      }
    }

    return {
      gameScores: totalGameScores,
      gameHistories: totalGameHistories
    };
  }
}

// 使用例（ブラウザコンソールで実行）
// const cleanup = new DataCleanupService();
// const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
// cleanup.cleanupAllOldData(yesterday).then(result => console.log('Cleanup result:', result));
