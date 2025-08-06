import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crosshair } from 'lucide-react';

interface TargetTrackingPageProps {
    mode: 'instructions' | 'game' | 'result';
}

interface TargetResult {
    targetNumber: number;
    reactionTime: number;
    timestamp: number;
}

interface GameHistory {
    date: string;
    totalTime: number;
    averageReactionTime: number;
    accuracy: number;
    targetResults: TargetResult[];
}

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
    const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTargetClickable, setIsTargetClickable] = useState(true);

    // タイマーIDを管理するためのref
    const timerRef = useRef<number | null>(null);

    const TOTAL_TARGETS = 10;
    const TARGET_SIZE = 60;

    // ローカルストレージからゲーム履歴を読み込み
    useEffect(() => {
        const savedHistory = localStorage.getItem('targetTrackingHistory');
        if (savedHistory) {
            setGameHistory(JSON.parse(savedHistory));
        }
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
    const endGame = (finalResults: TargetResult[]) => {
        setGameState('finished');

        const totalTime = (Date.now() - gameStartTime) / 1000;
        const averageReactionTime = finalResults.length > 0
            ? finalResults.reduce((sum, result) => sum + result.reactionTime, 0) / finalResults.length
            : 0;
        const accuracy = Math.round((finalResults.length / TOTAL_TARGETS) * 100);

        const newGameResult: GameHistory = {
            date: new Date().toLocaleDateString('ja-JP'),
            totalTime,
            averageReactionTime,
            accuracy,
            targetResults: finalResults
        };

        const updatedHistory = [newGameResult, ...gameHistory].slice(0, 10);
        setGameHistory(updatedHistory);
        localStorage.setItem('targetTrackingHistory', JSON.stringify(updatedHistory));

        navigate('/target/result');
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
                    <div className="py-16 px-4">
                        <div className="max-w-3xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-center mb-12">
                                <div className="flex items-center justify-center mb-4">
                                    <Crosshair size={32} className="text-blue-600 mr-3" />
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        ターゲット追跡
                                    </h1>
                                </div>
                            </div>

                            {/* ルール説明 */}
                            <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-blue-100">
                                <h2 className="text-2xl font-medium text-gray-800 mb-6">ルール</h2>
                                <div className="space-y-4 text-gray-600">
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">1</span>
                                        <p>画面に現れる赤いターゲットをできるだけ早くクリック</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">2</span>
                                        <p>10個のターゲットを順番に撃ち抜く</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">3</span>
                                        <p>各ターゲットの反応時間と総合時間を測定</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">4</span>
                                        <p>結果に応じてハンターランクが決定</p>
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
                        <div className="max-w-4xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-center mb-12">
                                <div className="flex items-center justify-center mb-4">
                                    <Crosshair size={32} className="text-blue-600 mr-3" />
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        ゲーム完了
                                    </h1>
                                </div>
                            </div>

                            {/* 結果表示 */}
                            <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-blue-100">
                                <h2 className="text-2xl font-medium text-gray-800 mb-6 text-center">最終結果</h2>

                                {/* 統計カード */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                        <div className="text-sm text-gray-600 mb-1">総合時間</div>
                                        <div className="text-2xl font-bold text-blue-600">{currentStats.totalTime.toFixed(2)}s</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                        <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                        <div className="text-2xl font-bold text-green-600">{currentStats.averageReactionTime.toFixed(3)}s</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                        <div className="text-sm text-gray-600 mb-1">最速反応</div>
                                        <div className="text-2xl font-bold text-purple-600">{currentStats.bestReactionTime.toFixed(3)}s</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                        <div className="text-sm text-gray-600 mb-1">命中率</div>
                                        <div className="text-2xl font-bold text-orange-600">{currentStats.accuracy}%</div>
                                    </div>
                                </div>

                                {/* ハンターランク */}
                                <div className="text-center border-t border-blue-200 pt-8">
                                    <div className="text-lg text-gray-600 mb-4">ハンターランク</div>
                                    {currentStats.averageReactionTime > 0 ? (
                                        <div className="inline-block">
                                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                                                <div className="flex items-center justify-center space-x-4">
                                                    <div className="text-center">
                                                        <div className="text-sm text-blue-100 mb-1">ランク順位</div>
                                                        <div className="text-3xl font-bold text-white">
                                                            #{getHunterRank(currentStats.averageReactionTime).number}
                                                        </div>
                                                        <div className="text-xs text-blue-100">
                                                            / {getHunterRank(currentStats.averageReactionTime).total}
                                                        </div>
                                                    </div>
                                                    <div className="w-px h-12 bg-white opacity-30"></div>
                                                    <div className="text-center">
                                                        <div className="text-xl font-bold text-white">
                                                            {getHunterRank(currentStats.averageReactionTime).rank}
                                                        </div>
                                                        <div className="text-sm text-blue-100 mt-1">
                                                            {currentStats.averageReactionTime.toFixed(3)}s平均
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="inline-block px-6 py-3 bg-gray-400 text-white rounded-lg text-lg font-medium">
                                            ランク判定不可
                                        </div>
                                    )}
                                </div>
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
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">ターゲット追跡</h1>
                            <div className="text-lg text-gray-600">ターゲット {currentTargetNumber} / {TOTAL_TARGETS}</div>
                        </div>

                        {/* 進捗とステータス */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">命中数</div>
                                <div className="text-xl font-bold text-orange-600">{targetResults.length}/{TOTAL_TARGETS}</div>
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

                        {/* 現在のランク表示 */}
                        {currentStats.averageReactionTime > 0 && (
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