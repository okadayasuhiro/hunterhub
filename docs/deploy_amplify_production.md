## ハントレ フロントエンド 本番デプロイ手順（Amplify Hosting 連携リポジトリ）

このドキュメントは、毎回迷わず本番リリースできるように、実作業順に徹底的に丁寧にまとめています。対象は以下です。
- アプリID: `d1ewt5l0oirslc` （リージョン: ap-northeast-1）
- ブランチ: `main`（AutoBuild 有効）
- リポジトリ: `https://github.com/okadayasuhiro/hunterhub`

---

### 0. 前提・約束事
- 本番は Amplify Hosting の「連携リポジトリ（GitHub）」方式。手動ZIPアップロードは不可（APIもエラーになる）。
- `main` にプッシュすると自動でビルド＆デプロイが走る。
- バックエンド（AppSync/DynamoDB）は別管理。フロントは `dist/` の静的アセット。
- SPAルーティングはリダイレクト規則でカバー済み（`/<*> -> /index.html (404-200)`）。

---

### 1. 変更をコミットして main にプッシュ
1) 変更確認
```bash
git status
```
2) まとめてステージング
```bash
git add -A
```
3) コミット
```bash
git commit -m "feat: 変更内容を簡潔に記述"
```
4) プッシュ
```bash
git push origin main
```

注意:
- 大容量ファイル（>50MB）はGitHub警告が出るため、配布用ZIPは基本リポジトリに含めない。必要な場合はGit LFSを検討。

---

### 2. Amplify のビルド状態を確認（CLI）
最新5件のジョブを確認:
```bash
aws amplify list-jobs --app-id d1ewt5l0oirslc --branch-name main --max-items 5
```
- `status` が `RUNNING` → 完了待ち
- `SUCCEED` → 成功
- `FAILED` → 失敗（次節でログ確認）

---

### 3. 失敗時のログ確認と再実行
ジョブIDを指定して詳細確認:
```bash
# 例: jobId=16
aws amplify get-job --app-id d1ewt5l0oirslc --branch-name main --job-id 16
```
- `startTime` `endTime` と `status` を確認
- 画面でも確認したい場合: Amplifyコンソール → 対象アプリ → Branch `main` → `Activity` → 該当ジョブ → `Build logs`

よくある失敗の原因:
- Nodeの依存解決（`npm ci` で失敗）
- TypeScriptビルドエラー
- `dist` 出力が空（Vite設定/環境変数ミス）

対処のコツ:
- ローカルで `npm ci && npm run build` を必ず通す
- ビルド後に `dist/` の `index.html` と `assets/` が生成されているか確認

---

### 4. 反映確認（本番サイト）
- 本番URL: `https://d1ewt5l0oirslc.amplifyapp.com`
- 確認観点:
  - ホーム表示（文言・画像・「2025年」バッジ）
  - ランキング・プレイ回数の表示
  - 「前回の記録」の表示（各ゲーム）
  - 新規プレイ→結果保存→トップ/履歴反映

キャッシュの影響が疑わしいとき:
- ブラウザ強制リロード（Cmd+Shift+R）
- モバイルはプライベートウィンドウで確認

---

### 5. ロールバック（直前の成功ビルドへ戻す）
最も簡単なのはGitで戻す方法:
```bash
git revert <問題コミットSHA>
git push origin main
```
または、コンソールから過去の成功ビルドを `Redeploy` してもOK（連携Repoの場合は対象コミットの再ビルド）。

---

### 6. トラブルシューティング集
- 「手動ZIPアップロードで更新したい」
  - 連携リポジトリ方式のため不可。`main` へプッシュでデプロイする。
- 「iPhoneでランキングが表示されない」
  - ローカルHTTPを参照していると認証/セキュアコンテキスト要件で失敗することがある。実機検証は本番URLかHTTPSトンネル（ngrok/Cloudflare Tunnel）を使用。
- 「GraphQLに繋がらない」
  - `src/main.tsx` の `Amplify.configure` が最新のエンドポイント/API Keyを指しているか確認。
- 「週間ラベルを出したくない」
  - `HomePage.tsx` は年のみ表示に修正済み（`weekTitle = "${week.year}年"`）。

---

### 7. リリース前チェックリスト（最小）
- [ ] ローカルで `npm ci && npm run build` が成功
- [ ] 重要画面の文言/画像/リンク確認
- [ ] ランキング・プレイ回数・前回記録が表示
- [ ] 秘密情報がリポジトリに含まれていない
- [ ] 変更を `main` にプッシュ

---

### 8. 参考コマンド（全部まとめ）
```bash
# 変更の確認→コミット→プッシュ
git status
git add -A
git commit -m "feat: 更新"
git push origin main

# Amplify ビルド状況
aws amplify list-jobs --app-id d1ewt5l0oirslc --branch-name main --max-items 5
aws amplify get-job    --app-id d1ewt5l0oirslc --branch-name main --job-id <ID>
```

---

### 9. 補遺: S3 + CloudFront でのホスティングに切り替える場合
> 現状はAmplify Hosting推奨。どうしても切り替える場合のメモ。

1) 本番S3バケット作成（ブロックパブリックアクセスON、静的サイトホスティングOFFでOK）
2) `dist/` をアップロード
3) CloudFrontディストリビューション作成（S3オリジン、`/index.html` をデフォルトルート）
4) オブジェクトキャッシュ無効化（`/*`）
5) SPA用にエラーページを `/index.html` にマッピング

---

### 10. 用語早見表
- Amplify App: `d1ewt5l0oirslc`（ap-northeast-1）
- ブランチ: `main`（AutoBuild 有効）
- 本番URL: `https://d1ewt5l0oirslc.amplifyapp.com`
- ビルド出力: `dist/`

---

以上。迷ったら 1→2→3→4 の順に実行してください。
