import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { HybridRankingService } from '../services/hybridRankingService';
import { UserIdentificationService } from '../services/userIdentificationService';
import type { RankingData, RankingEntry } from '../services/localRankingService';

// 日付フォーマット関数
const formatDateTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

interface GameRankingTableProps {
    gameType: 'reflex' | 'target' | 'sequence';
    limit?: number;
    highlightCurrentUser?: boolean; // 現在ユーザーを赤色でハイライトするかどうか
    currentGameScore?: number; // 今回のゲーム結果スコア（この値と一致する行のみ赤くハイライト）
}

interface ExtendedRankingEntry extends RankingEntry {
    isXLinked?: boolean;
    xDisplayName?: string;
    xProfileImageUrl?: string;
}

// ユーザーアイコンコンポーネント
const UserIcon: React.FC<{ 
    isXLinked?: boolean; 
    className?: string; 
    isCurrentUser?: boolean;
    xProfileImageUrl?: string;
}> = ({ 
    isXLinked, 
    className = "w-10 h-10", 
    isCurrentUser = false,
    xProfileImageUrl
}) => {
    if (isCurrentUser) {
        if (isXLinked && xProfileImageUrl) {
            // 現在のユーザーでX連携済み：X連携画像を表示
            return (
                <div className={`${className} rounded-full overflow-hidden shadow-sm`}>
                    <img 
                        src={xProfileImageUrl}
                        alt="X profile icon"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // 画像読み込み失敗時のフォールバック
                            console.error('Failed to load X profile icon');
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                                target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center text-white font-bold text-xs" style="background: linear-gradient(45deg, #87CEEB 0%, #FF8C42 100%)">
                                        🧢
                                    </div>
                                `;
                            }
                        }}
                    />
                </div>
            );
        } else {
            // 現在のユーザーでX連携なし：デフォルトアイコンを表示
            return (
                <div className={`${className} bg-gray-300 rounded-full flex items-center justify-center`}>
                    <User className="w-3 h-3 text-gray-600" />
                </div>
            );
        }
    } else if (isXLinked) {
        // 他のユーザーのX連携アイコン（黒いXロゴ）
        return (
            <div className={`${className} bg-black rounded-full flex items-center justify-center`}>
                <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="white"
                    className="w-3 h-3"
                >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            </div>
        );
    } else {
        // デフォルトユーザーアイコン
        return (
            <div className={`${className} bg-gray-300 rounded-full flex items-center justify-center`}>
                <User className="w-3 h-3 text-gray-600" />
            </div>
        );
    }
};





const GameRankingTable: React.FC<GameRankingTableProps> = ({ gameType, limit = 10, highlightCurrentUser = false, currentGameScore }) => {
    const [rankingData, setRankingData] = useState<RankingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const rankingService = HybridRankingService.getInstance();
    const userService = UserIdentificationService.getInstance();

    useEffect(() => {
        loadRankingData();
    }, [gameType]);

    // X連携状態の変化を監視（安全版）
    const [isXLinkedState, setIsXLinkedState] = useState<boolean>(false);
    
    useEffect(() => {
        let isMounted = true;
        
        const checkXLinkStatus = async () => {
            if (!isMounted) return;
            
            try {
                const isXLinked = await userService.isXLinked();
                
                // 状態が変化した場合のみ更新
                if (isXLinked !== isXLinkedState) {
                    setIsXLinkedState(isXLinked);
                    
                    // X連携状態が変化した場合（連携・解除どちらも）ランキングデータを再読み込み
                    setTimeout(() => {
                        if (isMounted) {
                            loadRankingData();
                        }
                    }, 1000); // 1秒遅延で確実に更新
                }
            } catch (error) {
                console.error('X連携状態チェックエラー:', error);
            }
        };

        // 初回チェック
        checkXLinkStatus();
        
        // 3秒間隔でチェック（さらに頻度を下げる）
        const interval = setInterval(checkXLinkStatus, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isXLinkedState]); // isXLinkedStateの変化のみ監視

    const loadRankingData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await rankingService.getRankings(gameType, limit);
            
            // 現在のユーザーのX連携状態を取得
            const currentUserId = await userService.getCurrentUserId();
            const isCurrentUserXLinked = await userService.isXLinked();
            const currentUserXName = isCurrentUserXLinked ? await userService.getDisplayName() : undefined;
            const currentUserXImageUrl = isCurrentUserXLinked ? await userService.getXProfileImageUrl() : undefined;
            
            // 各エントリーにX連携情報を追加（全ユーザー対象）
            const extendedRankings = data.rankings.map(entry => {
                // CloudRankingServiceから既にX連携情報が含まれているかチェック
                const hasXLinkedName = entry.displayName && 
                    entry.displayName !== `ユーザー${entry.userId.substring(0, 6)}` &&
                    !entry.displayName.startsWith('ハンター');
                
                return {
                    ...entry,
                    // 現在ユーザーの場合はUserServiceから、他ユーザーはdisplayNameから判定
                    isXLinked: entry.userId === currentUserId ? isCurrentUserXLinked : hasXLinkedName,
                    xDisplayName: entry.userId === currentUserId ? currentUserXName : (hasXLinkedName ? entry.displayName : undefined),
                    xProfileImageUrl: entry.userId === currentUserId ? currentUserXImageUrl : undefined
                };
            });
            
            setRankingData({
                ...data,
                rankings: extendedRankings
            });
        } catch (error) {
            console.error('Failed to load ranking data:', error);
            setError('ランキングデータの読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };





    const formatScore = (score: number, gameType: string): string => {
        switch (gameType) {
            case 'reflex':
                return `${(score / 1000).toFixed(5)}s`;
            case 'target':
                return `${(score / 1000).toFixed(3)}s`;
            case 'sequence':
                return `${(score / 1000).toFixed(3)}s`;
            default:
                return score.toString();
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        トッププレイヤー ランキング
                    </h3>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error || !rankingData || rankingData.rankings.length === 0) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        トッププレイヤー ランキング
                    </h3>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500">
                        {error || 'まだランキングデータがありません'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        ゲームをプレイしてランキングに参加しよう！
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                    トッププレイヤー ランキング
                </h3>
            </div>

            <div className="divide-y divide-gray-200">
                {rankingData.rankings.map((entry: ExtendedRankingEntry) => (
                                    <div 
                    key={`${entry.userId}-${entry.timestamp}`}
                    className="py-4 px-2"
                >
                    {/* デスクトップレイアウト（md以上） */}
                    <div className="hidden md:flex items-center">
                        {/* ランキング数字 */}
                        <div className="w-8 flex-shrink-0 text-center">
                            <div className="text-sm font-medium text-gray-600">
                                {entry.rank}
                            </div>
                        </div>
                        
                        {/* ユーザーアイコン */}
                        <div className="flex-shrink-0 mr-2">
                            <UserIcon 
                                isXLinked={entry.isXLinked} 
                                isCurrentUser={entry.isCurrentUser}
                                xProfileImageUrl={entry.xProfileImageUrl}
                            />
                        </div>
                        
                        {/* 名前 */}
                        <div className="flex-1 min-w-0 px-2">
                            <div className={`font-medium relative group ${
                                entry.isCurrentUser 
                                    ? (currentGameScore !== undefined && entry.score === currentGameScore ? 'text-red-700' : 'text-blue-700')
                                    : 'text-gray-800'
                            }`}>
                                <div 
                                    className="truncate max-w-[180px] lg:max-w-[220px] inline-block cursor-help"
                                    title={entry.isCurrentUser && entry.isXLinked && entry.xDisplayName 
                                        ? entry.xDisplayName 
                                        : entry.displayName}
                                >
                                    {entry.isCurrentUser && entry.isXLinked && entry.xDisplayName 
                                        ? entry.xDisplayName 
                                        : entry.displayName}
                                </div>
                                {entry.isCurrentUser && (
                                    <span className={`text-xs ml-2 ${
                                        currentGameScore !== undefined && entry.score === currentGameScore ? 'text-red-600' : 'text-blue-600'
                                    }`}>(あなた)</span>
                                )}
                                
                                {/* ホバーツールチップ */}
                                <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap pointer-events-none">
                                    {entry.isCurrentUser && entry.isXLinked && entry.xDisplayName 
                                        ? entry.xDisplayName 
                                        : entry.displayName}
                                </div>
                            </div>
                        </div>
                        
                        {/* 日付 */}
                        <div className="w-36 flex-shrink-0 px-2">
                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                {formatDateTime(entry.timestamp)}
                            </div>
                        </div>
                        
                        {/* スコア */}
                        <div className="w-20 flex-shrink-0 text-right">
                            <div className={`text-lg font-bold ${
                                entry.isCurrentUser 
                                    ? (currentGameScore !== undefined && entry.score === currentGameScore ? 'text-red-600' : 'text-blue-600')
                                    : 'text-gray-800'
                            }`}>
                                {formatScore(entry.score, gameType)}
                            </div>
                        </div>
                    </div>

                    {/* モバイルレイアウト（md未満） */}
                    <div className="md:hidden">
                        {/* 上段：ランキング数字 + ユーザーアイコン + ユーザー名 + スコア */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center flex-1 min-w-0">
                                {/* ランキング数字 */}
                                <div className="w-6 flex-shrink-0 text-center mr-3">
                                    <div className="text-sm font-medium text-gray-600">
                                        {entry.rank}
                                    </div>
                                </div>
                                
                                {/* ユーザーアイコン */}
                                <div className="flex-shrink-0 mr-3">
                                    <UserIcon 
                                        isXLinked={entry.isXLinked} 
                                        isCurrentUser={entry.isCurrentUser}
                                        xProfileImageUrl={entry.xProfileImageUrl}
                                        className="w-8 h-8"
                                    />
                                </div>
                                
                                {/* ユーザー名（優先表示） */}
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-sm ${
                                        entry.isCurrentUser 
                                            ? (currentGameScore !== undefined && entry.score === currentGameScore ? 'text-red-700' : 'text-blue-700')
                                            : 'text-gray-800'
                                    }`}>
                                        <div className="truncate">
                                            {entry.isCurrentUser && entry.isXLinked && entry.xDisplayName 
                                                ? entry.xDisplayName 
                                                : entry.displayName}
                                            {entry.isCurrentUser && (
                                                <span className={`text-xs ml-1 ${
                                                    currentGameScore !== undefined && entry.score === currentGameScore ? 'text-red-600' : 'text-blue-600'
                                                }`}>(あなた)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* スコア */}
                            <div className="flex-shrink-0 ml-2">
                                <div className={`text-lg font-bold ${
                                    entry.isCurrentUser 
                                        ? (currentGameScore !== undefined && entry.score === currentGameScore ? 'text-red-600' : 'text-blue-600')
                                        : 'text-gray-800'
                                }`}>
                                    {formatScore(entry.score, gameType)}
                                </div>
                            </div>
                        </div>
                        
                        {/* 下段：日付 */}
                        <div className="ml-12 pl-2">
                            <div className="text-xs text-gray-500">
                                {formatDateTime(entry.timestamp)}
                            </div>
                        </div>
                    </div>
                </div>
                ))}
            </div>

            {rankingData.totalPlayers > limit && (
                <div className="text-center mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        {rankingData.totalPlayers}人中 上位{limit}位まで表示
                    </p>
                </div>
            )}
        </div>
    );
};

export default GameRankingTable;
