/**
 * LocalStorageクリーンアップユーティリティ
 * 古いデータをクリアして正確な表示を確保
 */

export class LocalStorageCleanupService {
  /**
   * 古いゲームスコアデータをクリア
   */
  public static clearOldGameScores(): void {
    console.log('🧹 Clearing old game scores from localStorage...');
    
    try {
      // 古いスコアデータをクリア
      localStorage.removeItem('hunterhub_global_scores');
      localStorage.removeItem('hunterhub_reflex_scores');
      localStorage.removeItem('hunterhub_target_scores');
      localStorage.removeItem('hunterhub_sequence_scores');
      
      console.log('✅ Old game scores cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear old game scores:', error);
    }
  }

  /**
   * 特定ゲームタイプのスコアをクリア
   */
  public static clearGameTypeScores(gameType: string): void {
    console.log(`🧹 Clearing ${gameType} scores from localStorage...`);
    
    try {
      const allScores = JSON.parse(localStorage.getItem('hunterhub_global_scores') || '[]');
      const filteredScores = allScores.filter((score: any) => score.gameType !== gameType);
      
      localStorage.setItem('hunterhub_global_scores', JSON.stringify(filteredScores));
      console.log(`✅ ${gameType} scores cleared from localStorage`);
    } catch (error) {
      console.error(`❌ Failed to clear ${gameType} scores:`, error);
    }
  }

  /**
   * 全てのHunterHubデータをクリア
   */
  public static clearAllHunterHubData(): void {
    console.log('🧹 Clearing all HunterHub data from localStorage...');
    
    try {
      const keysToRemove = [];
      
      // HunterHub関連のキーを検索
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hunterhub_')) {
          keysToRemove.push(key);
        }
      }
      
      // キーを削除
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed: ${key}`);
      });
      
      console.log(`✅ Cleared ${keysToRemove.length} HunterHub items from localStorage`);
    } catch (error) {
      console.error('❌ Failed to clear HunterHub data:', error);
    }
  }

  /**
   * LocalStorageの使用状況を確認
   */
  public static checkLocalStorageUsage(): void {
    console.log('📊 LocalStorage usage check:');
    
    try {
      const hunterHubKeys = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hunterhub_')) {
          const value = localStorage.getItem(key);
          const size = value ? value.length : 0;
          hunterHubKeys.push({ key, size });
        }
      }
      
      hunterHubKeys.forEach(({ key, size }) => {
        console.log(`📦 ${key}: ${size} characters`);
      });
      
      const totalSize = hunterHubKeys.reduce((sum, { size }) => sum + size, 0);
      console.log(`📊 Total HunterHub data: ${totalSize} characters`);
      
    } catch (error) {
      console.error('❌ Failed to check localStorage usage:', error);
    }
  }
}

// ブラウザコンソールで使用可能にする
if (typeof window !== 'undefined') {
  (window as any).LocalStorageCleanupService = LocalStorageCleanupService;
}
