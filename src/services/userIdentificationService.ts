/**
 * ユーザー識別サービス
 * ブラウザフィンガープリントを使用した匿名ユーザー識別システム
 */

import { BrowserFingerprint } from '../utils/browserFingerprint';
import type { FingerprintData } from '../utils/browserFingerprint';
import { generateHunterNameFromSeed } from '../data/hunterNames';
export interface UserProfile {
  userId: string;
  fingerprint: FingerprintData;
  createdAt: string;
  lastActiveAt: string;
  fingerprintQuality: number;
  sessionCount: number;
  totalGamesPlayed: number;
  // 新ハンター名前システム
  hunterName: string;
  isXLinked: boolean;
  xDisplayName?: string;
  xProfileImageUrl?: string; // X画像URL追加
  xUsername?: string;        // X ユーザー名追加
  xId?: string;             // X ユーザーID追加
  xLinkedAt?: string;
  // 旧システム（非推奨）
  username?: string;
  usernameUpdatedAt?: string;
}

export class UserIdentificationService {
  private static instance: UserIdentificationService;
  private currentUser: UserProfile | null = null;
  private fingerprinter: BrowserFingerprint;
  
  private readonly STORAGE_KEYS = {
    USER_PROFILE: 'hunterhub_user_profile',
    USER_ID: 'hunterhub_user_id',
    SESSION_COUNT: 'hunterhub_session_count',
    LAST_FINGERPRINT: 'hunterhub_last_fingerprint'
  };

  private constructor() {
    this.fingerprinter = BrowserFingerprint.getInstance();
  }

  public static getInstance(): UserIdentificationService {
    if (!UserIdentificationService.instance) {
      UserIdentificationService.instance = new UserIdentificationService();
    }
    return UserIdentificationService.instance;
  }

  /**
   * 現在のユーザーIDを取得（初回は生成）
   */
  public async getCurrentUserId(): Promise<string> {
    if (this.currentUser) {
      return this.currentUser.userId;
    }

    // 既存プロファイルの確認
    const existingProfile = await this.loadUserProfile();
    if (existingProfile) {
      this.currentUser = existingProfile;
      await this.updateLastActive();
      return existingProfile.userId;
    }

    // 新規ユーザーの作成
    const newUser = await this.createNewUser();
    this.currentUser = newUser;
    return newUser.userId;
  }

  /**
   * 現在のユーザープロファイルを取得
   */
  public async getCurrentUserProfile(): Promise<UserProfile> {
    if (this.currentUser) {
      return this.currentUser;
    }

    const userId = await this.getCurrentUserId();
    return this.currentUser!;
  }

  /**
   * 新規ユーザーの作成
   */
  private async createNewUser(): Promise<UserProfile> {
    console.log('🆕 Creating new user profile...');
    
    // フィンガープリント生成
    const fingerprint = await this.fingerprinter.generateFingerprint();
    const userId = await this.fingerprinter.hashFingerprint(fingerprint);
    const quality = this.fingerprinter.calculateFingerprintQuality(fingerprint);
    
    // ユーザーIDを使ってハンター名前を生成（一意性確保）
    const hunterName = generateHunterNameFromSeed(userId);
    
    const userProfile: UserProfile = {
      userId,
      fingerprint,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      fingerprintQuality: quality,
      sessionCount: 1,
      totalGamesPlayed: 0,
      // 新ハンター名前システム
      hunterName,
      isXLinked: false
    };

    // ローカルストレージに保存
    this.saveUserProfile(userProfile);
    
    console.log(`✅ New user created: ${userId.substring(0, 8)}... (Quality: ${quality}%)`);
    return userProfile;
  }

  /**
   * 既存ユーザープロファイルの読み込み
   */
  private async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
      if (!profileData) return null;

      const profile: UserProfile = JSON.parse(profileData);
      
      // プロファイルの有効性チェック
      if (!profile.userId || !profile.fingerprint || !profile.createdAt) {
        console.warn('⚠️ Invalid user profile found, will create new one');
        return null;
      }

      // 数字ハンター名前システムへの強制移行処理
      const needsMigration = !profile.hunterName || 
                            (profile.hunterName && !profile.hunterName.match(/^ハンター\d+$/));
      
