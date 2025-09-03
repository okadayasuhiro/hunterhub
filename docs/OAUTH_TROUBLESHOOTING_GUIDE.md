# OAuth認証トラブルシューティングガイド

## 🎯 目的
X連携機能開発で学んだOAuth認証の一般的な問題と解決策

## 🚨 よくある問題

### 1. リダイレクトURI設定ミス
**問題**: Twitter OAuth 400エラー
```
❌ 設定: http://hantore.net/x-callback  (HTTP)
✅ 正解: https://hantore.net/x-callback (HTTPS)
```

**症状**: 
- X認証画面で400 Bad Request
- `onboarding/referrer.json` エラー
- OAuth認証フローが開始されない

**解決**: X Developer Portalで正確なHTTPSプロトコル設定

### 2. 開発・本番環境の混在
**問題**: 環境別URL設定
```
開発: http://localhost:5173/x-callback
本番: https://hantore.net/x-callback
```

**解決**: 両方のURLをX Developer Portalに設定

### 3. PKCE設定問題
**問題**: code_challenge関連エラー

**解決**: 
```typescript
// 正しいPKCE実装
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);
```

### 4. Client Secret露出
**問題**: フロントエンドでの機密情報露出

**解決**: Lambda関数での安全な処理

## 🔧 効率的デバッグフロー

### Phase 1: エラー分析 (2分)
```
1. エラーメッセージの詳細確認
2. OAuth認証フローの段階特定
3. リダイレクトURI・プロトコル確認
```

### Phase 2: 設定確認 (3分)
```
1. X Developer Portal設定確認
2. 環境変数確認
3. ドメイン・SSL確認
```

### Phase 3: 実証テスト (5分)
```
1. curl でドメイン確認
2. ブラウザでOAuth URL確認
3. Lambda CloudWatch確認
```

## 📊 予防策

### 1. 設定チェックリスト
```
✅ X Developer Portal:
  - Callback URLs: HTTP/HTTPS正確設定
  - App permissions: Read権限有効
  - Client ID: 正確な値

✅ 環境変数:
  - VITE_X_CLIENT_ID: 正確設定
  - X_CLIENT_SECRET: Lambda環境変数設定

✅ ドメイン設定:
  - SSL証明書: 有効
  - DNS設定: 正常解決
```

### 2. テスト手順
```
1. 開発環境テスト: localhost
2. 本番環境テスト: 実際のドメイン
3. 異なるブラウザでのテスト
4. 異なるXアカウントでのテスト
```

## 🎯 学習成果

### 今回の発見
- **小さなミス**: 1文字（s）の重要性
- **体系的調査**: エラーから設定確認への流れ
- **実証主義**: 推測ではなく実際の確認

### 今後の改善
- **設定確認**: 必ずHTTP/HTTPSプロトコル確認
- **チェックリスト**: OAuth設定の標準確認項目
- **協力学習**: 一緒に問題解決する効果

---

**OAuth認証は細かい設定ミスが致命的。体系的な確認手順が重要。**
