/**
 * 即座実行用LocalStorageクリーンアップスクリプト
 * ブラウザコンソールで直接実行してください
 */

(function() {
  console.log('🧹 HUNTERHUB CLEANUP: Starting immediate localStorage cleanup...');
  
  // 削除対象のキー
  const obsoleteKeys = [
    'hunterhub_global_scores',
    'hunterhub_reflex_scores',
    'hunterhub_target_scores', 
    'hunterhub_sequence_scores',
    'hunterhub_global_scores_backup',
    'hunterhub_rankings',
    'hunterhub_play_count'
  ];
  
  let removedCount = 0;
  let totalSize = 0;
  
  // 現在のLocalStorageをスキャンして削除
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('hunterhub_')) {
      const value = localStorage.getItem(key);
      if (value) {
        const size = value.length;
        
        // 削除対象かチェック
        const shouldRemove = obsoleteKeys.includes(key) || 
                           key.includes('_scores') || 
                           key.includes('_ranking') || 
                           key.includes('_count') ||
                           key.includes('game');
        
        if (shouldRemove) {
          localStorage.removeItem(key);
          removedCount++;
          totalSize += size;
          console.log(`🗑️ REMOVED: ${key} (${size} chars)`);
        } else {
          console.log(`✅ KEPT: ${key} (${size} chars) - Essential data`);
        }
      }
    }
  }
  
  console.log(`\n✅ CLEANUP COMPLETED:`);
  console.log(`   - Removed ${removedCount} obsolete keys`);
  console.log(`   - Freed ${totalSize} characters`);
  
  // 残っているHunterHubデータを確認
  console.log(`\n📊 REMAINING HUNTERHUB DATA:`);
  let remainingCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('hunterhub_')) {
      const value = localStorage.getItem(key) || '';
      console.log(`   ${key}: ${value.length} chars`);
      remainingCount++;
    }
  }
  
  if (remainingCount === 0) {
    console.log('   🎉 No HunterHub data remaining (perfect!)');
  }
  
  // クリーンアップ完了マーク
  localStorage.setItem('hunterhub_cleanup_executed', new Date().toISOString());
  
  console.log(`\n🔄 NEXT STEP: Please reload the page to see accurate play counts (0 plays)`);
  console.log(`💡 TIP: The page should now show "0 plays" for all games instead of old numbers`);
  
})();

console.log('📋 USAGE: Copy and paste this entire script into your browser console, then press Enter');
console.log('🌐 LOCATION: Open Developer Tools (F12) → Console tab → Paste script → Press Enter');
