## デプロイ ランブック（本番・Amplify Hosting／連携リポジトリ）

対象
- アプリID: `d1ewt5l0oirslc`（リージョン: ap-northeast-1）
- ブランチ: `main`（AutoBuild 有効）
- リポジトリ: `https://github.com/okadayasuhiro/hunterhub`
- ビルド出力: Vite `dist/`

このドキュメントは「二度と迷わない」を目的に、実作業順・失敗例と対処・確認観点を網羅しています。

---

### TL;DR（最短手順）
1) 変更をコミットして `main` にプッシュ
```bash
git add -A && git commit -m "feat: 更新" && git push origin main
```
2) ビルド状況を確認
```bash
aws amplify list-jobs --app-id d1ewt5l0oirslc --branch-name main --max-items 5
```
3) 成功したら本番URLで確認: `https://d1ewt5l0oirslc.amplifyapp.com`

---

### 0. 前提・原則
- 本番は Amplify Hosting の「連携リポジトリ（GitHub）」方式。
  - 手動ZIPアップロード（`create-deployment`）は不可 → 実行すると `Operation not supported. App is already connected a repository.`
- `main` へプッシュ＝自動でビルド・デプロイ。
- SPA ルーティングはリダイレクト設定済み（`/<*> -> /index.html (404-200)`）。
- バックエンド（AppSync/DynamoDB）は別管理。フロントは静的サイトのみ。

---

### 1. リリース前チェックリスト
- [ ] ローカルで `npm ci && npm run build` が成功（Viteで `dist/` 作成）
- [ ] 重要画面の差分を手元で確認（ホームの年ラベル「2025年」、鬼モードバッジ、ランキング／前回記録）
- [ ] `src/main.tsx` の Amplify 設定が正しい（GraphQLエンドポイント・リージョン・認証方式・API Key）
- [ ] 機密情報を誤ってコミットしていない
- [ ] 大容量ファイルをコミットしない（>50MBはGitHub警告。ZIPは基本リポジトリに含めない）

参考: 現在のビルドSpec（Amplify App定義）
- preBuild: `npm ci --legacy-peer-deps`
- build: `npm run build`
- artifacts: `dist/**/*`

---

### 2. リリース手順（詳細）
1) 変更をコミット・プッシュ
```bash
git add -A
git commit -m "feat: 変更内容"
git push origin main
```
2) ジョブ状況を確認（直近5件）
```bash
aws amplify list-jobs --app-id d1ewt5l0oirslc --branch-name main --max-items 5
```
- `status: RUNNING` → 完了まで待機
- `SUCCEED` → 次へ
- `FAILED` → 次章のトラブルシュート

3) 反映確認
- 本番URL: `https://d1ewt5l0oirslc.amplifyapp.com`
- 観点
  - ホームの青バッジが「2025年」になっている
  - トリガートレーニングの「鬼モード」赤ラベルが表示
  - ランキング／プレイ回数が表示（特にiPhoneでも）
  - 「前回の記録」が表示（今回実装: Trigger Timingの前回記録）
  - 新規プレイ→結果保存→トップ・履歴への反映

キャッシュ考慮
- PC: Cmd+Shift+R（ハードリロード）
- モバイル: プライベートウィンドウで再確認

---

### 3. トラブルシューティング（実際に遭遇した事象と対処）

- 3.1 手動デプロイAPIがエラー（BadRequest: Operation not supported）
  - 原因: 連携リポジトリ方式のため、`create-deployment` は使えない。
  - 対処: `main` にプッシュしてAutoBuildを使う。

- 3.2 Amplify CLI の状態破損／`amplify push` 失敗
  - 事象: `amplify/#current-cloud-backend/amplify-meta.json` 不在など。
  - 背景: 本番はAdmin/既存管理で、ローカルCLIのバックエンド同期に依存しない。
  - 対処: 本番のスキーマ変更は行わない方針。フロント側のみ変更し、`main` プッシュで反映。

