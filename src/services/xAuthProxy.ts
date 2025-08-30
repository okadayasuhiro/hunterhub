/**
 * X認証プロキシサービス
 * バックエンド経由でX APIを呼び出す
 */

interface XAuthProxyResponse {
  success: boolean;
  data?: {
    name: string;
    profileImageUrl: string;
  };
  error?: string;
}

export class XAuthProxy {
  private static instance: XAuthProxy;
  private baseUrl: string;

  private constructor() {
    // 本番環境ではVercel Functions、開発環境ではローカル
    this.baseUrl = import.meta.env.PROD 
      ? window.location.origin  // Vercel Functions (/api/x-auth/exchange)
      : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');
  }

  public static getInstance(): XAuthProxy {
    if (!XAuthProxy.instance) {
      XAuthProxy.instance = new XAuthProxy();
    }
    return XAuthProxy.instance;
  }

  /**
   * X認証トークン交換をAWS Lambda経由で実行
   */
  public async exchangeCodeForProfile(code: string, state: string): Promise<{ name: string; profileImageUrl: string }> {
    console.log('🔄 Exchanging code via AWS Lambda...');
    
    try {
              // AWS API Gateway endpoint (東京リージョン)
        const apiEndpoint = 'https://w0oo7bi7xe.execute-api.ap-northeast-1.amazonaws.com/dev/x-auth/exchange' ||
                            import.meta.env.VITE_AWS_API_ENDPOINT || 
                            import.meta.env.VITE_BACKEND_URL || 
                            `${this.baseUrl}/api/x-auth/exchange`;
      
      // 現在のユーザーIDを取得してリクエストに含める
      const { UserIdentificationService } = await import('./userIdentificationService');
      const userService = UserIdentificationService.getInstance();
      const userId = await userService.getCurrentUserId();
      
      // sessionStorageからcode_verifierを取得
      console.log('🔍 Checking sessionStorage:', {
        keys: Object.keys(sessionStorage),
        hasCodeVerifier: sessionStorage.getItem('pkce_code_verifier') !== null
      });
      
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
      if (!codeVerifier) {
        console.error('❌ SessionStorage contents:', Object.fromEntries(
          Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)])
        ));
        throw new Error('PKCE code verifier not found in session storage');
      }
      
      console.log('📤 Sending to Lambda:', { 
        code: code.substring(0, 20) + '...', 
        state, 
        userId: userId.substring(0, 20) + '...',
        codeVerifier: codeVerifier.substring(0, 20) + '...'
      });
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          userId, // DynamoDB更新用
          redirectUri: import.meta.env.VITE_X_REDIRECT_URI || `${window.location.origin}/x-callback`,
          codeVerifier // PKCE用のcode_verifier追加
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend proxy error: ${response.status}`);
      }

      const result: XAuthProxyResponse = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Unknown backend error');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Backend proxy failed:', error);
      
      // バックエンドが利用できない場合の簡易実装
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('⚠️ Backend not available, using mock data for development');
        return this.getMockProfile();
      }
      
      throw error;
    }
  }

  /**
   * 開発用モックプロフィール
   */
  private getMockProfile(): { name: string; profileImageUrl: string } {
    return {
      name: 'オカダヤスヒロ (Dev)',
      profileImageUrl: '/images/x_icon/icon_yacchin.jpg' // 既存のyacchin画像を使用
    };
  }
}

export default XAuthProxy;
