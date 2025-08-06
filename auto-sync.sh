#!/bin/bash
# HunterHub Git自動同期システム
# 削除事件再発防止のための自動同期

echo "🔄 HunterHub Auto-Sync System Starting..."
echo "Date: $(date +%Y-%m-%d_%H:%M:%S)"

# 1. 現在の状況確認
echo "📊 Current Git Status:"
git status --porcelain
git log --oneline -1

# 2. リモート最新情報取得
echo "📡 Fetching remote updates..."
git fetch origin

# 3. ローカルとリモートの差異確認
LOCAL_COMMITS=$(git rev-list --count HEAD ^origin/main)
REMOTE_COMMITS=$(git rev-list --count origin/main ^HEAD)

echo "📈 Sync Status:"
echo "  Local ahead: $LOCAL_COMMITS commits"
echo "  Remote ahead: $REMOTE_COMMITS commits"

# 4. 危険な状況の検出
if [ $LOCAL_COMMITS -gt 10 ]; then
    echo "🚨 WARNING: Local is $LOCAL_COMMITS commits ahead!"
    echo "🔄 Auto-pushing to prevent data loss..."
    
    # 安全なプッシュ
    git push origin main --force-with-lease
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully synced $LOCAL_COMMITS commits to remote"
    else
        echo "❌ Failed to push. Manual intervention required!"
        exit 1
    fi
fi

if [ $REMOTE_COMMITS -gt 5 ]; then
    echo "🚨 WARNING: Remote is $REMOTE_COMMITS commits ahead!"
    echo "⚠️  Manual review required before pulling"
    echo "🔍 Recent remote commits:"
    git log --oneline origin/main ^HEAD -5
    exit 1
fi

# 5. 自動同期実行
if [ $LOCAL_COMMITS -eq 0 ] && [ $REMOTE_COMMITS -eq 0 ]; then
    echo "✅ Already in sync"
elif [ $LOCAL_COMMITS -gt 0 ] && [ $REMOTE_COMMITS -eq 0 ]; then
    echo "📤 Pushing local changes..."
    git push origin main
elif [ $LOCAL_COMMITS -eq 0 ] && [ $REMOTE_COMMITS -gt 0 ]; then
    echo "📥 Pulling remote changes..."
    git pull origin main
else
    echo "⚠️  Complex sync situation detected. Manual intervention required."
    exit 1
fi

echo "🎯 Auto-sync completed successfully!"
echo "📅 Next sync: Run this script before any major changes" 