- 3.3 AppSync操作で `AccessDeniedException`／`NotFoundException`
  - 事象: `aws appsync list-graphql-apis` などが認可不足で失敗。
  - 対処: フロントは固定の GraphQL エンドポイント＋API Key を `Amplify.configure` に直指定。CLIの権限に依存しない。

- 3.4 GraphQL未接続でランキング/回数が出ない
  - 原因: `aws-exports.js`/`amplifyconfiguration.json` が最小構成で、エンドポイントやAPI Key欠落。
  - 対処: `src/main.tsx` で `Amplify.configure({ API: { GraphQL: { endpoint, region, defaultAuthMode: 'apiKey', apiKey }}})` を明示。

- 3.5 iPhone（実機）でランキング/回数が表示されない
  - 原因: ローカルHTTP参照時のセキュアコンテキスト/CORS周り。
  - 対処: 実機検証は本番URLか、ngrok/Cloudflare TunnelなどHTTPSトンネルを使用。

- 3.6 週間ランキングの切替でUIが壊れた
  - 対処: 一旦「総合ランキング」にフォールバック（`HybridRankingService.getWeeklyRankings`で条件分岐）し、週次はGSI整備後に再開。

- 3.7 Trigger Timingのトッププレイヤーが不正
  - 原因: 「高スコアほど良い」判定を逆に扱っていた箇所があった。
  - 対処: `cloudRankingService.getTopPlayerOptimized` 等を修正（`item.score > bestScoreItem.score`）。

- 3.8 ビルド失敗（TypeScript/古いページでこける）
  - 対処: `_old` ディレクトリ等はビルド対象から除外。ローカルで `npm ci && npm run build` を先に通す。

- 3.9 大容量ファイルのコミット警告
  - 事象: GitHubが50MB超で警告。例: `deploy/*.zip`。
  - 対処: ZIPをリポジトリ管理しない（`.gitignore`）。必要ならGit LFS検討。

---

### 4. よく使う確認コマンド
```bash
# アプリ情報
aws amplify get-app --app-id d1ewt5l0oirslc

# ブランチ一覧
aws amplify list-branches --app-id d1ewt5l0oirslc

# 最新ジョブ確認
aws amplify list-jobs --app-id d1ewt5l0oirslc --branch-name main --max-items 5

# 個別ジョブ詳細
aws amplify get-job --app-id d1ewt5l0oirslc --branch-name main --job-id <ID>
```

---

### 5. ロールバック
- もっとも簡単: Gitで直前コミットを戻す
```bash
git revert <問題コミットSHA>
git push origin main
```
- または、Amplifyコンソールから過去の成功コミットを選んで `Redeploy`。

---

### 6. 運用メモ（更新ルール）
- デプロイ内容にUI変更を含む場合、ホームで次を重点チェック
  - 「2025年」ラベル、トリガー「鬼モード」バッジ
  - ランキング/プレイ回数、前回記録
- 実機検証は必ず本番URLで実施。ローカルHTTPは不可/不安定。
- 週次ランキングのバックエンド改修（GSI/スキーマ）は別イニシアチブで実施。フロントはフォールバック維持。

---

### 7. 変更ポイントの所在（参考）
- 年ラベル: `src/pages/HomePage.tsx` 内 `weekTitle = `${week.year}年``
- 鬼モードバッジ: `HomePage.tsx` の `GameCard` 画像オーバーレイ（タイトルに「トリガー」を含むと表示）
- 前回記録（Trigger Timing）: `GameHistoryService.getGameHistory('trigger-timing')` を利用して `HomePage.tsx` で表示
- GraphQL設定: `src/main.tsx` の `Amplify.configure`

---

### 8. 付録：ローカル動作確認
```bash
npm ci
npm run dev
# http://localhost:5173 を開く
```
- 実機は HTTPS トンネルを使う（ngrok/Cloudflare Tunnel推奨）。

---

以上。困ったら 1) プッシュ → 2) ジョブ確認 → 3) ログ確認 → 4) 本番URL検証 の順で進めればOK。
