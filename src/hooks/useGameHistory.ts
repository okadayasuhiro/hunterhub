import { useState, useEffect, useCallback } from 'react';

export const useGameHistory = <T>(storageKey: string, maxHistorySize: number = 10) => {
    const [gameHistory, setGameHistory] = useState<T[]>([]);

    // ローカルストレージからゲーム履歴を読み込み
    useEffect(() => {
        const savedHistory = localStorage.getItem(storageKey);
        if (savedHistory) {
            try {
                setGameHistory(JSON.parse(savedHistory));
            } catch (error) {
                console.error('Failed to parse game history:', error);
                setGameHistory([]);
            }
        }
    }, [storageKey]);

    // ゲーム履歴を保存
    const saveGameResult = useCallback((newResult: T) => {
        const updatedHistory = [newResult, ...gameHistory].slice(0, maxHistorySize);
        setGameHistory(updatedHistory);
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
    }, [gameHistory, storageKey, maxHistorySize]);

    // ベスト記録を取得（カスタム比較関数を使用）
    const getBestRecord = useCallback((compareFn: (a: T, b: T) => boolean) => {
        if (gameHistory.length === 0) return null;
        return gameHistory.reduce((best, current) =>
            compareFn(current, best) ? current : best
        );
    }, [gameHistory]);

    return {
        gameHistory,
        saveGameResult,
        getBestRecord
    };
}; 