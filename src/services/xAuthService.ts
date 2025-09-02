/**
 * X (Twitter) API v2 OAuth 2.0 認証サービス
 * アイコン画像と表示名のみ取得する軽量実装
 */

import XAuthProxy from './xAuthProxy';

interface XUserProfile {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
}

interface XAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export class XAuthService {
  private static instance: XAuthService;
  private config: XAuthConfig;

  private constructor() {
    // 環境別リダイレクトURIの自動判定
    const isProduction = window.location.hostname === 'hantore.net' || 
                        window.location.hostname.includes('amplifyapp.com');
    const redirectUri = isProduction 
      ? 'https://hantore.net/x-callback'
      : 'http://localhost:5173/x-callback';

    this.config = {
      clientId: import.meta.env.VITE_X_CLIENT_ID || '',
      redirectUri,
      scopes: ['tweet.read', 'users.read'] // プロフィール情報とツイート読み取り
    };
    
    console.log('🔧 XAuthService initialized:', {
      clientId: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'NOT SET',
      redirectUri: this.config.redirectUri,
      hasClientId: !!this.config.clientId
    });
  }

  public static getInstance(): XAuthService {
    if (!XAuthService.instance) {
      XAuthService.instance = new XAuthService();
    }
    return XAuthService.instance;
  }

  /**
   * X アカウント重複チェック
   */
  public async checkXAccountDuplicate(xId: string): Promise<boolean> {
    try {
      const { generateClient } = await import('aws-amplify/api');
      const { listUserProfiles } = await import('../graphql/queries');
      const client = generateClient();

      // xIdで既存ユーザーを検索
      const result = await client.graphql({
        query: listUserProfiles,
        variables: {
          filter: {
            xId: { eq: xId }
          },
          limit: 1
        }
      });

      const existingUsers = (result as any).data?.listUserProfiles?.items || [];
      return existingUsers.length > 0;
      
    } catch (error) {
      console.error('❌ Failed to check X account duplicate:', error);
      return false; // エラー時は重複なしとして処理
    }
  }

  /**
   * X アカウント重複チェック（指定ユーザー除外）
   */
  public async checkXAccountDuplicateExcludingUser(xId: string, excludeUserId: string): Promise<boolean> {
    try {
      const { generateClient } = await import('aws-amplify/api');
      const { listUserProfiles } = await import('../graphql/queries');
      const client = generateClient();

      // xIdで既存ユーザーを検索（指定ユーザーは除外）
      const result = await client.graphql({
        query: listUserProfiles,
        variables: {
          filter: {
            xId: { eq: xId }
          },
          limit: 10 // 複数取得して除外処理
        }
      });

      const existingUsers = (result as any).data?.listUserProfiles?.items || [];
      
      // 指定ユーザー以外で同じxIdを持つユーザーが存在するかチェック
      const duplicateUsers = existingUsers.filter((user: any) => user.id !== excludeUserId);
      
      console.log('🔍 重複チェック結果:', {
        xId: xId.substring(0, 10) + '...',
        totalUsers: existingUsers.length,
        excludeUserId: excludeUserId.substring(0, 8) + '...',
        duplicateUsers: duplicateUsers.length
      });
      
      return duplicateUsers.length > 0;
      
    } catch (error) {
      console.error('❌ Failed to check X account duplicate (excluding user):', error);
      return false; // エラー時は重複なしとして処理
    }
  }

  /**
   * X OAuth認証URLを生成
   */
  public async generateAuthUrl(): Promise<string> {
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier); // codeVerifierを渡す
    
    // OAuth 2.0 PKCE フロー
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    // 状態をセッションストレージに保存
    sessionStorage.setItem('x_oauth_state', state);
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    
    console.log('💾 Saved to sessionStorage:', {
      state: state.substring(0, 10) + '...',
      codeVerifier: codeVerifier.substring(0, 10) + '...',
      keys: Object.keys(sessionStorage)
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  /**
   * 認証コードからアクセストークンを取得
   */
  public async exchangeCodeForToken(code: string, state: string): Promise<string> {
    const savedState = sessionStorage.getItem('x_oauth_state');
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        code: code,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    
    // クリーンアップ
    sessionStorage.removeItem('x_oauth_state');
    sessionStorage.removeItem('pkce_code_verifier');
    
    return data.access_token;
  }

  /**
   * ユーザープロフィール情報を取得
   */
  public async getUserProfile(accessToken: string): Promise<XUserProfile> {
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const data = await response.json();
    return data.data as XUserProfile;
  }

  /**
   * X認証フローを開始
   */
  public async startAuthFlow(): Promise<void> {
    console.log('🚀 Starting X auth flow...');
    
    if (!this.config.clientId) {
      console.error('❌ X Client ID not set! Check .env file');
      alert('X連携の設定が完了していません。Client IDが設定されていません。');
      return;
    }
    
    const authUrl = await this.generateAuthUrl();
    console.log('🔗 Generated auth URL:', authUrl);
    window.location.href = authUrl;
  }

  /**
   * コールバック処理（プロキシ経由）
   */
  public async handleCallback(code: string, state: string): Promise<{ id: string; name: string; username: string; profile_image_url: string }> {
    try {
      console.log('🔄 Using proxy for X authentication...');
      const proxy = XAuthProxy.getInstance();
      return await proxy.exchangeCodeForProfile(code, state);
    } catch (error) {
      console.error('X authentication failed:', error);
      throw error;
    }
  }

  // PKCE用のヘルパーメソッド
  private generateState(): string {
    return btoa(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    // PKCE S256 method: code_challenge = base64url(sha256(code_verifier))
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    
    // ArrayBufferをbase64url形式に変換
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export default XAuthService;
