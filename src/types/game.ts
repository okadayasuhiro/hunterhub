// 共通のゲーム関連型定義
export interface HunterRank {
    rank: string;
    number: number;
    total: number;
    color?: string;
}

// 反射神経テスト関連
export interface TestResult {
    time: number;
    round: number;
    success: boolean;
    reactionTime?: number; // 互換性のため追加
}

export interface ReflexGameHistory {
    date: string;
    averageTime: number;
    bestTime: number;
    successRate: number;
    testResults: TestResult[];
    // 加重平均システム用の新フィールド
    successCount: number;
    failureCount: number;
    weightedScore: number; // 最終ランキングスコア（低いほど上位）
}

// ターゲット追跡関連
export interface TargetResult {
    targetNumber: number;
    reactionTime: number;
    timestamp: number;
}

export interface TargetTrackingHistory {
    date: string;
    totalTime: number;
    averageReactionTime: number;
    accuracy: number;
    targetResults: TargetResult[];
}

// 数字順序ゲーム関連
export interface NumberButton {
    id: number;
    number: number;
    x: number;
    y: number;
    clicked: boolean;
}

export interface SequenceGameHistory {
    date: string;
    completionTime: number;
    averageClickInterval: number;
    successClickRate: number;
    rank: number;
    rankTitle: string;
    completed: boolean;
}

// ハンターランク計算関数
export const getReflexHunterRank = (avgTime: number): HunterRank => {
    if (avgTime <= 200) return { rank: 'ハンター・オブ・ザ・オリジン', number: 1, total: 12 };
    if (avgTime <= 249) return { rank: 'ハンター・ゼロ', number: 2, total: 12 };
    if (avgTime <= 299) return { rank: 'ゴッドハンター', number: 3, total: 12 };
    if (avgTime <= 349) return { rank: 'アルティメットハンター', number: 4, total: 12 };
    if (avgTime <= 399) return { rank: 'ベテランハンター', number: 5, total: 12 };
    if (avgTime <= 449) return { rank: 'スキルドハンター', number: 6, total: 12 };
    if (avgTime <= 499) return { rank: 'アマチュアハンター', number: 7, total: 12 };
    if (avgTime <= 599) return { rank: 'ルーキーハンター', number: 8, total: 12 };
    if (avgTime <= 699) return { rank: 'ミスティーハンター', number: 9, total: 12 };
    if (avgTime <= 799) return { rank: 'スロウリーハンター', number: 10, total: 12 };
    if (avgTime <= 899) return { rank: 'スリーピーハンター', number: 11, total: 12 };
    return { rank: 'リラックスハンター', number: 12, total: 12 };
};

export const getTargetHunterRank = (avgReactionTime: number): HunterRank => {
    if (avgReactionTime <= 0.5) return { rank: 'ハンター・オブ・ザ・オリジン', number: 1, total: 12 };
    if (avgReactionTime <= 0.7) return { rank: 'ハンター・ゼロ', number: 2, total: 12 };
    if (avgReactionTime <= 0.9) return { rank: 'ゴッドハンター', number: 3, total: 12 };
    if (avgReactionTime <= 1.1) return { rank: 'アルティメットハンター', number: 4, total: 12 };
    if (avgReactionTime <= 1.3) return { rank: 'ベテランハンター', number: 5, total: 12 };
    if (avgReactionTime <= 1.5) return { rank: 'スキルドハンター', number: 6, total: 12 };
    if (avgReactionTime <= 1.7) return { rank: 'アマチュアハンター', number: 7, total: 12 };
    if (avgReactionTime <= 2.0) return { rank: 'ルーキーハンター', number: 8, total: 12 };
    if (avgReactionTime <= 2.3) return { rank: 'ミスティーハンター', number: 9, total: 12 };
    if (avgReactionTime <= 2.6) return { rank: 'スロウリーハンター', number: 10, total: 12 };
    if (avgReactionTime <= 2.9) return { rank: 'スリーピーハンター', number: 11, total: 12 };
    return { rank: 'リラックスハンター', number: 12, total: 12 };
};

