/**
 * DynamoDB移行後のLocalStorageクリーンアップ
 * 不要になったスコアデータを削除し、必要なデータのみ保持
 */

export class MigrationCleanupService {
  /**
   * DynamoDB移行完了後のクリーンアップ
   */
  public static async performPostMigrationCleanup(): Promise<void> {
    console.log('🧹 Starting post-migration cleanup...');
    
    try {
      // 1. 古いスコアデータを削除
      this.removeOldScoreData();
      
      // 2. 必要なデータのみ保持確認
      this.validateEssentialData();
      
      // 3. クリーンアップ完了マーク
      localStorage.setItem('hunterhub_migration_cleanup_completed', new Date().toISOString());
      
      console.log('✅ Post-migration cleanup completed');
    } catch (error) {
      console.error('❌ Post-migration cleanup failed:', error);
    }
  }

  /**
   * 古いスコアデータを削除
   */
  private static removeOldScoreData(): void {
    const scoreKeys = [
      'hunterhub_global_scores',
      'hunterhub_reflex_scores', 
      'hunterhub_target_scores',
      'hunterhub_sequence_scores',
      'hunterhub_global_scores_backup'
    ];

    scoreKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed obsolete key: ${key}`);
      }
    });
  }

  /**
   * 必要なデータの保持確認
   */
  private static validateEssentialData(): void {
    const essentialKeys = [
      'hunterhub_user_profile',
      'hunterhub_user_id', 
      'hunterhub_last_sync'
    ];

    console.log('📋 Essential data validation:');
    essentialKeys.forEach(key => {
      const exists = localStorage.getItem(key) !== null;
      console.log(`${exists ? '✅' : '⚠️'} ${key}: ${exists ? 'Present' : 'Missing'}`);
    });
  }

  /**
   * LocalStorage使用量の最適化確認
   */
  public static checkOptimizedUsage(): void {
    console.log('📊 Optimized LocalStorage usage:');
    
    let totalSize = 0;
    const hunterHubKeys: { key: string; size: number; category: string }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('hunterhub_')) {
        const value = localStorage.getItem(key) || '';
        const size = value.length;
        totalSize += size;
        
        let category = 'Other';
        if (key.includes('user') || key.includes('profile')) category = 'User Data';
        if (key.includes('score') || key.includes('game')) category = 'Game Data (Should be removed)';
        if (key.includes('sync') || key.includes('setting')) category = 'App Settings';
        
        hunterHubKeys.push({ key, size, category });
      }
    }
    
    // カテゴリ別表示
    const categories = [...new Set(hunterHubKeys.map(item => item.category))];
    categories.forEach(category => {
      console.log(`\n📁 ${category}:`);
      hunterHubKeys
        .filter(item => item.category === category)
        .forEach(({ key, size }) => {
          console.log(`  ${key}: ${size} chars`);
        });
    });
    
    console.log(`\n📊 Total: ${totalSize} characters across ${hunterHubKeys.length} keys`);
    
    // 警告表示
    const gameDataKeys = hunterHubKeys.filter(item => item.category.includes('Should be removed'));
    if (gameDataKeys.length > 0) {
      console.warn('⚠️ Found obsolete game data keys that should be removed:');
      gameDataKeys.forEach(({ key }) => console.warn(`  - ${key}`));
    }
  }
}

// ブラウザコンソールで使用可能
if (typeof window !== 'undefined') {
  (window as any).MigrationCleanupService = MigrationCleanupService;
}
