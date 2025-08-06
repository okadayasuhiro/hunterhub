#!/bin/bash
# HunterHub 作業前安全チェックシステム
# 削除事件再発防止のための事前確認

echo "🛡️ HunterHub Pre-Work Safety Check"
echo "Date: $(date +%Y-%m-%d_%H:%M:%S)"

# 1. Git同期状況確認
echo "🔍 Checking Git sync status..."
git fetch origin

LOCAL_AHEAD=$(git rev-list --count HEAD ^origin/main)
REMOTE_AHEAD=$(git rev-list --count origin/main ^HEAD)

echo "📊 Sync Status:"
echo "  Local ahead: $LOCAL_AHEAD commits"
echo "  Remote ahead: $REMOTE_AHEAD commits"

# 2. 危険な状況の警告
SAFE_TO_PROCEED=true

if [ $LOCAL_AHEAD -gt 5 ]; then
    echo "⚠️  WARNING: Local is significantly ahead ($LOCAL_AHEAD commits)"
    echo "🔄 Consider running: git push origin main"
    SAFE_TO_PROCEED=false
fi

if [ $REMOTE_AHEAD -gt 0 ]; then
    echo "⚠️  WARNING: Remote has new commits ($REMOTE_AHEAD commits)"
    echo "📥 Consider running: git pull origin main"
    echo "🔍 Recent remote commits:"
    git log --oneline origin/main ^HEAD -3
    SAFE_TO_PROCEED=false
fi

# 3. 作業ディレクトリ確認
echo "📁 Checking working directory..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  WARNING: Uncommitted changes detected"
    echo "💾 Consider committing changes before proceeding"
    git status --short
    SAFE_TO_PROCEED=false
fi

# 4. 重要ファイル存在確認
echo "📋 Checking critical files..."
CRITICAL_FILES=(
    "src/data/diagnosis/animalDescriptions.ts"
    "src/data/diagnosis/animals.ts"
    "src/pages/DiagnosisResultPage.tsx"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ CRITICAL: Missing file: $file"
        SAFE_TO_PROCEED=false
    else
        echo "✅ Found: $file"
    fi
done

# 5. 安全性判定
echo "🎯 Safety Assessment:"
if [ "$SAFE_TO_PROCEED" = true ]; then
    echo "✅ SAFE TO PROCEED"
    echo "🚀 You can start working safely"
    
    # セーフポイント作成
    echo "💾 Creating safety checkpoint..."
    git add .
    git commit -m "SAFE: Pre-work checkpoint - $(date +%Y-%m-%d_%H:%M)" > /dev/null 2>&1
    echo "✅ Safety checkpoint created"
    
    exit 0
else
    echo "🚨 NOT SAFE TO PROCEED"
    echo "⚠️  Please resolve the warnings above before starting work"
    echo "📖 Recommended actions:"
    echo "  1. Sync with remote repository"
    echo "  2. Commit any uncommitted changes"
    echo "  3. Run this script again"
    exit 1
fi 