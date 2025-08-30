# HunterHub GitHub CI/CD セットアップガイド

## 現在の問題
- Amplifyが手動デプロイ設定（`"type": "manual"`）
- GitHub連携が未設定
- mainブランチが本番環境にデプロイされない

## 解決方法

### Option 1: 既存アプリの設定変更
1. AWS Amplifyコンソール → hunterhubアプリ
2. 「ホスティング」→「継続的デプロイメント」
3. 「GitHub接続」を選択
4. リポジトリ: `okadayasuhiro/hunterhub`
5. ブランチ設定:
   - `main` → 本番環境（https://hantore.net）
   - `dev` → ステージング環境

### Option 2: 新しいAmplifyアプリ作成（推奨）
1. AWS Amplifyコンソール → 「新しいアプリ」
2. 「GitHub」を選択
3. リポジトリ: `okadayasuhiro/hunterhub`
4. ブランチ: `main`
5. ビルド設定: `amplify.yml`を使用
6. カスタムドメイン: `hantore.net`を設定

## 理想的なワークフロー

```
開発者 → dev push → ステージング自動デプロイ
       ↓
    確認OK → main merge → 本番自動デプロイ
```

## ビルド設定（amplify.yml）
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## 環境変数設定
- NODE_ENV: production
- その他必要な環境変数

## カスタムドメイン設定
- hantore.net
- www.hantore.net
- SSL証明書自動設定
