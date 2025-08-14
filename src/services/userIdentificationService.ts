/**
 * ユーザー識別サービス
 * ブラウザフィンガープリントを使用した匿名ユーザー識別システム
 */

import { BrowserFingerprint } from '../utils/browserFingerprint';
import type { FingerprintData } from '../utils/browserFingerprint';
export interface UserProfile {
  userId: string;
  fingerprint: FingerprintData;
  createdAt: string;
  lastActiveAt: string;
  fingerprintQuality: number;
  sessionCount: number;
  totalGamesPlayed: number;
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
    const existingProfile = this.loadUserProfile();
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
    
    const userProfile: UserProfile = {
      userId,
      fingerprint,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      fingerprintQuality: quality,
      sessionCount: 1,
      totalGamesPlayed: 0
    };

    // ローカルストレージに保存
    this.saveUserProfile(userProfile);
    
    console.log(`✅ New user created: ${userId.substring(0, 8)}... (Quality: ${quality}%)`);
    return userProfile;
  }

  /**
   * 既存ユーザープロファイルの読み込み
   */
  private loadUserProfile(): UserProfile | null {
    try {
      const profileData = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
      if (!profileData) return null;

      const profile: UserProfile = JSON.parse(profileData);
      
      // プロファイルの有効性チェック
      if (!profile.userId || !profile.fingerprint || !profile.createdAt) {
        console.warn('⚠️ Invalid user profile found, will create new one');
        return null;
      }

      console.log(`🔄 Loaded existing user: ${profile.userId.substring(0, 8)}... (Quality: ${profile.fingerprintQuality}%)`);
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
   * ユーザー名を取得
   */
  public async getUsername(): Promise<string | null> {
    await this.getCurrentUserId(); // ユーザー初期化を保証
    const username = this.currentUser?.username || null;
    console.log('🔧 Debug: getUsername returning:', username);
    return username;
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
}
