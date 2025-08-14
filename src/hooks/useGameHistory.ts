import { useState, useEffect, useCallback } from 'react';
import { UserIdentificationService } from '../services/userIdentificationService';

export const useGameHistory = <T>(storageKey: string, maxHistorySize: number = 10) => {
    const [gameHistory, setGameHistory] = useState<T[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const userService = UserIdentificationService.getInstance();

    // ユーザーID取得とゲーム履歴読み込み
    useEffect(() => {
        const initializeUser = async () => {
            const userId = await userService.getCurrentUserId();
            setCurrentUserId(userId);
            console.log(`🎮 Game history initialized for user: ${userId.substring(0, 8)}...`);
        };

        const savedHistory = localStorage.getItem(storageKey);
        if (savedHistory) {
            try {
                setGameHistory(JSON.parse(savedHistory));
            } catch (error) {
                console.error('Failed to parse game history:', error);
                setGameHistory([]);
            }
        }

        initializeUser();
    }, [storageKey]);

    // ゲーム履歴を保存（ユーザー識別付き）
    const saveGameResult = useCallback(async (newResult: T) => {
        // ユーザーIDが未取得の場合は取得
        let userId = currentUserId;
        if (!userId) {
            userId = await userService.getCurrentUserId();
            setCurrentUserId(userId);
        }

        // ゲームプレイ数を増加
        await userService.incrementGameCount();

        // 結果にユーザーIDとタイムスタンプを追加
        const enhancedResult = {
            ...newResult,
            userId,
            timestamp: new Date().toISOString(),
            sessionId: `${userId.substring(0, 8)}_${Date.now()}`
        };

        const updatedHistory = [enhancedResult, ...gameHistory].slice(0, maxHistorySize);
        setGameHistory(updatedHistory);
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

        console.log(`💾 Game result saved for user: ${userId.substring(0, 8)}...`);
    }, [gameHistory, storageKey, maxHistorySize, currentUserId, userService]);

    // ベスト記録を取得（カスタム比較関数を使用）
    const getBestRecord = useCallback((compareFn: (a: T, b: T) => boolean) => {
        if (gameHistory.length === 0) return null;
        return gameHistory.reduce((best, current) =>
            compareFn(current, best) ? current : best
        );
    }, [gameHistory]);

    // 新記録かどうかを判定
    const isNewRecord = useCallback((newScore: number, compareFn: (a: T, b: T) => boolean) => {
        const bestRecord = getBestRecord(compareFn);
        if (!bestRecord) return true; // 初回記録は新記録
        
        // スコアフィールドを動的に取得（型安全でない場合の対策）
        const bestScore = (bestRecord as any).score || (bestRecord as any).reactionTime || 0;
        return newScore > bestScore || (typeof newScore === 'number' && typeof bestScore === 'number' && newScore < bestScore);
    }, [getBestRecord]);

    // ユーザー名登録が必要かチェック
    const shouldShowUsernameModal = useCallback(async (isRecord: boolean): Promise<boolean> => {
        // 新記録の場合は必ず表示
        if (isRecord) return true;
        
        // ユーザー名未設定かつ2回以上プレイしている場合は表示
        const hasUsername = await userService.hasUsername();
        const userProfile = await userService.getCurrentUserProfile();
        
        return !hasUsername && userProfile.totalGamesPlayed >= 2;
    }, [userService]);

    return {
        gameHistory,
        saveGameResult,
        getBestRecord,
        isNewRecord,
        shouldShowUsernameModal,
        currentUserId
    };
}; 