      if (needsMigration) {
        const oldName = profile.hunterName || 'なし';
        profile.hunterName = generateHunterNameFromSeed(profile.userId);
        profile.isXLinked = false;
        // 既存の手動登録名は削除（仕様に従い強制変更）
        delete profile.username;
        delete profile.usernameUpdatedAt;
        
        console.log(`🔄 Force migrated user from "${oldName}" to number-based: ${profile.hunterName}`);
        
        // 移行後のプロファイルを保存
        this.saveUserProfile(profile);
      }

      console.log(`🔄 Loaded existing user: ${profile.userId.substring(0, 8)}... (${profile.hunterName})`);
      
      // 🔧 重要：currentUserを設定してから復元実行
      this.currentUser = profile;
      
      // 🔄 DynamoDBからX連携状態を復元
      console.log('🔍 DynamoDB復元開始前の状態:', {
        isXLinked: profile.isXLinked,
        hasXDisplayName: !!profile.xDisplayName,
        userId: profile.userId.substring(0, 8) + '...'
      });
      
      await this.restoreXLinkFromCloudIfNeeded();
      
      console.log('🔍 DynamoDB復元後の状態:', {
        isXLinked: this.currentUser?.isXLinked,
        hasXDisplayName: !!this.currentUser?.xDisplayName,
        xDisplayName: this.currentUser?.xDisplayName
      });
      
