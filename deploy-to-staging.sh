#!/bin/bash
# HunterHub ステージング（dev）デプロイスクリプト

echo "🧪 HunterHub Staging Deployment Script"
echo "======================================"

# 現在のブランチ確認
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# devブランチに切り替え（必要に応じて）
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "🔄 Switching to dev branch..."
    git checkout dev
    git pull origin dev
fi

# 変更をコミット（未コミットがある場合）
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Uncommitted changes found. Committing..."
    git add .
    read -p "Enter commit message: " commit_msg
    git commit -m "$commit_msg"
fi

# リモートにプッシュ
echo "📤 Pushing to remote dev branch..."
git push origin dev

# ビルド実行
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# ステージングデプロイ
echo "🚀 Deploying to staging..."
amplify publish --yes

if [ $? -eq 0 ]; then
    echo "✅ Staging deployment successful!"
    echo "🌐 Staging URL: https://dev.d202ov1d7n8aaj.amplifyapp.com"
    echo ""
    echo "🎯 Ready for production deployment?"
    echo "   Run: ./deploy-to-production.sh"
else
    echo "❌ Staging deployment failed!"
    exit 1
fi
