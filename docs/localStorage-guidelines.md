# LocalStorage使用ガイドライン
## DynamoDB移行後の適切なLocalStorage活用方針

### ✅ 使用すべき場面

#### 1. ユーザー認証・識別
```typescript
// ログイン状態の維持
localStorage.setItem('hunterhub_user_profile', JSON.stringify(profile));
localStorage.setItem('hunterhub_user_id', userId);
```

#### 2. アプリケーション設定
```typescript
// ユーザー設定の永続化
localStorage.setItem('hunterhub_settings', JSON.stringify({
  theme: 'dark',
  notifications: true
}));
```

#### 3. 一時的なキャッシュ（短期間）
```typescript
// APIレスポンスの短期キャッシュ（TTL付き）
localStorage.setItem('hunterhub_cache_topplayers', JSON.stringify({
  data: topPlayers,
  timestamp: Date.now(),
  ttl: 5 * 60 * 1000 // 5分
}));
```

#### 4. オフライン対応（最小限）
```typescript
// ネットワーク障害時の最小限フォールバック
localStorage.setItem('hunterhub_offline_mode', 'true');
```

### ❌ 使用すべきでない場面

#### 1. ゲームスコア・履歴データ
```typescript
// ❌ DynamoDBで管理済み
localStorage.setItem('hunterhub_global_scores', JSON.stringify(scores));
localStorage.setItem('hunterhub_game_history', JSON.stringify(history));
```

#### 2. ランキングデータ
```typescript
// ❌ リアルタイム性が重要
localStorage.setItem('hunterhub_rankings', JSON.stringify(rankings));
```

#### 3. プレイ回数カウント
```typescript
// ❌ 正確性が重要、クラウドから取得
const playCount = localStorage.getItem('hunterhub_play_count');
```

### 🔄 移行戦略

#### Phase 1: クリーンアップ（現在）
1. 古いスコアデータの削除
2. 不要なフォールバックロジックの削除
3. 必要最小限のLocalStorage使用に限定

#### Phase 2: 最適化
1. キャッシュ戦略の実装（TTL付き）
2. オフライン対応の改善
3. パフォーマンス最適化

#### Phase 3: 完全クラウド化
1. LocalStorageへの依存を最小化
2. PWA対応でのオフライン機能
3. ServiceWorkerによるキャッシュ管理

### 📊 現在の使用状況

#### 必要なLocalStorage項目
- `hunterhub_user_profile`: ユーザープロファイル
- `hunterhub_user_id`: ユーザーID
- `hunterhub_last_sync`: 最終同期時刻

#### 削除対象のLocalStorage項目
- `hunterhub_global_scores`: ゲームスコア（DynamoDB移行済み）
- `hunterhub_*_scores`: 各ゲームスコア（DynamoDB移行済み）
- `hunterhub_rankings`: ランキング（リアルタイム取得）

### 🛠️ 実装例

#### 適切なキャッシュ実装
```typescript
class CacheService {
  private static isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  public static setCache(key: string, data: any, ttlMinutes: number = 5): void {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    };
    localStorage.setItem(`hunterhub_cache_${key}`, JSON.stringify(cacheData));
  }

  public static getCache(key: string): any | null {
    try {
      const cached = localStorage.getItem(`hunterhub_cache_${key}`);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      if (this.isExpired(timestamp, ttl)) {
        localStorage.removeItem(`hunterhub_cache_${key}`);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }
}
```

### 🎯 結論

**DynamoDB移行後のLocalStorageは以下の用途に限定すべき：**

1. **認証・セッション管理**（必須）
2. **アプリケーション設定**（推奨）  
3. **短期キャッシュ**（最適化）
4. **オフライン対応**（最小限）

**ゲームデータ・スコア・ランキングはDynamoDBに完全移行し、LocalStorageは使用しない。**