      return profile;
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      return null;
    }
  }

  /**
   * ユーザープロファイルの保存
   */
  private saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      localStorage.setItem(this.STORAGE_KEYS.USER_ID, profile.userId);
      console.log('💾 User profile saved successfully');
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
    }
  }

  /**
   * 最終活動日時の更新
   */
  public async updateLastActive(): Promise<void> {
    if (!this.currentUser) return;

    this.currentUser.lastActiveAt = new Date().toISOString();
    this.currentUser.sessionCount += 1;
    this.saveUserProfile(this.currentUser);
  }

  /**
   * ゲームプレイ数の増加
   */
  public async incrementGameCount(): Promise<void> {
    if (!this.currentUser) {
      await this.getCurrentUserId(); // ユーザー初期化
    }
    
    if (this.currentUser) {
      this.currentUser.totalGamesPlayed += 1;
      this.saveUserProfile(this.currentUser);
      console.log(`🎮 Game count updated: ${this.currentUser.totalGamesPlayed}`);
    }
  }

  /**
   * フィンガープリントの再生成と検証
   */
  public async verifyFingerprint(): Promise<boolean> {
    if (!this.currentUser) return false;

    try {
      const currentFingerprint = await this.fingerprinter.generateFingerprint();
      const storedFingerprint = this.currentUser.fingerprint;

      // 重要な要素の比較
      const matches = {
        userAgent: currentFingerprint.userAgent === storedFingerprint.userAgent,
        timezone: currentFingerprint.timezone === storedFingerprint.timezone,
        screenResolution: currentFingerprint.screenResolution === storedFingerprint.screenResolution,
        canvas: currentFingerprint.canvasFingerprint === storedFingerprint.canvasFingerprint,
        webgl: currentFingerprint.webglFingerprint === storedFingerprint.webglFingerprint,
        persistentId: currentFingerprint.persistentId === storedFingerprint.persistentId
      };

      const matchCount = Object.values(matches).filter(Boolean).length;
      const matchRate = matchCount / Object.keys(matches).length;

      console.log(`🔍 Fingerprint verification: ${(matchRate * 100).toFixed(1)}% match`);
      
      // 80%以上の一致で同一ユーザーと判定
      return matchRate >= 0.8;
    } catch (error) {
      console.error('❌ Fingerprint verification failed:', error);
      return false;
    }
  }

  /**
   * ユーザー統計情報の取得
   */
  public getUserStats(): {
    userId: string;
    createdAt: string;
    lastActiveAt: string;
    sessionCount: number;
    totalGamesPlayed: number;
    fingerprintQuality: number;
  } | null {
    if (!this.currentUser) return null;

    return {
      userId: this.currentUser.userId,
      createdAt: this.currentUser.createdAt,
      lastActiveAt: this.currentUser.lastActiveAt,
      sessionCount: this.currentUser.sessionCount,
      totalGamesPlayed: this.currentUser.totalGamesPlayed,
      fingerprintQuality: this.currentUser.fingerprintQuality
    };
  }

  /**
   * デバッグ情報の取得
   */
  public async getDebugInfo(): Promise<any> {
    const currentFingerprint = await this.fingerprinter.generateFingerprint();
    const quality = this.fingerprinter.calculateFingerprintQuality(currentFingerprint);
    
    return {
      currentUser: this.currentUser,
      currentFingerprint,
      fingerprintQuality: quality,
      storageKeys: this.STORAGE_KEYS,
      localStorage: {
        userProfile: localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE),
        userId: localStorage.getItem(this.STORAGE_KEYS.USER_ID)
      }
    };
  }

  /**
   * ユーザーデータのクリア（テスト用）
   */

  /**
   * ユーザーデータのクリア（テスト用）
   */
  public clearUserData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.currentUser = null;
    console.log('🗑️ User data cleared');
  }

  /**
   * ユーザー名を設定
   */
  public async setUsername(username: string): Promise<void> {
    console.log('🔧 Debug: setUsername called with:', username);
    console.log('🔧 Debug: currentUser:', this.currentUser ? 'exists' : 'null');
    
    if (!username || username.trim().length < 2) {
      console.error('❌ Debug: Username too short:', username);
      throw new Error('Username must be at least 2 characters long');
    }

    if (username.trim().length > 20) {
      console.error('❌ Debug: Username too long:', username);
      throw new Error('Username must be 20 characters or less');
    }

    // 不適切な文字チェック
    const invalidChars = /[<>"'&]/;
    if (invalidChars.test(username)) {
      console.error('❌ Debug: Invalid characters:', username);
      throw new Error('Username contains invalid characters');
    }

    const trimmedUsername = username.trim();
    console.log('🔧 Debug: Processing username:', trimmedUsername);
    
    // 現在のユーザーを取得
    await this.getCurrentUserId(); // ユーザー初期化を保証
    
    if (this.currentUser) {
      this.currentUser.username = trimmedUsername;
      this.currentUser.usernameUpdatedAt = new Date().toISOString();
      this.saveUserProfile(this.currentUser);
      
      console.log(`✅ Username set: ${trimmedUsername} for user ${this.currentUser.userId.substring(0, 8)}...`);
    } else {
      console.error('❌ Debug: currentUser is null');
      throw new Error('User not initialized');
    }
  }

  /**
   * 表示名を取得（新システム）
   * X連携時はX表示名、未連携時はハンター名
   */
  public async getDisplayName(): Promise<string> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    
    if (this.currentUser?.isXLinked && this.currentUser.xDisplayName) {
      return this.currentUser.xDisplayName;
    }
    
    return this.currentUser?.hunterName || 'ハンター名無し';
  }

  /**
   * ハンター名を取得
   */
  public async getHunterName(): Promise<string> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    return this.currentUser?.hunterName || 'ハンター名無し';
  }

  /**
   * X連携状態を取得
   */
  public async isXLinked(): Promise<boolean> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    return this.currentUser?.isXLinked || false;
  }

  /**
   * ユーザー名を取得（旧システム・非推奨）
   * 後方互換性のため残す
   */
  public async getUsername(): Promise<string | null> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    // 新システムでは表示名を返す
    return await this.getDisplayName();
  }

  /**
   * ユーザー名が設定されているかチェック
   */
  public async hasUsername(): Promise<boolean> {
    const username = await this.getUsername();
    const hasName = username !== null && username.length >= 2;
    console.log('🔧 Debug: hasUsername returning:', hasName);
    return hasName;
  }

  /**
   * X連携を設定（従来の簡易版）
   */
  public async linkXAccount(xDisplayName: string): Promise<void> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    
    if (this.currentUser) {
      this.currentUser.isXLinked = true;
      this.currentUser.xDisplayName = xDisplayName;
      this.currentUser.xLinkedAt = new Date().toISOString();
      
      this.saveUserProfile(this.currentUser);
      console.log(`✅ X account linked: ${xDisplayName}`);
    }
  }

  /**
   * X連携を設定（画像付き・実際のOAuth用）
   */
  public async linkXAccountWithImage(xDisplayName: string, xProfileImageUrl: string, xUsername?: string, xId?: string): Promise<void> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    
    if (this.currentUser) {
      this.currentUser.isXLinked = true;
      this.currentUser.xDisplayName = xDisplayName;
      this.currentUser.xProfileImageUrl = xProfileImageUrl;
      this.currentUser.xUsername = xUsername; // X ユーザー名を追加
      this.currentUser.xId = xId; // X ユーザーIDを追加
      this.currentUser.xLinkedAt = new Date().toISOString();
      
      this.saveUserProfile(this.currentUser);
      
      // 🌐 DynamoDBにも保存（グローバル表示用）
      await this.updateCloudUserProfile();
      
      console.log(`✅ X account linked with full profile: ${xDisplayName}`);
      console.log(`📸 Profile image: ${xProfileImageUrl}`);
      console.log(`🆔 X ID: ${xId}, Username: ${xUsername}`);
    }
  }

  /**
   * DynamoDBからX連携状態を復元
   */
  private async restoreXLinkFromCloudIfNeeded(): Promise<void> {
    console.log('🔍 restoreXLinkFromCloudIfNeeded 開始');
    
    if (!this.currentUser) {
      console.log('❌ currentUser が null のため復元スキップ');
      return;
    }

    console.log('🔍 復元対象ユーザー:', {
      userId: this.currentUser.userId.substring(0, 8) + '...',
      currentXLinked: this.currentUser.isXLinked,
      currentXDisplayName: this.currentUser.xDisplayName
    });

    try {
      const { generateClient } = await import('aws-amplify/api');
      const { getUserProfile } = await import('../graphql/queries');
      const client = generateClient();

      // DynamoDBから最新のユーザープロファイルを取得
      const cloudResult = await client.graphql({
        query: getUserProfile,
        variables: { id: this.currentUser.userId }
      });

      const cloudProfile = (cloudResult as any).data?.getUserProfile;
      
      if (cloudProfile && cloudProfile.xId && cloudProfile.xDisplayName) {
        console.log('🔄 DynamoDBからX連携情報を復元中...', {
          cloudXId: cloudProfile.xId,
          cloudDisplayName: cloudProfile.xDisplayName,
          localXLinked: this.currentUser.isXLinked
        });

        // LocalStorageを最新のDynamoDB情報で更新
        this.currentUser.isXLinked = true;
        this.currentUser.xDisplayName = cloudProfile.xDisplayName;
        this.currentUser.xUsername = cloudProfile.xUsername;
        this.currentUser.xId = cloudProfile.xId;
        this.currentUser.xProfileImageUrl = cloudProfile.xProfileImageUrl;
        this.currentUser.xLinkedAt = cloudProfile.updatedAt || new Date().toISOString();
        
        this.saveUserProfile(this.currentUser);
        console.log('✅ X連携状態をDynamoDBから復元完了');
      }
    } catch (error) {
      console.error('❌ Failed to restore X link from cloud:', error);
    }
  }

  /**
   * DynamoDB UserProfileの更新（グローバル表示用）
   */
  private async updateCloudUserProfile(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const { generateClient } = await import('aws-amplify/api');
      const { updateUserProfile, createUserProfile } = await import('../graphql/mutations');
      const { getUserProfile } = await import('../graphql/queries');
      const client = generateClient();

      // 既存UserProfileを確認
      const existingResult = await client.graphql({
        query: getUserProfile,
        variables: { id: this.currentUser.userId }
      });

      const existingProfile = (existingResult as any).data?.getUserProfile;

      if (existingProfile) {
        // 既存プロファイル更新
        const updateInput = {
          id: this.currentUser.userId,
          username: this.currentUser.hunterName,
          xId: this.currentUser.xId || null,
          xDisplayName: this.currentUser.xDisplayName || null,
          xUsername: this.currentUser.xUsername || null,
          xProfileImageUrl: this.currentUser.xProfileImageUrl || null
        };

        await client.graphql({
          query: updateUserProfile,
          variables: { input: updateInput }
        });

        console.log('✅ UserProfile updated in DynamoDB (X連携情報含む)');
      } else {
        // 新規プロファイル作成
        const createInput = {
          id: this.currentUser.userId,
          username: this.currentUser.hunterName,
          xId: this.currentUser.xId || null,
          xDisplayName: this.currentUser.xDisplayName || null,
          xUsername: this.currentUser.xUsername || null,
          xProfileImageUrl: this.currentUser.xProfileImageUrl || null
        };

        await client.graphql({
          query: createUserProfile,
          variables: { input: createInput }
        });

        console.log('✅ UserProfile created in DynamoDB (X連携情報含む)');
      }
    } catch (error) {
      console.error('❌ Failed to update cloud user profile:', error);
      // エラーでも連携処理は継続（ローカル保存は完了済み）
    }
  }

  /**
   * Xプロフィール画像URLを取得
   */
  public async getXProfileImageUrl(): Promise<string | undefined> {
    await this.getCurrentUserId();
    return this.currentUser?.xProfileImageUrl;
  }

  /**
   * Xディスプレイ名を取得
   */
  public async getXDisplayName(): Promise<string | undefined> {
    await this.getCurrentUserId();
    return this.currentUser?.xDisplayName;
  }

  /**
   * X連携を解除
   */
  public async unlinkXAccount(): Promise<void> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    
    if (this.currentUser) {
      const oldXDisplayName = this.currentUser.xDisplayName;
      
      // LocalStorageのデータを更新
      this.currentUser.isXLinked = false;
      delete this.currentUser.xDisplayName;
      delete this.currentUser.xProfileImageUrl;
      delete this.currentUser.xUsername; // X ユーザー名も削除
      delete this.currentUser.xId; // X ユーザーIDも削除
      delete this.currentUser.xLinkedAt;
      
      this.saveUserProfile(this.currentUser);
      
      // DynamoDBのデータも更新（X連携情報を削除）
      try {
        await this.updateUserProfileInCloud();
        console.log(`✅ X account unlinked (both local and cloud), reverted to: ${this.currentUser.hunterName}`);
        console.log(`📝 Previous X name: ${oldXDisplayName}`);
      } catch (error) {
        console.error('⚠️ Failed to update cloud profile, but local unlink successful:', error);
        console.log(`✅ X account unlinked locally, reverted to: ${this.currentUser.hunterName}`);
      }
    }
  }

  /**
   * 総ゲームプレイ回数を更新
   */
  public async updateTotalGamesPlayed(): Promise<void> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    
    if (this.currentUser) {
      this.currentUser.totalGamesPlayed += 1;
      this.saveUserProfile(this.currentUser);
      
      console.log(`🎮 Total games played updated: ${this.currentUser.totalGamesPlayed} for user ${this.currentUser.userId.substring(0, 8)}...`);
    }
  }

  /**
   * UserProfileをDynamoDBに更新（X連携解除用）
   */
  private async updateUserProfileInCloud(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Current user not found');
    }

    try {
      // Amplifyクライアントを動的にインポート
      const { generateClient } = await import('@aws-amplify/api');
      const client = generateClient();

      // 既存のUserProfileを検索
      const { listUserProfiles } = await import('../graphql/queries');
      
      const existingResult = await client.graphql({
        query: listUserProfiles,
        variables: {
          filter: {
            id: { eq: this.currentUser.userId }
          },
          limit: 1
        }
      });

      const existingProfiles = existingResult.data?.listUserProfiles?.items || [];
      
      if (existingProfiles.length > 0) {
        // 既存プロファイルを更新
        const existingProfile = existingProfiles[0];
        const { updateUserProfile } = await import('../graphql/mutations');
        
        await client.graphql({
          query: updateUserProfile,
          variables: {
            input: {
              id: existingProfile.id,
              // 🔧 スキーマに存在するフィールドのみ使用
              xDisplayName: this.currentUser.xDisplayName || null,
              xProfileImageUrl: this.currentUser.xProfileImageUrl || null
              // xLinked, xLinkedAt は存在しないため削除
            }
          }
        });
        
        console.log('✅ UserProfile updated in DynamoDB (X連携情報削除)');
      } else {
        console.log('⚠️ No existing UserProfile found in DynamoDB');
      }
    } catch (error) {
      console.error('❌ Failed to update UserProfile in cloud:', error);
      throw error;
    }
  }
}
