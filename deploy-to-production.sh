#!/bin/bash
# HunterHub 本番デプロイスクリプト

echo "🚀 HunterHub Production Deployment Script"
echo "=========================================="

# 現在のブランチ確認
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Must be on main branch for production deployment"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Git状態確認
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Working directory not clean. Please commit all changes."
    git status
    exit 1
fi

# 最新の変更を取得
echo "📥 Fetching latest changes..."
git fetch origin
git pull origin main

# ビルド実行
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# デプロイ確認
echo ""
echo "🎯 Ready to deploy to PRODUCTION (https://hantore.net)"
echo "📋 Changes to be deployed:"
git log --oneline -5

echo ""
read -p "🚨 Deploy to PRODUCTION? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    
    # Amplifyデプロイ実行
    amplify publish --yes
    
    if [ $? -eq 0 ]; then
        echo "✅ Production deployment successful!"
        echo "🌐 URL: https://hantore.net"
        echo "🌐 URL: https://www.hantore.net"
        
        # デプロイタグ作成
        DEPLOY_TAG="production-$(date +%Y%m%d-%H%M%S)"
        git tag -a $DEPLOY_TAG -m "Production deployment: $(date)"
        git push origin $DEPLOY_TAG
        echo "🏷️  Created deployment tag: $DEPLOY_TAG"
    else
        echo "❌ Production deployment failed!"
        exit 1
    fi
else
    echo "❌ Production deployment cancelled."
    exit 0
fi
