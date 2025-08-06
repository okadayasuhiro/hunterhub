#!/bin/bash
# HunterHub Git同期監視システム
# 定期実行による削除事件予防

LOG_FILE="sync-monitor.log"

echo "📊 HunterHub Sync Monitor - $(date +%Y-%m-%d_%H:%M:%S)" | tee -a $LOG_FILE

# 1. リモート状況取得
git fetch origin > /dev/null 2>&1

# 2. 同期状況分析
LOCAL_AHEAD=$(git rev-list --count HEAD ^origin/main)
REMOTE_AHEAD=$(git rev-list --count origin/main ^HEAD)

# 3. 危険レベル判定
RISK_LEVEL="LOW"
ACTION_REQUIRED=false

if [ $LOCAL_AHEAD -gt 20 ]; then
    RISK_LEVEL="CRITICAL"
    ACTION_REQUIRED=true
elif [ $LOCAL_AHEAD -gt 10 ]; then
    RISK_LEVEL="HIGH"
    ACTION_REQUIRED=true
elif [ $LOCAL_AHEAD -gt 5 ]; then
    RISK_LEVEL="MEDIUM"
fi

if [ $REMOTE_AHEAD -gt 10 ]; then
    RISK_LEVEL="CRITICAL"
    ACTION_REQUIRED=true
elif [ $REMOTE_AHEAD -gt 5 ]; then
    RISK_LEVEL="HIGH"
    ACTION_REQUIRED=true
fi

# 4. ログ記録
echo "Risk Level: $RISK_LEVEL | Local: +$LOCAL_AHEAD | Remote: +$REMOTE_AHEAD" | tee -a $LOG_FILE

# 5. 緊急アクション
if [ "$ACTION_REQUIRED" = true ]; then
    echo "🚨 EMERGENCY ACTION REQUIRED!" | tee -a $LOG_FILE
    
    if [ $LOCAL_AHEAD -gt 10 ] && [ $REMOTE_AHEAD -eq 0 ]; then
        echo "🔄 Auto-pushing to prevent data loss..." | tee -a $LOG_FILE
        git push origin main --force-with-lease
        
        if [ $? -eq 0 ]; then
            echo "✅ Emergency push successful" | tee -a $LOG_FILE
        else
            echo "❌ Emergency push failed!" | tee -a $LOG_FILE
        fi
    fi
    
    # アラート通知（将来的にSlack/メール連携可能）
    echo "📢 ALERT: HunterHub sync requires attention" | tee -a $LOG_FILE
fi

# 6. 統計情報更新
echo "$(date +%Y-%m-%d_%H:%M:%S),$RISK_LEVEL,$LOCAL_AHEAD,$REMOTE_AHEAD" >> sync-stats.csv

echo "Monitor check completed." | tee -a $LOG_FILE 