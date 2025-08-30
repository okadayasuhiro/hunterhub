/**
 * ランキング更新サービス
 * X連携解除時にDynamoDBの既存ランキングレコードを更新
 */

export interface RankingUpdateRequest {
  userId: string;
  action: 'unlink_x';
}

export interface RankingUpdateResponse {
  success: boolean;
  updatedRecords: number;
  error?: string;
}

export class RankingUpdateService {
  private static instance: RankingUpdateService;
  private apiEndpoint: string;

  private constructor() {
    // API Gateway エンドポイントの設定
    // VITE_BACKEND_URLを使用（Lambda関数のベースURL）
    this.apiEndpoint = import.meta.env.VITE_BACKEND_URL || 
                      'https://w0oo7bi7xe.execute-api.ap-northeast-1.amazonaws.com/dev';
  }

  public static getInstance(): RankingUpdateService {
    if (!RankingUpdateService.instance) {
      RankingUpdateService.instance = new RankingUpdateService();
    }
    return RankingUpdateService.instance;
  }

  /**
   * X連携解除時にランキングレコードを更新
   */
  public async unlinkXFromRankings(userId: string): Promise<RankingUpdateResponse> {
    try {
      console.log(`🔄 Updating rankings for X unlink: ${userId.substring(0, 8)}...`);
      
      const response = await fetch(`${this.apiEndpoint}/ranking/update-x-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'unlink_x'
        } as RankingUpdateRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RankingUpdateResponse = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully updated ${result.updatedRecords} ranking records`);
      } else {
        console.error('❌ Failed to update rankings:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error updating rankings:', error);
      return {
        success: false,
        updatedRecords: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