export const getSequenceRankFromTime = (timeInSeconds: number): { rank: number; title: string; color: string } => {
    if (timeInSeconds <= 15) return { rank: 1, title: 'ハンター・オブ・ザ・オリジン', color: 'from-red-500 to-pink-600' };
    if (timeInSeconds <= 22) return { rank: 2, title: 'ハンター・ゼロ', color: 'from-purple-500 to-indigo-600' };
    if (timeInSeconds <= 29) return { rank: 3, title: 'ゴッドハンター', color: 'from-blue-500 to-cyan-600' };
    if (timeInSeconds <= 37) return { rank: 4, title: 'アルティメットハンター', color: 'from-green-500 to-teal-600' };
    if (timeInSeconds <= 44) return { rank: 5, title: 'ベテランハンター', color: 'from-yellow-500 to-orange-600' };
    if (timeInSeconds <= 52) return { rank: 6, title: 'スキルドハンター', color: 'from-orange-500 to-red-600' };
    if (timeInSeconds <= 59) return { rank: 7, title: 'アマチュアハンター', color: 'from-pink-500 to-purple-600' };
    if (timeInSeconds <= 74) return { rank: 8, title: 'ルーキーハンター', color: 'from-indigo-500 to-blue-600' };
    if (timeInSeconds <= 89) return { rank: 9, title: 'ミスティーハンター', color: 'from-cyan-500 to-green-600' };
    if (timeInSeconds <= 104) return { rank: 10, title: 'スロウリーハンター', color: 'from-teal-500 to-yellow-600' };
    if (timeInSeconds <= 119) return { rank: 11, title: 'スリーピーハンター', color: 'from-gray-500 to-gray-600' };
    return { rank: 12, title: 'リラックスハンター', color: 'from-gray-400 to-gray-500' };
};

// 時間フォーマット関数
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ローカルストレージキー定数
export const STORAGE_KEYS = {
    REFLEX_HISTORY: 'reflexTestHistory',
    TARGET_HISTORY: 'targetTrackingHistory',
    SEQUENCE_HISTORY: 'sequenceGameHistory'
} as const;

// 反射神経テスト - 加重平均システム定数
export const REFLEX_SCORING = {
    FAILURE_PENALTY: 1000, // 失敗時のペナルティ（ms）
    MIN_SUCCESS_COUNT: 3,  // ランキング参加最低成功回数
    MAX_ATTEMPTS: 5        // 最大試行回数
} as const;

// 反射神経テスト - 加重平均スコア計算関数
export const calculateWeightedScore = (testResults: TestResult[]): {
    successCount: number;
    failureCount: number;
    averageSuccessTime: number;
    weightedScore: number;
} => {
    const successResults = testResults.filter(r => r.success && r.time > 0);
    const failureResults = testResults.filter(r => !r.success);
    
    const successCount = successResults.length;
    const failureCount = failureResults.length;
    const averageSuccessTime = successCount > 0 
        ? successResults.reduce((sum, r) => sum + r.time, 0) / successCount
        : 0;
    
    // 加重平均スコア計算: (成功平均 × 成功回数 + ペナルティ × 失敗回数) / 総試行回数
    const weightedScore = testResults.length > 0
        ? (averageSuccessTime * successCount + REFLEX_SCORING.FAILURE_PENALTY * failureCount) / testResults.length
        : REFLEX_SCORING.FAILURE_PENALTY;

    console.log(`📊 Score calculation - averageSuccessTime: ${averageSuccessTime.toFixed(5)}ms, weightedScore: ${weightedScore.toFixed(5)}ms`);
    
    return {
        successCount,
        failureCount,
        averageSuccessTime,
        weightedScore
    };
}; 