import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Trophy, Clock, Medal, Crown, Share2 } from 'lucide-react';
import { HybridRankingService } from '../services/hybridRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import type { SequenceGameHistory, NumberButton } from '../types/game';
import GameRankingTable from '../components/GameRankingTable';
import XLinkPromptModal from '../components/XLinkPromptModal';
import { UserIdentificationService } from '../services/userIdentificationService';

interface SequenceGamePageProps {
    mode: 'instructions' | 'game' | 'result';
}

// 型定義は src/types/game.ts から import

// ランク判定関数
const getRankFromTime = (timeInSeconds: number): { rank: number; title: string; color: string } => {
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
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SequenceGamePage: React.FC<SequenceGamePageProps> = ({ mode }) => {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<'countdown' | 'playing' | 'gameOver'>('countdown');
    const [level, setLevel] = useState(1);
    const [numbers, setNumbers] = useState<NumberButton[]>([]);
    const [nextNumber, setNextNumber] = useState(1);
    const [gameArea, setGameArea] = useState({ width: 0, height: 0 });
    const [countdown, setCountdown] = useState(3);

    // 時間管理の状態を追加
    const [startTime, setStartTime] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [finalTime, setFinalTime] = useState<number | null>(null);
    const [, setIsGameCompleted] = useState(false);

    // 新しい統計情報の状態を追加
    const [clickTimes, setClickTimes] = useState<number[]>([]);
    const [currentRank, setCurrentRank] = useState<number | null>(null);
    const [totalPlayers, setTotalPlayers] = useState<number>(0);

    // X連携関連のstate
    const [isXLinked, setIsXLinked] = useState<boolean | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    const [showXLinkModal, setShowXLinkModal] = useState(false);
    const [xLinkModalData, setXLinkModalData] = useState<{ gameType: string; score: number; playerName: string } | null>(null);

    const userService = UserIdentificationService.getInstance();
    const [totalClicks, setTotalClicks] = useState(0);
    const [successfulClicks, setSuccessfulClicks] = useState(0);
    const [currentAverageInterval, setCurrentAverageInterval] = useState(0);
    const [currentSuccessRate, setCurrentSuccessRate] = useState(100);

    // トレーニング履歴の状態を追加
    const [gameHistory, setGameHistory] = useState<SequenceGameHistory[]>([]);

    // ローカルストレージからトレーニング履歴を読み込み
    useEffect(() => {
        const savedHistory = localStorage.getItem('sequenceGameHistory');
        if (savedHistory) {
            setGameHistory(JSON.parse(savedHistory));
        }
    }, []);

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

    // 平均タップ間隔を計算
    const calculateAverageInterval = useCallback(() => {
        if (clickTimes.length < 2) return 0;
        const intervals = [];
        for (let i = 1; i < clickTimes.length; i++) {
            intervals.push(clickTimes[i] - clickTimes[i - 1]);
        }
        return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length / 1000; // 秒単位
    }, [clickTimes]);

    // 統計情報を更新
    useEffect(() => {
        setCurrentAverageInterval(calculateAverageInterval());
        setCurrentSuccessRate(totalClicks > 0 ? Math.round((successfulClicks / totalClicks) * 100) : 100);
    }, [clickTimes, totalClicks, successfulClicks, calculateAverageInterval]);

    // トレーニング履歴を保存
    const saveGameHistory = useCallback(async (completionTime: number, completed: boolean, avgInterval: number, successRate: number) => {
        const rankInfo = getRankFromTime(completionTime);

        const newGameResult: SequenceGameHistory = {
            date: new Date().toLocaleDateString('ja-JP'),
            completionTime,
            averageClickInterval: avgInterval,
            successClickRate: successRate,
            rank: rankInfo.rank,
            rankTitle: rankInfo.title,
            completed
        };

        // トレーニング履歴の状態更新（表示用）
        const updatedHistory = [newGameResult, ...gameHistory].slice(0, 10);
        setGameHistory(updatedHistory);
        
        // DynamoDBに保存（LocalStorageは自動削除）
        const gameHistoryService = GameHistoryService.getInstance();
        await gameHistoryService.saveGameHistory('sequence', newGameResult);

        // クラウドDBにもスコア送信（完了した場合のみ、ミリ秒で整数送信）
        if (completed) {
            try {
                const hybridService = HybridRankingService.getInstance();
                // 完了時間をミリ秒に変換（小数点以下3桁まで保持してから整数化）
                                        console.log('🔍 Original completionTime:', completionTime, 'type:', typeof completionTime);
                        console.log('🔍 completionTime toFixed(3):', completionTime.toFixed(3));
                const completionTimeMs = Math.floor(completionTime * 1000);
                console.log('🔍 Converted completionTimeMs:', completionTimeMs, 'type:', typeof completionTimeMs);
                await hybridService.submitScore('sequence', completionTimeMs, {
                    completionTime: completionTime,
                    averageClickInterval: avgInterval,
                    successClickRate: successRate,
                    rank: rankInfo.rank
                });
                console.log('✅ Sequence game score submitted to cloud:', completionTimeMs, 'ms (completion time)');
            } catch (error) {
                console.error('❌ Failed to submit sequence game score to cloud:', error);
            }
        }
    }, [gameHistory]);

    // ベスト記録を取得
    const getBestRecord = useCallback(() => {
        const completedGames = gameHistory.filter(game => game.completed);
        if (completedGames.length === 0) return null;

        const bestGame = completedGames.reduce((best, current) =>
            current.completionTime < best.completionTime ? current : best
        );

        return bestGame;
    }, [gameHistory]);

    // カウントダウンのuseEffect
    useEffect(() => {
        let interval: number;

        if (gameState === 'countdown' && mode === 'game') {
            interval = window.setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setGameState('playing');
                        setStartTime(Date.now());
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState, mode]);

    // タイマー更新のuseEffect
    useEffect(() => {
        let interval: number;

        if (startTime && gameState === 'playing' && mode === 'game') {
            interval = window.setInterval(() => {
                setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [startTime, gameState, mode]);

    const handleBack = () => {
        navigate('/');
    };

    // X連携モーダル関連の関数
    const showXLinkModalOnClick = () => {
        const latestScore = finalTime ? Math.floor(finalTime * 1000) : 0;
        
        setXLinkModalData({
            gameType: 'sequence',
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
        console.log('🔧 Starting X OAuth flow from SequenceGamePage...');
        const { default: XAuthService } = await import('../services/xAuthService');
        const xAuthService = XAuthService.getInstance();
        await xAuthService.startAuthFlow();
    };

    // 直接X連携を開始（モーダルなし）
    const handleDirectXLink = async () => {
        console.log('🔧 Starting direct X OAuth flow from SequenceGamePage...');
        const { default: XAuthService } = await import('../services/xAuthService');
        const xAuthService = XAuthService.getInstance();
        await xAuthService.startAuthFlow();
    };

    const handleStartGame = () => {
        startGame();
        navigate('/sequence/game');
    };

    const generateNumbers = useCallback((currentLevel: number) => {
        const count = currentLevel + 1;
        const newNumbers: NumberButton[] = [];
        
        // レスポンシブ対応：画面サイズに応じてボタンサイズと余白を調整
        const isMobile = window.innerWidth < 768;
        const buttonSize = isMobile ? 50 : 60; // モバイルでは小さく
        const margin = isMobile ? 30 : 50; // モバイルでは余白を小さく
        const minDistance = buttonSize + (isMobile ? 15 : 25); // 重複防止距離も調整

        const availableNumbers = Array.from({ length: count }, (_, i) => i + 1);

        for (let i = 0; i < count; i++) {
            let x: number, y: number;
            let attempts = 0;
            let validPosition = false;

            do {
                x = Math.random() * (gameArea.width - buttonSize - 2 * margin) + margin;
                y = Math.random() * (gameArea.height - buttonSize - 2 * margin) + margin;
                attempts++;
                
                // より厳密な重複チェック：他のボタンとの最小距離を確保
                validPosition = !newNumbers.some(btn => {
                    const distance = Math.sqrt(Math.pow(btn.x - x, 2) + Math.pow(btn.y - y, 2));
                    return distance < minDistance;
                });
                
            } while (!validPosition && attempts < 150); // 試行回数を増加

            // 150回試行しても配置できない場合は、グリッド配置にフォールバック
            if (!validPosition) {
                const cols = Math.ceil(Math.sqrt(count));
                const rows = Math.ceil(count / cols);
                const cellWidth = (gameArea.width - 2 * margin) / cols;
                const cellHeight = (gameArea.height - 2 * margin) / rows;
                
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                x = margin + col * cellWidth + (cellWidth - buttonSize) / 2;
                y = margin + row * cellHeight + (cellHeight - buttonSize) / 2;
            }

            newNumbers.push({
                id: i,
                number: availableNumbers[i],
                x,
                y,
                clicked: false
            });
        }

        setNumbers(newNumbers);
    }, [gameArea]);

    useEffect(() => {
        const updateGameArea = () => {
            const isMobile = window.innerWidth < 768;
            const padding = isMobile ? 20 : 100;
            const headerHeight = isMobile ? 200 : 300;
            
            setGameArea({
                width: Math.min(isMobile ? 350 : 800, window.innerWidth - padding),
                height: Math.min(isMobile ? 400 : 600, window.innerHeight - headerHeight)
            });
        };

        updateGameArea();
        window.addEventListener('resize', updateGameArea);
        return () => window.removeEventListener('resize', updateGameArea);
    }, []);

    useEffect(() => {
        if (gameArea.width > 0 && gameArea.height > 0 && gameState === 'playing' && mode === 'game') {
            generateNumbers(level);
        }
    }, [gameArea, level, gameState, generateNumbers, mode]);

    // 結果画面で現在のプレイスコアの順位を取得
    useEffect(() => {
        const fetchCurrentScoreRank = async () => {
            // 条件チェックをuseEffect内部に移動（currentRankの条件を削除）
            if (mode !== 'result' || level !== 7 || finalTime === null) {
                return;
            }
            
            try {
                console.log('Fetching current score rank on sequence result page...');
                const rankingService = HybridRankingService.getInstance();
                
                // 現在のプレイスコア（完了時間）で順位を計算
                // DynamoDBにはミリ秒で保存されているので、秒をミリ秒に変換
                const completionTimeMs = finalTime ? Math.floor(finalTime * 1000) : 0;
                console.log('Sequence result page current play score (completionTime):', finalTime, 'seconds');
                console.log('Sequence result page current play score (completionTimeMs):', completionTimeMs, 'milliseconds');
                
                const rankResult = await rankingService.getCurrentScoreRank('sequence', completionTimeMs);
                console.log('Sequence result page optimized score rank result:', rankResult);
                
                if (rankResult.isTop10 && rankResult.rank) {
                    // 10位以内の場合
                    console.log('🏆 Sequence result page top 10 rank found:', rankResult.rank, 'out of', rankResult.totalPlayers);
                    setCurrentRank(rankResult.rank);
                    setTotalPlayers(rankResult.totalPlayers);
                } else {
                    // ランキング圏外の場合
                    console.log('📍 Sequence result page out of ranking:', rankResult.totalPlayers, 'total players');
                    setCurrentRank(null);
                    setTotalPlayers(rankResult.totalPlayers);
                }
            } catch (error) {
                console.error('Failed to get current score rank on sequence result page:', error);
            }
        };
        
        fetchCurrentScoreRank();
    }, [mode, level, finalTime]);

    const startGame = () => {
        setGameState('countdown');
        setCountdown(3);
        setLevel(1);
        setNextNumber(1);
        setStartTime(null);
        setCurrentTime(0);
        setFinalTime(null);
        setIsGameCompleted(false);
        // 新しい統計情報をリセット
        setClickTimes([]);
        setTotalClicks(0);
        setSuccessfulClicks(0);
        setCurrentAverageInterval(0);
        setCurrentSuccessRate(100);
        // 順位情報をリセット
        setCurrentRank(null);
        setTotalPlayers(0);
    };

    // トレーニングエリアタップ処理（ミスタップ検出用）
    const handleGameAreaClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // タップした位置が数字ボタンの範囲内かチェック
        const clickedButton = numbers.find(num => {
            const distance = Math.sqrt(
                Math.pow(clickX - (num.x + 30), 2) + Math.pow(clickY - (num.y + 30), 2)
            );
            return distance <= 30 && !num.clicked; // 半径30px以内
        });

        if (clickedButton) {
            handleNumberClick(clickedButton.number);
        } else {
            // ミスタップ（空白部分をタップ）
            setTotalClicks(prev => prev + 1);
        }
    };

    const handleNumberClick = async (clickedNumber: number) => {
        const currentClickTime = Date.now();
        setTotalClicks(prev => prev + 1);

        if (clickedNumber === nextNumber) {
            // 正解タップ
            setSuccessfulClicks(prev => prev + 1);
            setClickTimes(prev => [...prev, currentClickTime]);

            setNumbers(prev =>
                prev.map(num =>
                    num.number === clickedNumber
                        ? { ...num, clicked: true }
                        : num
                )
            );

            const maxNumber = level + 1;
            if (nextNumber === maxNumber) {
                if (level === 7) {
                    setGameState('gameOver');
                    if (startTime) {
                        const completionTime = (Date.now() - startTime) / 1000;
                        setFinalTime(completionTime);
                        setIsGameCompleted(true);

                        // 最終統計を計算
                        const finalClickTimes = [...clickTimes, currentClickTime];
                        const finalAverageInterval = finalClickTimes.length >= 2
                            ? finalClickTimes.slice(1).reduce((sum, time, index) =>
                                sum + (time - finalClickTimes[index]), 0) / (finalClickTimes.length - 1) / 1000
                            : 0;
                        const finalSuccessRate = Math.round(((successfulClicks + 1) / (totalClicks + 1)) * 100);

                        // スコア保存完了を待ってから画面遷移
                        try {
                            await saveGameHistory(completionTime, true, finalAverageInterval, finalSuccessRate);
                            console.log('✅ Sequence game history saved, navigating to result');
                            
                            // スコア保存完了後に少し待機してから画面遷移（クラウド同期のため）
                            setTimeout(() => {
                                navigate('/sequence/result');
                            }, 1000);
                        } catch (error) {
                            console.error('❌ Failed to save sequence game history:', error);
                            // エラーの場合でも画面遷移
                            navigate('/sequence/result');
                        }
                    } else {
                        navigate('/sequence/result');
                    }
                } else {
                    // 次のレベルに即座に進む
                    setLevel(prev => prev + 1);
                    setNextNumber(1);
                }
            } else {
                setNextNumber(prev => prev + 1);
            }
        }
        // 間違った数字をタップした場合は何もしない（ミスタップとしてカウント済み）
    };

    const resetGame = () => {
        setGameState('countdown');
        setCountdown(3);
        setLevel(1);
        setNumbers([]);
        setNextNumber(1);
        setStartTime(null);
        setCurrentTime(0);
        setFinalTime(null);
        setIsGameCompleted(false);
        // 統計情報もリセット
        setClickTimes([]);
        setTotalClicks(0);
        setSuccessfulClicks(0);
        setCurrentAverageInterval(0);
        setCurrentSuccessRate(100);
        navigate('/sequence/game');
    };

    // ベスト記録を取得
    const bestRecord = getBestRecord();

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
                                    カウントアップ・トレーニング
                                </h1>
                            </div>

                            {/* ルール説明 */}
                            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">ルール</h2>
                                <div className="space-y-3 text-gray-700">
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Hash className="w-3 h-3" />
                                        </div>
                                        <p>画面上にランダムに配置された数字を<span className="font-semibold text-blue-600">小さい順</span>にタップしてください</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Medal className="w-3 h-3" />
                                        </div>
                                        <p>レベルが上がるにつれて、数字の数が増えていきます</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Crown className="w-3 h-3" />
                                        </div>
                                        <p><span className="font-semibold text-blue-600">レベル7</span>をクリアすると終了です</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Trophy className="w-3 h-3" />
                                        </div>
                                        <p>レベル7が終了した時点の合計時間で、ランキングが決定します</p>
                                    </div>
                                </div>
                            </div>

                            {/* ベスト記録表示 */}
                            {bestRecord && bestRecord.averageClickInterval !== undefined && (
                                <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">ベスト記録</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">平均タップ間隔</div>
                                            <div className="text-xl font-bold text-blue-600">{bestRecord.averageClickInterval.toFixed(2)}s</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">完了時間</div>
                                            <div className="text-xl font-bold text-green-600">{formatTime(bestRecord.completionTime)}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">成功タップ率</div>
                                            <div className="text-xl font-bold text-purple-600">{bestRecord.successClickRate}%</div>
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
                                    トレーニング開始
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
                                <GameRankingTable gameType="sequence" limit={10} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'result') {
        return (
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
                                {level === 7 && finalTime !== null ? (
                                    // 完全制覇時の表示
                                    <>
                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div className="text-center">
                                                <div className="text-sm text-gray-600 mb-1">完了時間</div>
                                                <div className="text-2xl font-bold text-green-600">{formatTime(finalTime)}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm text-gray-600 mb-1">平均タップ間隔</div>
                                                <div className="text-2xl font-bold text-purple-600">{currentAverageInterval.toFixed(2)}秒</div>
                                            </div>
                                        </div>
                                        
                                        {/* ランキング表示 */}
                                        {totalPlayers > 0 ? (
                                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 text-center">
                                                <div className="text-sm text-blue-100 mb-1">トレーニング結果！</div>
                                                <div className="text-xl font-bold">
                                                    {currentRank ? (
                                                        `${currentRank}位`
                                                    ) : (
                                                        `ランキング圏外`
                                                    )}
                                                </div>
                                                {!currentRank && (
                                                    <div className="text-xs text-blue-200 mt-1">
                                                        (11位以下)
                                                    </div>
                                                )}
                                                
                                                {/* シェアボタン */}
                                                <div className="mt-3 flex justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const shareText = `ハントレでカウントアップ・トレーニングをプレイしました！\n結果: ${currentRank ? `${currentRank}位` : 'ランキング圏外'}\n完了時間: ${finalTime?.toFixed(2)}秒`;
                                                            const shareUrl = window.location.origin;
                                                            
                                                            if (navigator.share) {
                                                                navigator.share({
                                                                    title: 'ハントレ - カウントアップ・トレーニング結果',
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
                                                <div className="text-sm text-blue-100 mb-1">トレーニング結果！</div>
                                                <div className="text-xl font-bold">
                                                    全レベル完全制覇！
                                                </div>
                                                
                                                {/* シェアボタン */}
                                                <div className="mt-3 flex justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const shareText = `ハントレで数字順序トレーニングをプレイしました！\n全レベル完全制覇！\n完了時間: ${finalTime?.toFixed(2)}秒`;
                                                            const shareUrl = window.location.origin;
                                                            
                                                            if (navigator.share) {
                                                                navigator.share({
                                                                    title: 'ハントレ - 数字順序トレーニング結果',
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
                                    </>
                                ) : (
                                    // 途中終了時の表示
                                    <div className="text-center py-8">
                                        <div className="text-lg text-gray-600 mb-2">トレーニング終了</div>
                                        <div className="text-sm text-gray-500">
                                            レベル {level} で終了しました
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
                                <GameRankingTable gameType="sequence" limit={10} />
                                
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
            </div>
        );
    }

    // mode === 'game'
    return (
        <>
        <div className="flex-1">
            <div className="min-h-screen" style={{ backgroundColor: '#ecf6ff' }}>
                <div className="py-8 px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* ヘッダー */}
                        <div className="text-right mb-4">
                            <h1 className="text-sm font-medium text-gray-500">カウントアップ・トレーニング</h1>
                        </div>

                        {/* プログレスバー */}
                        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">トレーニング進行状況</span>
                                <span className="text-sm text-gray-500">レベル {level}/7</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${(level / 7) * 100}%` }}
                                ></div>
                            </div>

                        </div>



                        {/* トレーニングエリア */}
                        <div className="bg-white rounded-lg shadow-sm border border-blue-100 mb-8">
                            <div
                                className="relative bg-gray-50 rounded-lg overflow-hidden cursor-pointer"
                                style={{ width: gameArea.width, height: gameArea.height, margin: '0 auto' }}
                                onClick={handleGameAreaClick}
                            >
                                {gameState === 'countdown' ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90">
                                        <div className="text-center">
                                            <div className="text-8xl font-bold text-blue-600 mb-4 animate-pulse">
                                                {countdown === 0 ? 'START!' : countdown}
                                            </div>
                                            <div className="text-xl text-gray-600">
                                                {countdown === 0 ? 'トレーニング開始！' : 'トレーニング開始まで...'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    numbers.map((num) => {
                                        const isMobile = window.innerWidth < 768;
                                        const buttonSize = isMobile ? 50 : 60;
                                        const fontSize = isMobile ? 'text-base' : 'text-lg';
                                        
                                        return (
                                            <button
                                                key={num.id}
                                                className={`absolute rounded-full font-bold ${fontSize} transition-all duration-200 select-none ${num.clicked
                                                    ? 'bg-green-500 text-white scale-110'
                                                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 active:scale-95'
                                                    }`}
                                                style={{
                                                    left: num.x,
                                                    top: num.y,
                                                    width: buttonSize,
                                                    height: buttonSize,
                                                    minWidth: buttonSize,
                                                    minHeight: buttonSize,
                                                    touchAction: 'manipulation', // モバイルタップ最適化
                                                    userSelect: 'none'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!num.clicked) handleNumberClick(num.number);
                                                }}
                                                disabled={num.clicked}
                                            >
                                                {num.number}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 各種指標 */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">平均タップ間隔</div>
                                <div className="text-xl font-bold text-blue-600">{currentAverageInterval.toFixed(2)}s</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">経過時間</div>
                                <div className="text-xl font-bold text-purple-600 flex items-center justify-center">
                                    <Clock size={18} className="mr-1" />
                                    {formatTime(currentTime)}
                                </div>
                            </div>
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
};

export default SequenceGamePage; 