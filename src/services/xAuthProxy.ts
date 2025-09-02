/**
 * X認証プロキシサービス
 * バックエンド経由でX APIを呼び出す
 */

interface XAuthProxyResponse {
  success: boolean;
  data?: {
    id: string;              // X ユーザーID
    name: string;            // X 表示名
    username: string;        // X ユーザー名
    profileImageUrl: string; // プロフィール画像URL
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
  public async exchangeCodeForProfile(code: string, state: string): Promise<{ id: string; name: string; username: string; profile_image_url: string }> {
    console.log('🔄 Exchanging code via AWS Lambda...');
    
    try {
      // AWS API Gateway endpoint - 正しいステージパス
      const apiEndpoint = import.meta.env.VITE_AWS_API_ENDPOINT || 
                          'https://w0oo7bi7xe.execute-api.ap-northeast-1.amazonaws.com/Stage/x-auth/exchange';
      
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

      // レスポンス型の変換
      return {
        id: result.data.id,
        name: result.data.name,
        username: result.data.username,
        profile_image_url: result.data.profileImageUrl // profileImageUrl → profile_image_url
      };
    } catch (error) {
      console.error('❌ Backend proxy failed:', error);
      
      // 🔧 開発環境での自動フォールバック
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        console.log('🔄 Development environment detected, using enhanced mock X profile');
        return this.getEnhancedMockProfile(code, state);
      }
      
      // バックエンドが利用できない場合の簡易実装
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('⚠️ Backend not available, using mock data for development');
        return this.getMockProfile();
      }
      
      throw error;
    }
  }

  /**
   * 拡張開発用モックプロフィール（OAuth codeベース）
   */
  private getEnhancedMockProfile(code: string, state: string): { id: string; name: string; username: string; profile_image_url: string } {
    // OAuth codeから一意のプロフィールを生成
    const hash = this.hashCode(code);
    const profiles = [
      {
        id: 'dev_okada_' + Math.abs(hash),
        name: 'オカダヤスヒロ (Dev)',
        username: 'okadayasuhiro_dev',
        profile_image_url: '/images/x_icon/icon_yacchin.jpg'
      },
      {
        id: 'dev_hunter_' + Math.abs(hash),
        name: 'ハンターテスト (Dev)',
        username: 'hunter_test_dev',
        profile_image_url: '/images/x_icon/icon_yacchin.jpg'
      },
      {
        id: 'dev_sample_' + Math.abs(hash),
        name: 'サンプルユーザー (Dev)',
        username: 'sample_user_dev',
        profile_image_url: '/images/x_icon/icon_yacchin.jpg'
      }
    ];

    // codeハッシュに基づいて一貫したプロフィールを返す
    const profileIndex = Math.abs(hash) % profiles.length;
    const selectedProfile = profiles[profileIndex];
    
    console.log('🎭 Enhanced mock profile generated:', {
      code: code.substring(0, 10) + '...',
      selectedProfile: selectedProfile.name,
      profileId: selectedProfile.id
    });
    
    return selectedProfile;
  }

  /**
   * 開発用モックプロフィール（フォールバック）
   */
  private getMockProfile(): { id: string; name: string; username: string; profile_image_url: string } {
    return {
      id: 'dev_user_' + Date.now(), // 開発用一意ID
      name: 'オカダヤスヒロ (Dev)',
      username: 'okadayasuhiro_dev',
      profile_image_url: '/images/x_icon/icon_yacchin.jpg' // 既存のyacchin画像を使用
    };
  }

  /**
   * 文字列ハッシュ計算
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return hash;
  }
}

export default XAuthProxy;
