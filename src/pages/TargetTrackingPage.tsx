import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crosshair, Target, Hash, Clock, Trophy, Share2 } from 'lucide-react';
import { HybridRankingService } from '../services/hybridRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import type { TargetTrackingHistory, TargetResult } from '../types/game';
import GameRankingTable from '../components/GameRankingTable';
import XLinkPromptModal from '../components/XLinkPromptModal';
import { UserIdentificationService } from '../services/userIdentificationService';

interface TargetTrackingPageProps {
    mode: 'instructions' | 'game' | 'result';
}

// 型定義は src/types/game.ts から import

const TargetTrackingPage: React.FC<TargetTrackingPageProps> = ({ mode }) => {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'playing' | 'finished'>('waiting');
    const [countdown, setCountdown] = useState(3);
    const [currentTargetNumber, setCurrentTargetNumber] = useState(1);
    const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
    const [targetSpawnTime, setTargetSpawnTime] = useState(0);
    const [gameStartTime, setGameStartTime] = useState(0);
    const [targetResults, setTargetResults] = useState<TargetResult[]>([]);
    const [gameArea, setGameArea] = useState({ width: 0, height: 0 });
    const [gameHistory, setGameHistory] = useState<TargetTrackingHistory[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTargetClickable, setIsTargetClickable] = useState(true);
    const [currentRank, setCurrentRank] = useState<number | null>(null);
    const [totalPlayers, setTotalPlayers] = useState<number>(0);
    const [actualTotalTime, setActualTotalTime] = useState<number | null>(null);

    // X連携関連のstate
    const [isXLinked, setIsXLinked] = useState<boolean | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    const [showXLinkModal, setShowXLinkModal] = useState(false);
    const [xLinkModalData, setXLinkModalData] = useState<{ gameType: string; score: number; playerName: string } | null>(null);

    // タイマーIDを管理するためのref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const userService = UserIdentificationService.getInstance();

    const TOTAL_TARGETS = 10;
    const TARGET_SIZE = 60;

    // ゲーム履歴はGameHistoryServiceで管理（LocalStorageは不要）

    // X連携状態を初期化時に確認
    useEffect(() => {
        const checkXLinkStatus = async () => {
            const linked = await userService.isXLinked();
            const name = await userService.getDisplayName();
            setIsXLinked(linked);
            setDisplayName(name);
        };
        
        checkXLinkStatus();
    }, []);

    // ゲームエリアサイズの設定
    useEffect(() => {
        const updateGameArea = () => {
            setGameArea({
                width: Math.min(800, window.innerWidth - 100),
                height: Math.min(600, window.innerHeight - 300)
            });
        };

        updateGameArea();
        window.addEventListener('resize', updateGameArea);
        return () => window.removeEventListener('resize', updateGameArea);
    }, []);

    // カウントダウン処理
    useEffect(() => {
        let interval: number;
        if (gameState === 'countdown') {
            interval = window.setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setGameState('playing');
                        setGameStartTime(Date.now());
                        setIsTargetClickable(true);
                        // spawnTargetは後で定義されるため、ここでは直接位置を設定
                        const margin = 30;
                        const maxX = gameArea.width - TARGET_SIZE - margin * 2;
                        const maxY = gameArea.height - TARGET_SIZE - margin * 2 - 100;
                        const position = {
                            x: Math.random() * maxX + margin,
                            y: Math.random() * maxY + margin + 100
                        };
                        setTargetPosition(position);
                        setTargetSpawnTime(Date.now());
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState, gameArea.width, gameArea.height]);

    // 経過時間の更新
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => {
                setElapsedTime((Date.now() - gameStartTime) / 1000);
            }, 10);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [gameState, gameStartTime]);

    const handleBack = () => {
        navigate('/');
    };

    const handleStartGame = () => {
        setGameState('countdown');
        setCountdown(3);
        setCurrentTargetNumber(1);
        setTargetResults([]);
        setElapsedTime(0);
        // 順位情報をリセット
        setCurrentRank(null);
        setTotalPlayers(0);
        setActualTotalTime(null);
        navigate('/target/game');
    };

    // ランダムな位置を生成
    const generateRandomPosition = useCallback(() => {
        const margin = 30;
        const maxX = gameArea.width - TARGET_SIZE - margin * 2;
        const maxY = gameArea.height - TARGET_SIZE - margin * 2 - 100;

        return {
            x: Math.random() * maxX + margin,
            y: Math.random() * maxY + margin + 100
        };
    }, [gameArea]);

    // 新しいターゲットを出現させる
    const spawnTarget = useCallback(() => {
        const position = generateRandomPosition();
        setTargetPosition(position);
        setTargetSpawnTime(Date.now());
        setIsTargetClickable(true); // 新しいターゲット出現時にクリック可能にする
    }, [generateRandomPosition]);

    // 結果画面で現在のプレイスコアの順位を取得
    useEffect(() => {
        const fetchCurrentScoreRank = async () => {
            // 条件チェックをuseEffect内部に移動（currentRankの条件を削除）
            if (mode !== 'result' || targetResults.length === 0 || !actualTotalTime) {
                return;
            }
            
            try {
                console.log('Fetching current score rank on target result page...');
                const rankingService = HybridRankingService.getInstance();
                
                // 現在のプレイスコア（保存時と同じ実際のゲーム時間）で順位を計算
                const totalTimeMs = Math.floor(actualTotalTime * 1000); // 保存時と同じ形式に変換
                console.log('Target result page current play score (actualTotalTime):', actualTotalTime, 'ms:', totalTimeMs);
                
                const rankResult = await rankingService.getCurrentScoreRank('target', totalTimeMs);
                console.log('Target result page current score rank result:', rankResult);
                
                if (rankResult) {
                    console.log('Target result page current score rank found:', rankResult.rank, 'out of', rankResult.totalPlayers);
                    setCurrentRank(rankResult.rank);
                    setTotalPlayers(rankResult.totalPlayers);
                } else {
                    console.log('No current score rank found on target result page');
                }
            } catch (error) {
                console.error('Failed to get current score rank on target result page:', error);
            }
        };
        
        fetchCurrentScoreRank();
    }, [mode, targetResults, actualTotalTime]);

    // ターゲットクリック処理
    const handleTargetClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // イベントの伝播を停止

        if (gameState !== 'playing' || !isTargetClickable) return;

        // 連打防止のため一時的にクリックを無効化
        setIsTargetClickable(false);

        const hitTime = Date.now();
        const reactionTime = (hitTime - targetSpawnTime) / 1000;

        const newResult: TargetResult = {
            targetNumber: currentTargetNumber,
            reactionTime,
            timestamp: hitTime
        };

        setTargetResults(prev => [...prev, newResult]);

        if (currentTargetNumber >= TOTAL_TARGETS) {
            // ゲーム終了
            endGame([...targetResults, newResult]);
        } else {
            // 次のターゲット
            setCurrentTargetNumber(prev => prev + 1);
            setTimeout(() => {
                spawnTarget();
                setIsTargetClickable(true); // 新しいターゲット出現時にクリック可能にする
            }, 300);
        }
    };

    // ゲーム終了処理
    const endGame = async (finalResults: TargetResult[]) => {
        setGameState('finished');

        const totalTime = (Date.now() - gameStartTime) / 1000;
        setActualTotalTime(totalTime); // 結果画面で使用するために保存
        const averageReactionTime = finalResults.length > 0
            ? finalResults.reduce((sum, result) => sum + result.reactionTime, 0) / finalResults.length
            : 0;
        const accuracy = Math.round((finalResults.length / TOTAL_TARGETS) * 100);

        const newGameResult: TargetTrackingHistory = {
            date: new Date().toLocaleDateString('ja-JP'),
            totalTime,
            averageReactionTime,
            accuracy,
            targetResults: finalResults
        };

        // ゲーム履歴の状態更新（表示用）
        const updatedHistory = [newGameResult, ...gameHistory].slice(0, 10);
        setGameHistory(updatedHistory);
        
        // DynamoDBに保存（LocalStorageは自動削除）
        const gameHistoryService = GameHistoryService.getInstance();
        await gameHistoryService.saveGameHistory('target', newGameResult);

        // クラウドDBにもスコア送信（合計時間をミリ秒で整数送信）
        try {
            const hybridService = HybridRankingService.getInstance();
            // 合計時間をミリ秒に変換（小数点以下3桁まで保持してから整数化）
            const totalTimeMs = Math.floor(totalTime * 1000);
            await hybridService.submitScore('target', totalTimeMs, {
                totalTime: totalTime,
                averageReactionTime: averageReactionTime,
                accuracy: accuracy,
                targetCount: finalResults.length
            });
            console.log('✅ Target tracking score submitted to cloud:', totalTimeMs, 'ms (total time)');
            
            // スコア保存完了後に少し待機してから画面遷移（クラウド同期のため）
            setTimeout(() => {
                navigate('/target/result');
            }, 1000);
        } catch (error) {
            console.error('❌ Failed to submit target tracking score to cloud:', error);
            // エラーの場合でも画面遷移
            navigate('/target/result');
        }
    };

    // ゲームリセット
    const resetGame = () => {
        setGameState('countdown');
        setCountdown(3);
        setCurrentTargetNumber(1);
        setTargetResults([]);
        setElapsedTime(0);
        setIsTargetClickable(true);
        navigate('/target/game');
    };

    // X連携モーダル関連の関数
    const showXLinkModalOnClick = () => {
        // 最新のゲーム結果を取得
        const latestScore = actualTotalTime ? Math.floor(actualTotalTime * 1000) : 0;
        
        setXLinkModalData({
            gameType: 'target',
            score: latestScore,
            playerName: displayName || 'プレイヤー'
        });
        setShowXLinkModal(true);
    };

    const handleXLinkClose = () => {
        setShowXLinkModal(false);
        setXLinkModalData(null);
    };

    const handleXLink = async () => {
        setShowXLinkModal(false);
        setXLinkModalData(null);
        
        // X OAuth認証フローを開始
        console.log('🔧 Starting X OAuth flow from TargetTrackingPage...');
        const { default: XAuthService } = await import('../services/xAuthService');
        const xAuthService = XAuthService.getInstance();
        await xAuthService.startAuthFlow();
    };

    // パフォーマンスランク取得
    const getHunterRank = (avgReactionTime: number): { rank: string; number: number; total: number } => {
        if (avgReactionTime <= 0.800) return { rank: 'ハンター・オブ・ザ・オリジン', number: 1, total: 12 };
        if (avgReactionTime <= 0.899) return { rank: 'ハンター・ゼロ', number: 2, total: 12 };
        if (avgReactionTime <= 0.999) return { rank: 'ゴッドハンター', number: 3, total: 12 };
        if (avgReactionTime <= 1.049) return { rank: 'アルティメットハンター', number: 4, total: 12 };
        if (avgReactionTime <= 1.099) return { rank: 'ベテランハンター', number: 5, total: 12 };
        if (avgReactionTime <= 1.199) return { rank: 'スキルドハンター', number: 6, total: 12 };
        if (avgReactionTime <= 1.399) return { rank: 'アマチュアハンター', number: 7, total: 12 };
        if (avgReactionTime <= 1.599) return { rank: 'ルーキーハンター', number: 8, total: 12 };
        if (avgReactionTime <= 1.799) return { rank: 'ミスティーハンター', number: 9, total: 12 };
        if (avgReactionTime <= 1.999) return { rank: 'スロウリーハンター', number: 10, total: 12 };
        if (avgReactionTime <= 2.199) return { rank: 'スリーピーハンター', number: 11, total: 12 };
        return { rank: 'リラックスハンター', number: 12, total: 12 };
    };

    // 統計計算
    const currentStats = {
        totalTime: elapsedTime,
        averageReactionTime: targetResults.length > 0
            ? targetResults.reduce((sum, result) => sum + result.reactionTime, 0) / targetResults.length
            : 0,
        bestReactionTime: targetResults.length > 0
            ? Math.min(...targetResults.map(r => r.reactionTime))
            : 0,
        accuracy: Math.round((targetResults.length / TOTAL_TARGETS) * 100)
    };

    // ベスト記録計算
    const bestRecord = gameHistory.length > 0
        ? gameHistory.reduce((best, game) =>
            game.averageReactionTime < best.averageReactionTime ? game : best
        )
        : null;

    // modeに応じて画面を切り替え
    if (mode === 'instructions') {
        return (
            <div className="flex-1">
                <div className="min-h-screen" style={{ backgroundColor: '#ecf6ff' }}>
                    <div className="py-4 px-4">
                        <div className="max-w-3xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-right mb-4">
                                <h1 className="text-sm font-medium text-gray-500">
                                    ターゲット追跡トレーニング
                                </h1>
                            </div>

                            {/* ルール説明 */}
                            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">ルール</h2>
                                <div className="space-y-3 text-gray-700">
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Target className="w-3 h-3" />
                                        </div>
                                        <p>画面に現れる赤いターゲットをできるだけ早くタップしてください</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Hash className="w-3 h-3" />
                                        </div>
                                        <p>ゲームは全部で10回です。</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Clock className="w-3 h-3" />
                                        </div>
                                        <p>各ターゲットの反応時間と総合時間を測定します</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Trophy className="w-3 h-3" />
                                        </div>
                                        <p>10回目のトライが終了した時点の合計時間で、ランキングが決定します</p>
                                    </div>
                                </div>
                            </div>

                            {/* ベスト記録表示 */}
                            {bestRecord && (
                                <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">ベスト記録</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                            <div className="text-xl font-bold text-blue-600">{bestRecord.averageReactionTime.toFixed(3)}s</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">総合時間</div>
                                            <div className="text-xl font-bold text-green-600">{bestRecord.totalTime.toFixed(2)}s</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">命中率</div>
                                            <div className="text-xl font-bold text-purple-600">{bestRecord.accuracy}%</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ボタン */}
                            <div className="flex flex-col gap-3 items-center">
                                <button
                                    onClick={handleStartGame}
                                    className="w-full max-w-xs px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300"
                                >
                                    ゲーム開始
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="w-full max-w-40 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
                                >
                                    戻る
                                </button>
                            </div>

                            {/* ランキング表示 */}
                            <div className="mt-12">
                                <GameRankingTable gameType="target" limit={10} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'result') {
        return (
            <>
            <div className="flex-1">
                <div className="min-h-screen">
                    <div className="py-8 px-4">
                        <div className="max-w-4xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-center mb-6">
                                <h1 className="text-m font-bold text-gray-800">
                                    トレーニング完了です！お疲れ様でした！
                                </h1>
                            </div>

                            {/* コンパクト結果表示 */}
                            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 mb-1">総合時間</div>
                                        <div className="text-2xl font-bold text-green-600">{actualTotalTime ? actualTotalTime.toFixed(3) : currentStats.totalTime.toFixed(4)}s</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                        <div className="text-2xl font-bold text-purple-600">{currentStats.averageReactionTime.toFixed(3)}s</div>
                                    </div>
                                </div>
                                
                                {/* ランキング表示 */}
                                {currentRank && totalPlayers > 0 ? (
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 text-center">
                                        <div className="text-sm text-blue-100 mb-1">ゲーム結果！</div>
                                        <div className="text-xl font-bold">
                                            {currentRank}位 / {totalPlayers}位
                                        </div>
                                        
                                        {/* シェアボタン */}
                                        <div className="mt-3 flex justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const shareText = `ハントレでターゲット追跡ゲームをプレイしました！\n結果: ${currentRank}位 / ${totalPlayers}位\n総合時間: ${actualTotalTime ? actualTotalTime.toFixed(3) : currentStats.totalTime.toFixed(4)}秒`;
                                                    const shareUrl = window.location.origin;
                                                    
                                                    if (navigator.share) {
                                                        navigator.share({
                                                            title: 'ハントレ - ターゲット追跡ゲーム結果',
                                                            text: shareText,
                                                            url: shareUrl
                                                        });
                                                    } else {
                                                        // フォールバック: Xでシェア
                                                        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                                        window.open(twitterUrl, '_blank');
                                                    }
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors duration-200"
                                                title="結果をシェア"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                シェア
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 text-center">
                                        <div className="text-sm text-blue-100 mb-1">ゲーム結果！</div>
                                        <div className="text-xl font-bold">
                                            ランキング登録完了
                                        </div>
                                        
                                        {/* シェアボタン */}
                                        <div className="mt-3 flex justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const shareText = `ハントレでターゲット追跡ゲームをプレイしました！\n総合時間: ${actualTotalTime ? actualTotalTime.toFixed(3) : currentStats.totalTime.toFixed(4)}秒`;
                                                    const shareUrl = window.location.origin;
                                                    
                                                    if (navigator.share) {
                                                        navigator.share({
                                                            title: 'ハントレ - ターゲット追跡ゲーム結果',
                                                            text: shareText,
                                                            url: shareUrl
                                                        });
                                                    } else {
                                                        // フォールバック: Xでシェア
                                                        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                                        window.open(twitterUrl, '_blank');
                                                    }
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors duration-200"
                                                title="結果をシェア"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                シェア
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ボタン */}
                            <div className="flex flex-col gap-3 items-center">
                                <button
                                    onClick={resetGame}
                                    className="w-full max-w-xs px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300"
                                >
                                    もう一度トレーニングする
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="w-full max-w-60 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
                                                >
                    メニューに戻る
                </button>
            </div>

            {/* ランキング表示 */}
            <div className="mt-12">
                <GameRankingTable gameType="target" limit={10} />
                
                {/* X連携促進ブロック（X未連携の場合のみ表示） */}
                {isXLinked === false && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-center space-y-3">
                            <button
                                onClick={showXLinkModalOnClick}
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
</div>

{/* X連携促進モーダル */}
<XLinkPromptModal
    isOpen={showXLinkModal && xLinkModalData !== null}
    onClose={handleXLinkClose}
    onLinkX={handleXLink}
    gameType={xLinkModalData?.gameType || ''}
    score={xLinkModalData?.score || 0}
    playerName={xLinkModalData?.playerName || ''}
/>
</>
);
}

    // mode === 'game'
    return (
        <div className="flex-1">
            <div className="min-h-screen" style={{ backgroundColor: '#ecf6ff' }}>
                <div className="py-4 px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* ヘッダー */}
                        <div className="text-right mb-4">
                            <h1 className="text-sm font-medium text-gray-500">ターゲット追跡トレーニング</h1>
                        </div>

                        {/* プログレスバー */}
                        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">トレーニング進行状況</span>
                                <span className="text-sm text-gray-500">{targetResults.length}/{TOTAL_TARGETS}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${(targetResults.length / TOTAL_TARGETS) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* ゲームエリア */}
                        <div className="bg-white rounded-lg shadow-sm border border-blue-100 mb-8">
                            <div
                                className="relative bg-gray-50 rounded-lg overflow-hidden"
                                style={{ width: gameArea.width, height: gameArea.height, margin: '0 auto' }}
                            >
                                {gameState === 'countdown' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-8xl font-bold text-blue-600 animate-pulse">
                                                {countdown === 0 ? 'START!' : countdown}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {gameState === 'playing' && (
                                    <div
                                        className="absolute w-15 h-15 bg-red-500 rounded-full cursor-pointer hover:bg-red-600 transition-colors duration-100 flex items-center justify-center text-white font-bold shadow-lg"
                                        style={{
                                            left: targetPosition.x,
                                            top: targetPosition.y,
                                            width: TARGET_SIZE,
                                            height: TARGET_SIZE
                                        }}
                                        onClick={handleTargetClick}
                                    >
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 各種指標 */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">経過時間</div>
                                <div className="text-xl font-bold text-blue-600">{elapsedTime.toFixed(1)}s</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                <div className="text-xl font-bold text-green-600">
                                    {currentStats.averageReactionTime > 0 ? `${currentStats.averageReactionTime.toFixed(3)}s` : '-'}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">最速反応</div>
                                <div className="text-xl font-bold text-purple-600">
                                    {currentStats.bestReactionTime > 0 ? `${currentStats.bestReactionTime.toFixed(3)}s` : '-'}
                                </div>
                            </div>
                        </div>

                        {/* 現在のランク表示 - 非表示（ロジックは保持） */}
                        {false && currentStats.averageReactionTime > 0 && (
                            <div className="bg-white rounded-lg p-4 mb-8 shadow-sm border border-blue-100">
                                <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-2">現在のランク</div>
                                    <div className="flex items-center justify-center space-x-3">
                                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            #{getHunterRank(currentStats.averageReactionTime).number}
                                        </div>
                                        <div className="text-lg font-medium text-gray-800">
                                            {getHunterRank(currentStats.averageReactionTime).rank}
                                        </div>
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

export default TargetTrackingPage; 