import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Trophy, Clock } from 'lucide-react';
import { HybridRankingService } from '../services/hybridRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import type { SequenceGameHistory, NumberButton } from '../types/game';
import GameRankingTable from '../components/GameRankingTable';

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
    const [totalClicks, setTotalClicks] = useState(0);
    const [successfulClicks, setSuccessfulClicks] = useState(0);
    const [currentAverageInterval, setCurrentAverageInterval] = useState(0);
    const [currentSuccessRate, setCurrentSuccessRate] = useState(100);

    // ゲーム履歴の状態を追加
    const [gameHistory, setGameHistory] = useState<SequenceGameHistory[]>([]);

    // ローカルストレージからゲーム履歴を読み込み
    useEffect(() => {
        const savedHistory = localStorage.getItem('sequenceGameHistory');
        if (savedHistory) {
            setGameHistory(JSON.parse(savedHistory));
        }
    }, []);

    // 平均クリック間隔を計算
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

    // ゲーム履歴を保存
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

        // ゲーム履歴の状態更新（表示用）
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

    const handleStartGame = () => {
        startGame();
        navigate('/sequence/game');
    };

    const generateNumbers = useCallback((currentLevel: number) => {
        const count = currentLevel + 1;
        const newNumbers: NumberButton[] = [];
        const buttonSize = 60;
        const margin = 50;

        const availableNumbers = Array.from({ length: count }, (_, i) => i + 1);

        for (let i = 0; i < count; i++) {
            let x: number, y: number;
            let attempts = 0;

            do {
                x = Math.random() * (gameArea.width - buttonSize - 2 * margin) + margin;
                y = Math.random() * (gameArea.height - buttonSize - 2 * margin) + margin;
                attempts++;
            } while (
                attempts < 100 &&
                newNumbers.some(btn =>
                    Math.abs(btn.x - x) < buttonSize + 20 &&
                    Math.abs(btn.y - y) < buttonSize + 20
                )
            );

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
            setGameArea({
                width: Math.min(800, window.innerWidth - 100),
                height: Math.min(600, window.innerHeight - 300)
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
    };

    // ゲームエリアクリック処理（ミスクリック検出用）
    const handleGameAreaClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // クリックした位置が数字ボタンの範囲内かチェック
        const clickedButton = numbers.find(num => {
            const distance = Math.sqrt(
                Math.pow(clickX - (num.x + 30), 2) + Math.pow(clickY - (num.y + 30), 2)
            );
            return distance <= 30 && !num.clicked; // 半径30px以内
        });

        if (clickedButton) {
            handleNumberClick(clickedButton.number);
        } else {
            // ミスクリック（空白部分をクリック）
            setTotalClicks(prev => prev + 1);
        }
    };

    const handleNumberClick = (clickedNumber: number) => {
        const currentClickTime = Date.now();
        setTotalClicks(prev => prev + 1);

        if (clickedNumber === nextNumber) {
            // 正解クリック
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

                        saveGameHistory(completionTime, true, finalAverageInterval, finalSuccessRate);
                    }
                    navigate('/sequence/result');
                } else {
                    // 次のレベルに即座に進む
                    setLevel(prev => prev + 1);
                    setNextNumber(1);
                }
            } else {
                setNextNumber(prev => prev + 1);
            }
        }
        // 間違った数字をクリックした場合は何もしない（ミスクリックとしてカウント済み）
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
                    <div className="py-16 px-4">
                        <div className="max-w-3xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-center mb-12">
                                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                                    数字順序ゲーム
                                </h1>
                            </div>

                            {/* ルール説明 */}
                            <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-blue-100">
                                <h2 className="text-2xl font-medium text-gray-800 mb-6">ルール</h2>
                                <div className="space-y-4 text-gray-600">
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">1</span>
                                        <p>画面上にランダムに配置された数字を小さい順にクリック</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">2</span>
                                        <p>レベル1は2個、レベル2は3個...レベル7は8個の数字</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">3</span>
                                        <p>レベル7をクリアすると完全制覇！</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-purple-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">⏱</span>
                                        <p>完全制覇時は完了時間でランク判定（15秒以内で最高ランク）</p>
                                    </div>
                                </div>
                            </div>

                            {/* ベスト記録表示 */}
                            {bestRecord && bestRecord.averageClickInterval !== undefined && (
                                <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">ベスト記録</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">平均クリック間隔</div>
                                            <div className="text-xl font-bold text-blue-600">{bestRecord.averageClickInterval.toFixed(2)}s</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">完了時間</div>
                                            <div className="text-xl font-bold text-green-600">{formatTime(bestRecord.completionTime)}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">成功クリック率</div>
                                            <div className="text-xl font-bold text-purple-600">{bestRecord.successClickRate}%</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ボタン */}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleStartGame}
                                    className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300"
                                >
                                    ゲーム開始
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
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
                <div className="min-h-screen" style={{ backgroundColor: '#ecf6ff' }}>
                    <div className="py-16 px-4">
                        <div className="max-w-3xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-center mb-12">
                                <h1 className="text-2xl font-light text-gray-800 mb-4">
                                    {level === 7 ? '完全制覇！' : 'ゲーム終了'}
                                </h1>
                            </div>

                            {/* 結果表示 */}
                            <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-blue-100">
                                <h2 className="text-2xl font-medium text-gray-800 mb-6 text-center">最終結果</h2>

                                {level === 7 && finalTime !== null ? (
                                    // 完全制覇時の時間ベースランク表示
                                    <>
                                        <div className="text-center mb-8">
                                            <div className="text-sm text-gray-600 mb-2">完了時間</div>
                                            <div className="text-5xl font-bold text-purple-600 mb-4 flex items-center justify-center">
                                                <Clock size={40} className="mr-2" />
                                                {formatTime(finalTime)}
                                            </div>
                                            <div className="text-lg text-gray-500">全レベル完全制覇！</div>
                                        </div>

                                        {/* 統計情報表示 */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                                <div className="text-sm text-gray-600 mb-1">平均クリック間隔</div>
                                                <div className="text-2xl font-bold text-blue-600">{currentAverageInterval.toFixed(2)}s</div>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                                <div className="text-sm text-gray-600 mb-1">完了時間</div>
                                                <div className="text-2xl font-bold text-green-600">{formatTime(finalTime)}</div>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                                <div className="text-sm text-gray-600 mb-1">成功クリック率</div>
                                                <div className="text-2xl font-bold text-purple-600">{currentSuccessRate}%</div>
                                            </div>
                                        </div>

                                        {/* ランク表示 - 非表示（ロジックは保持） */}
                                        {false && (
                                            <div className="text-center border-t border-blue-200 pt-8">
                                                <div className="inline-block">
                                                    {(() => {
                                                        const rankInfo = getRankFromTime(finalTime || 0);
                                                        const isNewBest = !bestRecord || (finalTime !== null && finalTime < (bestRecord?.completionTime || Infinity));
                                                        return (
                                                            <div className={`text-white rounded-lg p-6 shadow-lg ${isNewBest
                                                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                                                : 'bg-gradient-to-r from-purple-500 to-blue-600'
                                                                }`}>
                                                                {isNewBest && (
                                                                    <div className="text-sm font-medium mb-2 opacity-90">
                                                                        🎉 NEW BEST RECORD! 🎉
                                                                    </div>
                                                                )}
                                                                <div className="text-3xl font-bold mb-2">
                                                                    #{rankInfo.rank} {rankInfo.title}
                                                                </div>
                                                                <div className="text-sm opacity-90">
                                                                    完了時間: {formatTime(finalTime || 0)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}

                                        {/* ベスト記録比較 */}
                                        {bestRecord && bestRecord.averageClickInterval !== undefined && finalTime !== bestRecord.completionTime && (
                                            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                                                <div className="text-center">
                                                    <div className="text-sm text-gray-600 mb-2">ベスト記録</div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <div className="text-lg font-bold text-gray-700">{bestRecord.averageClickInterval.toFixed(2)}s</div>
                                                            <div className="text-xs text-gray-500">平均間隔</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold text-gray-700">{formatTime(bestRecord.completionTime)}</div>
                                                            <div className="text-xs text-gray-500">完了時間</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold text-gray-700">{bestRecord.successClickRate}%</div>
                                                            <div className="text-xs text-gray-500">成功率</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // 途中終了時の表示
                                    <div className="text-center space-y-6">
                                        <div>
                                            <div className="text-sm text-gray-600 mb-2">到達レベル</div>
                                            <div className="text-4xl font-bold text-blue-600 mb-2">レベル {level}</div>
                                            <div className="text-sm text-gray-500">
                                                {`${level + 1}個の数字まで挑戦`}
                                            </div>
                                        </div>
                                        {finalTime !== null && (
                                            <div>
                                                <div className="text-sm text-gray-600 mb-2">プレイ時間</div>
                                                <div className="text-3xl font-bold text-purple-600 flex items-center justify-center">
                                                    <Clock size={24} className="mr-2" />
                                                    {formatTime(finalTime)}
                                                </div>
                                            </div>
                                        )}

                                        {/* ベスト記録表示 */}
                                        {bestRecord && bestRecord.averageClickInterval !== undefined && (
                                            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                                                <div className="text-center">
                                                    <div className="text-sm text-gray-600 mb-2">ベスト記録</div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <div className="text-lg font-bold text-gray-700">{bestRecord.averageClickInterval.toFixed(2)}s</div>
                                                            <div className="text-xs text-gray-500">平均間隔</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold text-gray-700">{formatTime(bestRecord.completionTime)}</div>
                                                            <div className="text-xs text-gray-500">完了時間</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold text-gray-700">{bestRecord.successClickRate}%</div>
                                                            <div className="text-xs text-gray-500">成功率</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ボタン */}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={resetGame}
                                    className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300"
                                >
                                    もう一度
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
                                >
                                    メニューに戻る
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

    // mode === 'game'
    return (
        <div className="flex-1">
            <div className="min-h-screen" style={{ backgroundColor: '#ecf6ff' }}>
                <div className="py-8 px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* ヘッダー */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-light text-gray-800 mb-2">数字順序ゲーム</h1>
                            <div className="text-lg text-gray-600">レベル {level} - 次の数字: {nextNumber}</div>
                        </div>

                        {/* ステータス */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">平均クリック間隔</div>
                                <div className="text-2xl font-bold text-blue-600">{currentAverageInterval.toFixed(2)}s</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">成功クリック率</div>
                                <div className="text-2xl font-bold text-green-600">{currentSuccessRate}%</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">経過時間</div>
                                <div className="text-2xl font-bold text-purple-600 flex items-center justify-center">
                                    <Clock size={20} className="mr-1" />
                                    {formatTime(currentTime)}
                                </div>
                            </div>
                        </div>



                        {/* ゲームエリア */}
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
                                                {countdown === 0 ? 'ゲーム開始！' : 'ゲーム開始まで...'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    numbers.map((num) => (
                                        <button
                                            key={num.id}
                                            className={`absolute w-15 h-15 rounded-full font-bold text-lg transition-all duration-200 ${num.clicked
                                                ? 'bg-green-500 text-white scale-110'
                                                : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'
                                                }`}
                                            style={{
                                                left: num.x,
                                                top: num.y,
                                                width: 60,
                                                height: 60
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!num.clicked) handleNumberClick(num.number);
                                            }}
                                            disabled={num.clicked}
                                        >
                                            {num.number}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 進捗表示 */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">レベル進捗</span>
                                <span className="text-sm text-gray-600">{nextNumber - 1} / {level + 1}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((nextNumber - 1) / (level + 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SequenceGamePage; 