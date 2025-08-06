import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import type { TestResult, ReflexGameHistory } from '../types/game';
import { getReflexHunterRank, STORAGE_KEYS } from '../types/game';
import { useGameHistory } from '../hooks/useGameHistory';

interface ReflexTestPageProps {
    mode: 'instructions' | 'game' | 'result';
}

const ReflexTestPage: React.FC<ReflexTestPageProps> = ({ mode }) => {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'ready' | 'go' | 'clicked' | 'finished'>('waiting');
    const [countdown, setCountdown] = useState(3);
    const [currentRound, setCurrentRound] = useState(0);
    const [results, setResults] = useState<TestResult[]>([]);
    const [startTime, setStartTime] = useState(0);
    const [, setIsTestRunning] = useState(false);
    // 共通フックを使用
    const { gameHistory, saveGameResult } = useGameHistory<ReflexGameHistory>(STORAGE_KEYS.REFLEX_HISTORY);

    // タイマーIDを管理するためのref
    const testTimerRef = useRef<number | null>(null);
    const nextTestTimerRef = useRef<number | null>(null);

    const MAX_TESTS = 5;



    const handleBack = () => {
        navigate('/');
    };

    const handleStartGame = () => {
        setGameState('countdown');
        setCountdown(3);
        setCurrentRound(0);
        setResults([]);
        setStartTime(0);
        setIsTestRunning(false);
        navigate('/reflex/game');
    };



    // タイマーをクリアする関数
    const clearAllTimers = useCallback(() => {
        if (testTimerRef.current) {
            clearTimeout(testTimerRef.current);
            testTimerRef.current = null;
        }
        if (nextTestTimerRef.current) {
            clearTimeout(nextTestTimerRef.current);
            nextTestTimerRef.current = null;
        }
    }, []);

    const startSingleTest = useCallback(() => {
        clearAllTimers();
        setGameState('ready');
        const randomWait = Math.random() * 3000 + 2000;

        testTimerRef.current = setTimeout(() => {
            setGameState('go');
            setStartTime(Date.now());
        }, randomWait);
    }, [clearAllTimers]);

    const startTestSequence = useCallback(() => {
        setIsTestRunning(true);
        setCurrentRound(1);
        setResults([]);
        startSingleTest();
    }, [startSingleTest]);

    // カウントダウン処理
    useEffect(() => {
        let interval: number;
        if (gameState === 'countdown') {
            interval = window.setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setGameState('ready');
                        setIsTestRunning(true);
                        setCurrentRound(1);
                        setResults([]);
                        startSingleTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState, startSingleTest]);

    // ゲーム履歴を保存
    const saveGameHistory = useCallback((finalResults: TestResult[]) => {
        const validResults = finalResults.filter(r => r.success && r.time > 0);
        const avgTime = validResults.length > 0 ?
            Math.round(validResults.reduce((sum, result) => sum + result.time, 0) / validResults.length) : 0;
        const bestTime = validResults.length > 0 ? Math.min(...validResults.map(r => r.time)) : 0;
        const successRate = finalResults.length > 0 ? Math.round((validResults.length / finalResults.length) * 100) : 0;

        const newGameResult: ReflexGameHistory = {
            date: new Date().toLocaleDateString('ja-JP'),
            averageTime: avgTime,
            bestTime,
            successRate,
            testResults: finalResults
        };

        saveGameResult(newGameResult);
    }, [saveGameResult]);

    const handleClick = useCallback(() => {
        if (gameState === 'go') {
            clearAllTimers();
            const reactionTime = Date.now() - startTime;
            const newResult: TestResult = {
                time: reactionTime,
                round: currentRound,
                success: true
            };

            setResults(prev => [...prev, newResult]);
            setGameState('clicked');

            nextTestTimerRef.current = setTimeout(() => {
                if (currentRound >= MAX_TESTS) {
                    const finalResults = [...results, newResult];
                    saveGameHistory(finalResults);
                    setGameState('finished');
                    setIsTestRunning(false);
                    navigate('/reflex/result');
                } else {
                    setCurrentRound(prev => prev + 1);
                    startSingleTest();
                }
            }, 1500);
        } else if (gameState === 'ready') {
            clearAllTimers();
            const newResult: TestResult = {
                time: 0,
                round: currentRound,
                success: false
            };

            setResults(prev => [...prev, newResult]);
            setGameState('clicked');

            nextTestTimerRef.current = setTimeout(() => {
                if (currentRound >= MAX_TESTS) {
                    const finalResults = [...results, newResult];
                    saveGameHistory(finalResults);
                    setGameState('finished');
                    setIsTestRunning(false);
                    navigate('/reflex/result');
                } else {
                    setCurrentRound(prev => prev + 1);
                    startSingleTest();
                }
            }, 1500);
        }
    }, [gameState, startTime, currentRound, startSingleTest, startTestSequence, clearAllTimers, results, saveGameHistory, navigate]);

    const resetTest = () => {
        clearAllTimers();
        setGameState('countdown');
        setCountdown(3);
        setCurrentRound(0);
        setResults([]);
        setStartTime(0);
        setIsTestRunning(false);
        navigate('/reflex/game');
    };

    // コンポーネントのアンマウント時にタイマーをクリア
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    // 統計計算
    const validResults = results.filter(r => r.success && r.time > 0);
    const currentResult = results.length > 0 ? results[results.length - 1] : null;
    const averageTime = validResults.length > 0 ?
        Math.round(validResults.reduce((sum, result) => sum + result.time, 0) / validResults.length) : 0;
    const bestTime = validResults.length > 0 ? Math.min(...validResults.map(r => r.time)) : 0;
    const successRate = results.length > 0 ? Math.round((validResults.length / results.length) * 100) : 0;

    // ベスト記録計算
    const bestRecord = gameHistory.length > 0
        ? gameHistory.reduce((best, game) =>
            game.averageTime < best.averageTime ? game : best
        )
        : null;

    // modeに応じて画面を切り替え
    if (mode === 'instructions') {
        return (
            <div className="flex-1">
                <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
                    <div className="py-16 px-4">
                        <div className="max-w-3xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-center mb-12">
                                <div className="flex items-center justify-center mb-4">
                                    <Zap size={32} className="text-blue-500 mr-3" />
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        反射神経テスト
                                    </h1>
                                </div>
                            </div>

                            {/* ルール説明 */}
                            <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-blue-100">
                                <h2 className="text-2xl font-medium text-gray-800 mb-6">ルール</h2>
                                <div className="space-y-4 text-gray-600">
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">1</span>
                                        <p>画面が緑色から赤色に変わったら、できるだけ早くクリック</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">2</span>
                                        <p>5回のテストを自動連続で行い、平均反応時間を測定</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">3</span>
                                        <p>赤になる前にクリックするとフライング</p>
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
                                            <div className="text-xl font-bold text-blue-600">{bestRecord.averageTime}ms</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">最速記録</div>
                                            <div className="text-xl font-bold text-green-600">{bestRecord.bestTime}ms</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">成功率</div>
                                            <div className="text-xl font-bold text-purple-600">{bestRecord.successRate}%</div>
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
                                    テスト開始
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
                <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
                    <div className="py-16 px-4">
                        <div className="max-w-4xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-center mb-12">
                                <div className="flex items-center justify-center mb-4">
                                    <Zap size={32} className="text-blue-500 mr-3" />
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        テスト完了
                                    </h1>
                                </div>
                            </div>

                            {/* 結果表示 */}
                            <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-blue-100">
                                <h2 className="text-2xl font-medium text-gray-800 mb-6 text-center">最終結果</h2>

                                {/* 統計カード */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                        <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                        <div className="text-2xl font-bold text-blue-600">{averageTime}ms</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                        <div className="text-sm text-gray-600 mb-1">最速記録</div>
                                        <div className="text-2xl font-bold text-green-600">{bestTime}ms</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                        <div className="text-sm text-gray-600 mb-1">成功率</div>
                                        <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                        <div className="text-sm text-gray-600 mb-1">完了テスト</div>
                                        <div className="text-2xl font-bold text-gray-700">{results.length}/{MAX_TESTS}</div>
                                    </div>
                                </div>

                                {/* 各回の結果 */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">各回の結果</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        {results.map((result, index) => (
                                            <div key={index} className={`rounded-lg p-3 text-center border ${result.success
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'
                                                }`}>
                                                <div className="text-sm text-gray-600 mb-1">{result.round}回</div>
                                                <div className={`text-lg font-medium ${result.success ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                    {result.success ? `${result.time}ms` : 'フライング'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ハンターランク */}
                                <div className="text-center border-t border-blue-200 pt-8">
                                    <div className="text-lg text-gray-600 mb-4">ハンターランク</div>
                                    {averageTime > 0 ? (
                                        <div className="inline-block">
                                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                                                <div className="flex items-center justify-center space-x-4">
                                                    <div className="text-center">
                                                        <div className="text-sm text-blue-100 mb-1">ランク順位</div>
                                                        <div className="text-3xl font-bold text-white">
                                                            #{getReflexHunterRank(averageTime).number}
                                                        </div>
                                                        <div className="text-xs text-blue-100">
                                                            / {getReflexHunterRank(averageTime).total}
                                                        </div>
                                                    </div>
                                                    <div className="w-px h-12 bg-white opacity-30"></div>
                                                    <div className="text-center">
                                                        <div className="text-xl font-bold text-white">
                                                            {getReflexHunterRank(averageTime).rank}
                                                        </div>
                                                        <div className="text-sm text-blue-100 mt-1">
                                                            {averageTime}ms平均
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
                                    onClick={resetTest}
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
            <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
                <div className="py-8 px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* ヘッダー */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">反射神経テスト</h1>
                        </div>

                        {/* 進捗表示 */}
                        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-700">テスト進行状況</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-semibold text-blue-600">{results.length}</span>
                                    <span className="text-sm text-gray-400">/</span>
                                    <span className="text-sm text-gray-600">{MAX_TESTS}</span>
                                    <span className="text-xs text-gray-500 ml-1">回完了</span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(results.length / MAX_TESTS) * 100}%` }}
                                ></div>
                            </div>
                            <div className="mt-2 text-right">
                                <span className="text-xs text-gray-500">
                                    {results.length === MAX_TESTS ? '完了！' : `残り ${MAX_TESTS - results.length} 回`}
                                </span>
                            </div>
                        </div>

                        {/* ゲームエリア */}
                        <div className="flex justify-center mb-8">
                            <div
                                className={`w-80 h-80 mx-auto rounded-lg transition-all duration-300 flex items-center justify-center text-xl font-medium border-2 ${gameState === 'countdown'
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : gameState === 'ready'
                                        ? 'bg-green-500 text-white border-green-500 cursor-pointer'
                                        : gameState === 'go'
                                            ? 'bg-red-500 text-white border-red-500 cursor-pointer'
                                            : gameState === 'clicked' && currentResult?.success
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-red-600 text-white border-red-600'
                                    }`}
                                onClick={gameState === 'ready' || gameState === 'go' ? handleClick : undefined}
                            >
                                {gameState === 'countdown' && (
                                    <div className="text-8xl font-bold animate-pulse">
                                        {countdown === 0 ? 'START!' : countdown}
                                    </div>
                                )}
                                {gameState === 'ready' && '画面が赤くなったらクリック！'}
                                {gameState === 'go' && 'クリック！'}
                                {gameState === 'clicked' && currentResult && (
                                    currentResult.success ? `${currentResult.time}ms` : 'フライング！'
                                )}
                            </div>
                        </div>

                        {/* リアルタイム結果表示 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">現在のテスト</div>
                                <div className="text-xl font-bold text-blue-600">
                                    {currentResult ? (currentResult.success ? `${currentResult.time}ms` : 'フライング') : '-'}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                <div className="text-xl font-bold text-green-600">{averageTime > 0 ? `${averageTime}ms` : '-'}</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">最速記録</div>
                                <div className="text-xl font-bold text-purple-600">{bestTime > 0 ? `${bestTime}ms` : '-'}</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">成功率</div>
                                <div className="text-xl font-bold text-orange-600">{results.length > 0 ? `${successRate}%` : '-'}</div>
                            </div>
                        </div>

                        {/* 現在のランク表示 */}
                        {averageTime > 0 && (
                            <div className="bg-white rounded-lg p-4 mb-8 shadow-sm border border-blue-100">
                                <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-2">現在のランク</div>
                                    <div className="flex items-center justify-center space-x-3">
                                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            #{getReflexHunterRank(averageTime).number}
                                        </div>
                                        <div className="text-lg font-medium text-gray-800">
                                            {getReflexHunterRank(averageTime).rank}
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

export default ReflexTestPage; 