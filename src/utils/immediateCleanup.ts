/**
 * 即座実行用LocalStorageクリーンアップ
 * ユーザーのブラウザから古いゲームデータを完全削除
 */

export class ImmediateCleanupService {
  /**
   * 即座にブラウザの古いデータをクリーンアップ
   */
  public static executeImmediateCleanup(): void {
    console.log('🧹 IMMEDIATE CLEANUP: Starting browser data cleanup...');
    
    try {
      // 1. 削除対象のキーを特定
      const keysToRemove = this.identifyObsoleteKeys();
      
      // 2. 削除実行
      this.removeObsoleteKeys(keysToRemove);
      
      // 3. 削除結果確認
      this.verifyCleanup();
      
      // 4. クリーンアップ完了マーク
      localStorage.setItem('hunterhub_cleanup_executed', new Date().toISOString());
      
      console.log('✅ IMMEDIATE CLEANUP: Browser cleanup completed successfully');
      
      // 5. ページリロード推奨
      console.log('🔄 RECOMMENDATION: Please reload the page to see accurate play counts (0 plays)');
      
    } catch (error) {
      console.error('❌ IMMEDIATE CLEANUP: Failed:', error);
    }
  }

  /**
   * 削除対象のキーを特定
   */
  private static identifyObsoleteKeys(): string[] {
    const obsoleteKeys: string[] = [];
    
    // 削除対象パターン
    const obsoletePatterns = [
      'hunterhub_global_scores',
      'hunterhub_reflex_scores',
      'hunterhub_target_scores', 
      'hunterhub_sequence_scores',
      'hunterhub_global_scores_backup',
      'hunterhub_rankings',
      'hunterhub_play_count'
    ];
    
    // 現在のLocalStorageをスキャン
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // 完全一致チェック
        if (obsoletePatterns.includes(key)) {
          obsoleteKeys.push(key);
        }
        // パターンマッチチェック（_scores, _ranking等）
        if (key.startsWith('hunterhub_') && 
            (key.includes('_scores') || key.includes('_ranking') || key.includes('_count'))) {
          if (!obsoleteKeys.includes(key)) {
            obsoleteKeys.push(key);
          }
        }
      }
    }
    
    console.log(`🔍 CLEANUP: Found ${obsoleteKeys.length} obsolete keys:`, obsoleteKeys);
    return obsoleteKeys;
  }

  /**
   * 削除対象キーを削除
   */
  private static removeObsoleteKeys(keys: string[]): void {
    let removedCount = 0;
    
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.removeItem(key);
          removedCount++;
          console.log(`🗑️ REMOVED: ${key} (${value.length} chars)`);
        }
      } catch (error) {
        console.error(`❌ Failed to remove ${key}:`, error);
      }
    });
    
    console.log(`✅ CLEANUP: Removed ${removedCount}/${keys.length} obsolete keys`);
  }

  /**
   * クリーンアップ結果を確認
   */
  private static verifyCleanup(): void {
    console.log('🔍 VERIFICATION: Checking remaining HunterHub data...');
    
    const remainingKeys: { key: string; size: number; category: string }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('hunterhub_')) {
        const value = localStorage.getItem(key) || '';
        const size = value.length;
        
        let category = '✅ Essential';
        if (key.includes('user') || key.includes('profile')) category = '✅ User Data';
        if (key.includes('sync') || key.includes('setting')) category = '✅ App Settings';
        if (key.includes('cleanup')) category = '✅ Cleanup Marker';
        if (key.includes('score') || key.includes('game') || key.includes('ranking')) {
          category = '⚠️ SHOULD BE REMOVED';
        }
        
        remainingKeys.push({ key, size, category });
      }
    }
    
    // カテゴリ別表示
    const categories = [...new Set(remainingKeys.map(item => item.category))];
    categories.forEach(category => {
      console.log(`\n${category}:`);
      remainingKeys
        .filter(item => item.category === category)
        .forEach(({ key, size }) => {
          console.log(`  ${key}: ${size} chars`);
        });
    });
    
    // 警告チェック
    const stillObsolete = remainingKeys.filter(item => item.category.includes('SHOULD BE REMOVED'));
    if (stillObsolete.length > 0) {
      console.warn('⚠️ WARNING: Some obsolete keys still remain:', stillObsolete.map(item => item.key));
    } else {
      console.log('✅ VERIFICATION: All obsolete keys successfully removed');
    }
  }

  /**
   * 現在の状況を表示
   */
  public static showCurrentStatus(): void {
    console.log('📊 CURRENT STATUS: LocalStorage usage after cleanup');
    
    const hunterHubKeys = [];
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('hunterhub_')) {
        const value = localStorage.getItem(key) || '';
        const size = value.length;
        totalSize += size;
        hunterHubKeys.push({ key, size });
      }
    }
    
    console.log(`📦 Total HunterHub keys: ${hunterHubKeys.length}`);
    console.log(`📊 Total size: ${totalSize} characters`);
    
    if (hunterHubKeys.length === 0) {
      console.log('🎉 Perfect! No HunterHub data in localStorage (except essential user data)');
    } else {
      hunterHubKeys.forEach(({ key, size }) => {
        console.log(`  ${key}: ${size} chars`);
      });
    }
  }
}

// 自動実行（ページロード時）
if (typeof window !== 'undefined') {
  // ブラウザコンソールで使用可能
  (window as any).ImmediateCleanupService = ImmediateCleanupService;
  
  // 開発環境でのみ自動実行（本番では手動実行推奨）
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 DEV MODE: Immediate cleanup available. Run ImmediateCleanupService.executeImmediateCleanup()');
  }
}
