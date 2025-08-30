import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Trophy, RotateCcw, Home, Share2 } from 'lucide-react';
import { HybridRankingService } from '../services/hybridRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import { UserIdentificationService } from '../services/userIdentificationService';
import GameRankingTable from '../components/GameRankingTable';

interface TriggerTimingResult {
    totalScore: number;
    averageScore: number;
    rounds: Array<{
        round: number;
        score: number;
        distance: number;
        targetSpeed: number;
        targetSize: number;
        reactionTime: number;
    }>;
}

const TriggerTimingResultPage: React.FC = () => {
    const navigate = useNavigate();
    const [gameResult, setGameResult] = useState<TriggerTimingResult | null>(null);
    const [currentRank, setCurrentRank] = useState<number | null>(null);
    const [totalPlayers, setTotalPlayers] = useState<number>(0);
    const [isXLinked, setIsXLinked] = useState<boolean | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    const [rankingUpdateKey, setRankingUpdateKey] = useState<number>(0);

    // 結果データの読み込み
    useEffect(() => {
        const savedResult = sessionStorage.getItem('trigger-timing-result');
        if (savedResult) {
            const result: TriggerTimingResult = JSON.parse(savedResult);
            setGameResult(result);
            
            // 結果をクラウドに保存
            saveGameResult(result);
        } else {
            // 結果がない場合はホームに戻る
            navigate('/');
        }
    }, [navigate]);

    // ユーザー情報の読み込み
    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                const userService = UserIdentificationService.getInstance();
                const linked = await userService.isXLinked();
                const name = await userService.getDisplayName();
                
                setIsXLinked(linked);
                setDisplayName(name);
            } catch (error) {
                console.error('Failed to load user info:', error);
                setIsXLinked(false);
                setDisplayName('ゲスト');
            }
        };

        loadUserInfo();
    }, []);

    // ゲーム結果の保存とランキング取得
    const saveGameResult = async (result: TriggerTimingResult) => {
        try {
            const userService = UserIdentificationService.getInstance();
            const userId = await userService.getCurrentUserId();
            const userName = await userService.getDisplayName();

            // ゲーム履歴を保存
            const historyService = GameHistoryService.getInstance();
            // 現在のGameHistoryServiceはprecision-aimingをサポートしていないため、
            // 一旦コメントアウト（Phase 2で対応予定）
            // await historyService.saveGameHistory('trigger-timing', {
            //     totalScore: result.totalScore,
            //     averageScore: result.averageScore,
            //     rounds: result.rounds
            // });

            // ランキングサービスに保存（Phase 2で実装予定）
            // const rankingService = HybridRankingService.getInstance();
            // await rankingService.saveScore({
            //     gameType: 'trigger-timing',
            //     score: result.totalScore,
            //     userId: userId,
            //     displayName: userName,
            //     timestamp: new Date().toISOString()
            // });

            // ランキング情報を取得（Phase 2で実装予定）
            // const rankData = await rankingService.getUserRankOptimized('trigger-timing', userId, result.totalScore);
            // setCurrentRank(rankData.rank);
            // setTotalPlayers(rankData.totalCount);
            
            // Phase 1では仮の値を設定
            setCurrentRank(Math.floor(Math.random() * 10) + 1);
            setTotalPlayers(50);

            // ランキングテーブルを更新
            setRankingUpdateKey(prev => prev + 1);

        } catch (error) {
            console.error('Failed to save game result:', error);
        }
    };

    // X連携への直接遷移
    const handleDirectXLink = async () => {
        try {
            const { XAuthService } = await import('../services/xAuthService');
            const xAuthService = XAuthService.getInstance();
            const authUrl = await xAuthService.generateAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Failed to initiate X auth:', error);
        }
    };

    // シェア機能
    const handleShare = async () => {
        if (!gameResult) return;

        const shareText = `ハントレのトリガータイミングトレーニングで${gameResult.totalScore.toFixed(1)}点を記録しました！\n平均得点: ${gameResult.averageScore.toFixed(1)}点\n\n#ハントレ #狩猟トレーニング`;
        const shareUrl = 'https://hantore.net/trigger-timing';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'ハントレ - トリガータイミングトレーニング結果',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.log('Share cancelled or failed:', error);
            }
        } else {
            // フォールバック: クリップボードにコピー
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                alert('結果をクリップボードにコピーしました！');
            } catch (error) {
                console.error('Failed to copy to clipboard:', error);
            }
        }
    };

    // 再挑戦
    const handleRetry = () => {
        navigate('/trigger-timing/game');
    };

    // ホームに戻る
    const handleGoHome = () => {
        navigate('/');
    };

    if (!gameResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Target className="w-12 h-12 text-red-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">結果を読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* ヘッダー */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-red-100 p-3 rounded-full mr-4">
                            <Target className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">トレーニング完了</h1>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* 左側：結果表示 */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        {/* 総合結果 */}
                        <div className="text-center mb-8">
                            <div className="bg-red-50 rounded-xl p-6 mb-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">トレーニング結果</h2>
                                
                                {/* ランキング表示 */}
                                {currentRank !== null && (
                                    <div className="mb-4">
                                        <p className="text-3xl font-bold text-red-600">
                                            {currentRank <= 10 ? `${currentRank}位` : 'ランキング圏外'}
                                        </p>
                                    </div>
                                )}

                                {/* 総得点 */}
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-1">総得点</p>
                                    <p className="text-4xl font-bold text-red-600">{gameResult.totalScore.toFixed(1)}</p>
                                    <p className="text-sm text-gray-500">/ 25.0点</p>
                                </div>

                                {/* 平均得点 */}
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">平均得点</p>
                                    <p className="text-2xl font-bold text-blue-600">{gameResult.averageScore.toFixed(1)}</p>
                                    <p className="text-sm text-gray-500">/ 5.0点</p>
                                </div>
                            </div>
                        </div>

                        {/* ラウンド別結果 */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">ラウンド別結果</h3>
                            <div className="space-y-3">
                                {gameResult.rounds.map((round, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-700">ラウンド {round.round}</span>
                                            <span className="text-lg font-bold text-red-600">{round.score.toFixed(1)}点</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            距離: {round.distance.toFixed(1)}px | 
                                            速度: {round.targetSpeed.toFixed(1)}px/s | 
                                            反応: {round.reactionTime.toFixed(0)}ms
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* シェアボタン */}
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={handleShare}
                                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                結果をシェア
                            </button>
                        </div>

                        {/* アクションボタン */}
                        <div className="space-y-3">
                            <button
                                onClick={handleRetry}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                            >
                                <RotateCcw className="w-5 h-5 mr-2" />
                                もう一度トレーニングする
                            </button>
                            <button
                                onClick={handleGoHome}
                                className="w-1/2 mx-auto block bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                メニューに戻る
                            </button>
                        </div>
                    </div>

                    {/* 右側：ランキング */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                            <Trophy className="w-6 h-6 text-yellow-600 mr-2" />
                            トッププレイヤーランキング
                        </h2>
                        
                        <div className="mb-4 flex items-center text-sm text-gray-600">
                            <span>{totalPlayers}位中 上位10位まで表示</span>
                        </div>

                        {/* Phase 1では仮のランキング表示 */}
                        <div className="text-center py-8 text-gray-500">
                            <p>ランキング機能はPhase 2で実装予定です</p>
                            <p className="text-sm mt-2">現在は基本ゲーム機能のテスト中</p>
                        </div>

                        {/* X連携促進ブロック（X未連携の場合のみ表示） */}
                        {isXLinked === false && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-center space-y-3">
                                    <button
                                        onClick={handleDirectXLink}
                                        className="px-6 py-2 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all duration-200 shadow-lg flex items-center justify-center mx-auto"
                                    >
                                        {/* 公式Xロゴ */}
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="currentColor"
                                            className="mr-2"
                                        >
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                        </svg>
                                        連携
                                    </button>
                                    <div className="text-sm text-gray-600 leading-relaxed text-left">
                                        <p>X連携するとXのディスプレイ名とアイコンがランキングに掲載されます。なお、それ以外の情報は取得していません。また、いつでも解除可能です。</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TriggerTimingResultPage;
