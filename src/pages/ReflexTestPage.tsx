import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Zap, MousePointer, RotateCcw, AlertTriangle, Trophy, Share2 } from 'lucide-react';
import SEO from '../components/SEO';
import type { TestResult, ReflexGameHistory } from '../types/game';
import { getReflexHunterRank, STORAGE_KEYS, calculateWeightedScore, REFLEX_SCORING } from '../types/game';
import { useGameHistory } from '../hooks/useGameHistory';
import { UsernameRegistrationModal } from '../components/UsernameRegistrationModal';
import { HybridRankingService } from '../services/hybridRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import XLinkPromptModal from '../components/XLinkPromptModal';
import { UserIdentificationService } from '../services/userIdentificationService';
import GameRankingTable from '../components/GameRankingTable';

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
    // 共通フックを使用（拡張版）
    const { gameHistory, saveGameResult, getBestRecord, isNewRecord, shouldShowUsernameModal } = useGameHistory<ReflexGameHistory>(STORAGE_KEYS.REFLEX_HISTORY);
    
    // ユーザー名登録モーダル状態（旧システム）
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [modalGameData, setModalGameData] = useState<{ gameType: string; score: number; isNewRecord: boolean } | null>(null);
    
    // X連携促進モーダル状態
    const [showXLinkModal, setShowXLinkModal] = useState(false);
    const [xLinkModalData, setXLinkModalData] = useState<{ gameType: string; score: number; playerName: string } | null>(null);
    
    // X連携状態の追跡
    const [isXLinked, setIsXLinked] = useState<boolean | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    
    // ランキング情報の追跡
    const [currentRank, setCurrentRank] = useState<number | null>(null);
    const [totalPlayers, setTotalPlayers] = useState<number>(0);
    
    // ランキングテーブル更新用
    const [rankingUpdateKey, setRankingUpdateKey] = useState<number>(0);
    

    
    const userService = UserIdentificationService.getInstance();
    
    // gameState変更を監視（デバッグ用）
    useEffect(() => {
        console.log('🎮 Game state changed to:', gameState);
    }, [gameState]);
    
    // X連携状態を初期化時とゲーム完了時に確認
    useEffect(() => {
        const checkXLinkStatus = async () => {
            const linked = await userService.isXLinked();
            const name = await userService.getDisplayName();
            setIsXLinked(linked);
            setDisplayName(name);

        };
        
        checkXLinkStatus();
    }, [gameState]); // gameStateが変わるたびにチェック
    
    // モーダル状態の変更を監視してデバッグ
    useEffect(() => {

    }, [showXLinkModal, xLinkModalData]);

    // タイマーIDを管理するためのref
    const testTimerRef = useRef<NodeJS.Timeout | null>(null);
    const nextTestTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        console.log('🧹 Clearing all timers...');
        if (testTimerRef.current) {
            console.log('❌ Clearing testTimer ID:', testTimerRef.current);
            clearTimeout(testTimerRef.current);
            testTimerRef.current = null;
        }
        if (nextTestTimerRef.current) {
            console.log('❌ Clearing nextTestTimer ID:', nextTestTimerRef.current);
            clearTimeout(nextTestTimerRef.current);
            nextTestTimerRef.current = null;
        }
        console.log('✅ All timers cleared');
    }, []);
    
    // コンポーネントアンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            console.log('🧹 Component unmounting, clearing all timers...');
            clearAllTimers();
        };
    }, [clearAllTimers]);

    const startSingleTest = useCallback(() => {
        console.log('🎯 Starting single test...');
        clearAllTimers();
        
        // 安全性チェック: タイマーが確実にクリアされているか確認
        if (testTimerRef.current !== null) {
            console.warn('⚠️ Warning: testTimer was not properly cleared!');
            clearTimeout(testTimerRef.current);
            testTimerRef.current = null;
        }
        
        setGameState('ready');
        const randomWait = Math.random() * 3000 + 2000;
        console.log(`⏰ Setting timer for ${randomWait.toFixed(0)}ms to change to 'go' state`);

        testTimerRef.current = setTimeout(() => {
            const goStateTime = performance.now();
            console.log(`🔴 Timer executed! Changing to GO state at: ${goStateTime.toFixed(8)}ms`);
            // 追加の安全性チェック: タイマーが実際に実行されているか確認
            if (testTimerRef.current !== null) {
                setGameState('go');
                setStartTime(goStateTime);
                console.log(`⏰ GO state set, startTime recorded: ${goStateTime.toFixed(8)}ms`);
                testTimerRef.current = null; // 実行後にクリア
            } else {
                console.error('❌ Error: Timer executed but ref was already null!');
            }
        }, randomWait);
        
        console.log('✅ Timer set with ID:', testTimerRef.current);
    }, [clearAllTimers]);

    const startTestSequence = useCallback(() => {
        setIsTestRunning(true);
        setCurrentRound(1);
        setResults([]);
        // 順位情報をリセット
        setCurrentRank(null);
        setTotalPlayers(0);

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

    // ゲーム履歴を保存（加重平均システム）
    const saveGameHistory = useCallback(async (finalResults: TestResult[]) => {
        const validResults = finalResults.filter(r => r.success && r.time > 0);
        const avgTime = validResults.length > 0 ?
            validResults.reduce((sum, result) => sum + result.time, 0) / validResults.length : 0;
        const bestTime = validResults.length > 0 ? Math.min(...validResults.map(r => r.time)) : 0;
        const successRate = finalResults.length > 0 ? (validResults.length / finalResults.length) * 100 : 0;

        // 加重平均スコア計算
        const { successCount, failureCount, averageSuccessTime, weightedScore } = calculateWeightedScore(finalResults);

        const newGameResult: ReflexGameHistory = {
            date: new Date().toLocaleDateString('ja-JP'),
            averageTime: averageSuccessTime, // 修正: calculateWeightedScoreの結果を使用
            bestTime,
            successRate,
            testResults: finalResults,
            // 加重平均システム用フィールド
            successCount,
            failureCount,
            weightedScore
        };

        // DynamoDBに保存（LocalStorageは自動削除）
        const gameHistoryService = GameHistoryService.getInstance();
        await gameHistoryService.saveGameHistory('reflex', newGameResult);

        // クラウドDBにもスコア送信（5回連続成功した場合のみ）
        if (finalResults.length === MAX_TESTS && finalResults.every(r => r.success)) {
            try {
                const hybridService = HybridRankingService.getInstance();
                await hybridService.submitScore('reflex', weightedScore, {
                    averageTime: avgTime,
                    successRate: successRate,
                    totalTests: finalResults.length,
                    successCount: successCount,
                    failureCount: failureCount,
                    bestTime: bestTime,
                    weightedScore: weightedScore
                });
                console.log(`✅ Reflex weighted score submitted to cloud: ${weightedScore}`);
            } catch (error) {
                console.error('❌ Failed to submit reflex score to cloud:', error);
            }
        } else {
            console.log('🚫 Score not submitted - did not complete 5 consecutive successes');
        }

        // 新記録かどうかチェック（加重平均スコアが低い方が良い）
        const isRecord = isNewRecord(weightedScore, (a, b) => a.weightedScore < b.weightedScore);
        
        // X連携状態をチェック
        const isXLinked = await userService.isXLinked();
        const displayName = await userService.getDisplayName();
        

        
        // 自動モーダル表示は無効化 - ボタンクリック時のみ表示

        
        // X連携状態を更新（結果画面でボタン表示判定に使用）
        const currentIsXLinked = await userService.isXLinked();
        const currentDisplayName = await userService.getDisplayName();
        setIsXLinked(currentIsXLinked);
        setDisplayName(currentDisplayName);
        

        
        // 旧ユーザー名登録システム - 自動表示を無効化
        // スムーズな導線のため、「もう一度トレーニングする」時にモーダルが表示されないようにする
        // if (!isXLinked) {
        //     const shouldShow = await shouldShowUsernameModal(isRecord);
        //     if (shouldShow) {
        //         setModalGameData({
        //             gameType: 'reflex',
        //             score: weightedScore,
        //             isNewRecord: isRecord
        //         });
        //         // X連携モーダルの後に表示するため、少し遅延
        //         setTimeout(() => setShowUsernameModal(true), 1000);
        //     }
        // }
    }, [saveGameResult, isNewRecord, shouldShowUsernameModal]);

    const handleClick = useCallback(() => {
        const clickTime = performance.now();
        console.log(`🖱️ Click detected at: ${clickTime.toFixed(8)}ms`);
        
        if (gameState === 'go') {
            clearAllTimers();
            const reactionTime = clickTime - startTime;
            console.log(`🎯 Reaction time recorded: ${reactionTime}ms (precision5: ${reactionTime.toFixed(5)}ms, precision8: ${reactionTime.toFixed(8)}ms)`);
            console.log(`📊 Timing breakdown: Start=${startTime.toFixed(8)}ms, Click=${clickTime.toFixed(8)}ms, Diff=${reactionTime.toFixed(8)}ms`);
            
            const newResult: TestResult = {
                time: reactionTime,
                round: currentRound,
                success: true
            };

            setResults(prev => [...prev, newResult]);
            setGameState('clicked');

            // 最終ラウンド到達時は保存を即時実行（タイマーや離脱で失われないように）
            if (currentRound >= MAX_TESTS) {
                const finalResultsImmediate = [...results, newResult];
                console.log('💾 Saving reflex history immediately (no delay)...');
                saveGameHistory(finalResultsImmediate);
            }

            nextTestTimerRef.current = setTimeout(async () => {
                if (currentRound >= MAX_TESTS) {
                    // 5回連続成功でゲーム完了（保存はすでに実行済み）
                    const finalResults = [...results, newResult];
                    const avgTime = finalResults.reduce((sum, r) => sum + r.time, 0) / finalResults.length;
                    setGameState('finished');
                    setIsTestRunning(false);
                    
                    // 少し待ってから現在スコアでの順位を取得
                    setTimeout(async () => {
                        try {
                            console.log('Fetching current score rank after game completion...');
                            const rankingService = HybridRankingService.getInstance();
                            const { averageSuccessTime, weightedScore } = calculateWeightedScore(finalResults);
                            console.log('Current play score (averageSuccessTime):', averageSuccessTime, 'weightedScore:', weightedScore);
                            const rankResult = await rankingService.getCurrentScoreRank('reflex', weightedScore);
                            console.log('Optimized score rank result:', rankResult);
                            if (rankResult.isTop10 && rankResult.rank) {
                                console.log('🏆 Top 10 rank found:', rankResult.rank, 'out of', rankResult.totalPlayers);
                                setCurrentRank(rankResult.rank);
                                setTotalPlayers(rankResult.totalPlayers);
                                setRankingUpdateKey(prev => prev + 1);
                            } else {
                                console.log('📍 Out of ranking:', rankResult.totalPlayers, 'total players');
                                setCurrentRank(null);
                                setTotalPlayers(rankResult.totalPlayers);
                            }
                        } catch (error) {
                            console.error('Failed to get current score rank:', error);
                        }
                    }, 1000);
                    navigate('/reflex/result');
                } else {
                    setCurrentRound(prev => prev + 1);
                    startSingleTest();
                }
            }, 1500);
        } else if (gameState === 'ready') {
            // フライング発生 - 即座にゲーム終了
            clearAllTimers();
            const newResult: TestResult = {
                time: 0,
                round: currentRound,
                success: false
            };

            const finalResults = [...results, newResult];
            setResults(finalResults);
            setGameState('clicked');

            // フライング発生時も保存は即時実行
            console.log('💾 Saving reflex history immediately (flying)...');
            saveGameHistory(finalResults);
            // フライングでゲーム終了（表示維持のため遅延後に遷移）
            nextTestTimerRef.current = setTimeout(() => {
                setGameState('finished');
                setIsTestRunning(false);
                navigate('/reflex/result');
            }, 1500);
        }
    }, [gameState, startTime, currentRound, startSingleTest, startTestSequence, clearAllTimers, results, saveGameHistory, navigate]);

    // X連携モーダルハンドラー
    const handleXLink = async () => {
        setShowXLinkModal(false);
        setXLinkModalData(null);
        
        // X OAuth認証フローを開始
        console.log('🔧 Starting X OAuth flow from ReflexTestPage...');
        const { default: XAuthService } = await import('../services/xAuthService');
        const xAuthService = XAuthService.getInstance();
        await xAuthService.startAuthFlow();
    };

    // 直接X連携を開始（モーダルなし）
    const handleDirectXLink = async () => {
        console.log('🔧 Starting direct X OAuth flow from ReflexTestPage...');
        const { default: XAuthService } = await import('../services/xAuthService');
        const xAuthService = XAuthService.getInstance();
        await xAuthService.startAuthFlow();
    };

    const handleXLinkClose = () => {
        setShowXLinkModal(false);
    };

    // ボタンクリック時にX連携モーダルを表示
    const showXLinkModalOnClick = () => {

        
        // 最新のゲーム結果を取得
        const latestResult = results.length > 0 ? results[results.length - 1] : null;
        const currentScore = latestResult ? calculateWeightedScore(results).weightedScore : 1000;
        
        const modalData = {
            gameType: 'reflex',
            score: currentScore,
            playerName: displayName
        };
        

        
        // 🔧 修正: setTimeoutでレンダリングサイクルを分離
        // これによりReactの再レンダリングが確実に実行される
        setTimeout(() => {

            setXLinkModalData(modalData);
            setShowXLinkModal(true);

        }, 0);
        

    };

    // デバッグ用: 強制モーダル表示（テスト用）
    const forceShowModal = () => {
        const testData = {
            gameType: 'reflex',
            score: 999,
            playerName: 'テスト用ハンター'
        };
        
        setTimeout(() => {
            setXLinkModalData(testData);
            setShowXLinkModal(true);
        }, 0);
    };

    const resetTest = () => {
        clearAllTimers();
        setGameState('countdown');
        setCountdown(3);
        setCurrentRound(0);
        setResults([]);
        setStartTime(0);
        setIsTestRunning(false);
        
        // モーダル状態をリセット（新記録モーダルが表示されないようにする）
        setShowXLinkModal(false);
        setXLinkModalData(null);
        setShowUsernameModal(false);
        setModalGameData(null);
        
        navigate('/reflex/game');
    };

    // コンポーネントのアンマウント時にタイマーをクリア
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    // 統計計算（加重平均システム対応）
    const validResults = results.filter(r => r.success && r.time > 0);
    const currentResult = results.length > 0 ? results[results.length - 1] : null;
    const averageTime = validResults.length > 0 ?
        validResults.reduce((sum, result) => sum + result.time, 0) / validResults.length : 0;
    const bestTime = validResults.length > 0 ? Math.min(...validResults.map(r => r.time)) : 0;
    
    // デバッグ: ゲーム中の平均時間計算ログ
    useEffect(() => {
        if (validResults.length > 0) {
            console.log(`🎮 Game average calculation:`, {
                validResults: validResults.map(r => ({ time: r.time, precision: r.time.toFixed(5) })),
                sum: validResults.reduce((sum, result) => sum + result.time, 0),
                count: validResults.length,
                averageTime: averageTime,
                averageTimePrecision: averageTime.toFixed(5)
            });
            console.log(`🖥️ Display values: averageTime=${averageTime}, display5=${(averageTime / 1000).toFixed(5)}, display6=${(averageTime / 1000).toFixed(6)}, bestTime=${bestTime}, bestDisplay5=${(bestTime / 1000).toFixed(5)}, bestDisplay6=${(bestTime / 1000).toFixed(6)}`);
        }
    }, [validResults.length, averageTime, bestTime]);
    const successRate = results.length > 0 ? (validResults.length / results.length) * 100 : 0;
    
    // 現在の加重平均スコア計算（メモ化で最適化）
    const currentWeightedScore = useMemo(() => {
        return results.length > 0 ? calculateWeightedScore(results).weightedScore : 0;
    }, [results]);
    
    const currentSuccessCount = useMemo(() => results.filter(r => r.success).length, [results]);
    const currentFailureCount = useMemo(() => results.filter(r => !r.success).length, [results]);

    // ベスト記録計算（加重平均スコアが最も低い記録）
    const bestRecord = gameHistory.length > 0
        ? gameHistory.reduce((best, game) =>
            (game.weightedScore || game.averageTime) < (best.weightedScore || best.averageTime) ? game : best
        )
        : null;

    // 結果画面で現在スコアでの順位を再取得（条件分岐外でuseEffectを定義）
    useEffect(() => {
        const fetchCurrentScoreRank = async () => {
            if (mode === 'result' && results.length > 0) {
                try {
                    console.log('Fetching current score rank on result page...');
                    const rankingService = HybridRankingService.getInstance();
                    
                    // 現在のプレイスコア（平均反応時間）で順位を計算
                    const validResults = results.filter(r => r.success && r.time > 0);
                    if (validResults.length > 0) {
                        const { averageSuccessTime, weightedScore } = calculateWeightedScore(results);
                        console.log('Result page current play score (averageSuccessTime):', averageSuccessTime, 'weightedScore:', weightedScore);
                        
                        const rankResult = await rankingService.getCurrentScoreRank('reflex', weightedScore);
                        console.log('Result page optimized score rank result:', rankResult);
                        
                        if (rankResult.isTop10 && rankResult.rank) {
                            // 10位以内の場合
                            console.log('🏆 Result page top 10 rank found:', rankResult.rank, 'out of', rankResult.totalPlayers);
                            setCurrentRank(rankResult.rank);
                            setTotalPlayers(rankResult.totalPlayers);
                        } else {
                            // ランキング圏外の場合
                            console.log('📍 Result page out of ranking:', rankResult.totalPlayers, 'total players');
                            setCurrentRank(null);
                            setTotalPlayers(rankResult.totalPlayers);
                        }
                    }
                } catch (error) {
                    console.error('Failed to get current score rank on result page:', error);
                }
            }
        };
        
        fetchCurrentScoreRank();
    }, [mode, results]);

    // 結果データの初期化（mode=resultの場合のみ）
    useEffect(() => {
        if (mode === 'result' && results.length === 0) {
            const dummyResults: TestResult[] = [
                { time: 250, round: 1, success: true, reactionTime: 250 },
                { time: 300, round: 2, success: true, reactionTime: 300 },
                { time: 0, round: 3, success: false, reactionTime: 0 },
                { time: 280, round: 4, success: true, reactionTime: 280 },
                { time: 320, round: 5, success: true, reactionTime: 320 }
            ];
            // ダミーデータを設定（テスト用）
            setResults(dummyResults);
        }
    }, [mode, results.length]);

    // modeに応じて画面を切り替え
    if (mode === 'instructions') {
        return (
            <div className="flex-1">
                <SEO 
                    title="反射神経トレーニング - ハントレ"
                    description="緑から赤への色変化に素早く反応するトレーニング。ハンターに必要な瞬間的な判断力と反射神経を鍛えます。"
                    keywords="反射神経,トレーニング,ハンター,射撃,反応時間,瞬発力,集中力"
                    ogType="game"
                    canonicalUrl="https://hantore.net/reflex/instructions"
                />
                <div className="min-h-screen">
                    <div className="py-4 px-4">
                        <div className="max-w-3xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-right mb-4">
                                <h1 className="text-sm font-medium text-gray-500">
                                    反射神経トレーニング
                                </h1>
                            </div>

                            {/* ルール説明 */}
                            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">ルール</h2>
                                <div className="space-y-3 text-gray-700">
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <MousePointer className="w-3 h-3" />
                                        </div>
                                        <p>画面が<span className="text-green-600 font-medium">緑色</span>から<span className="text-red-600 font-medium">赤色</span>に変わったら、できるだけ早くタップ</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <RotateCcw className="w-3 h-3" />
                                        </div>
                                        <p><span className="font-semibold text-blue-600">5回連続</span>で成功する必要があります</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <AlertTriangle className="w-3 h-3" />
                                        </div>
                                        <p><span className="font-semibold text-red-600">赤になる前</span>にタップするとフライングで即トレーニング終了</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                                            <Trophy className="w-3 h-3" />
                                        </div>
                                        <p>5回連続成功時の平均反応時間でランクが決定</p>
                                    </div>
                                </div>
                            </div>

                            {/* ベスト記録表示 */}
                            {bestRecord && (
                                <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">ベスト記録</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                            <div className="text-xl font-bold text-blue-600">{(bestRecord.averageTime / 1000).toFixed(5)}秒</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600 mb-1">最速記録</div>
                                            <div className="text-xl font-bold text-green-600">{(bestRecord.bestTime / 1000).toFixed(5)}秒</div>
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
                                <GameRankingTable gameType="reflex" limit={10} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'result') {
        // 成功した結果のみを抽出
        const successfulResults = results.filter(result => result.success);
        
        // フライング失格判定（5回連続成功していない場合）
        const isDisqualified = successfulResults.length < MAX_TESTS;
        
        // 成功時の統計計算
        const averageTime = successfulResults.length > 0 
            ? successfulResults.reduce((sum, result) => sum + result.time, 0) / successfulResults.length 
            : 0;
        const bestTime = successfulResults.length > 0 
            ? Math.min(...successfulResults.map(result => result.time)) 
            : 0;
        
        return (
            <>
            <div className="flex-1">
                <div className="min-h-screen">
                    <div className="py-4 px-4">
                        <div className="max-w-4xl mx-auto">
                            {/* ヘッダー */}
                            <div className="text-center mb-4">
                                <h1 className="text-m font-bold text-gray-800">
                                    トレーニング完了です！お疲れ様でした！
                                </h1>
                            </div>

                            {/* コンパクト結果表示 */}
                            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                                {isDisqualified ? (
                                    // フライング失格時の表示
                                    <div className="text-center py-8">
                                        <div className="text-lg text-red-500 mb-2 font-bold">フライング失格</div>
                                        <div className="text-sm text-gray-500">
                                            5回連続成功が必要です（成功: {successfulResults.length}回）
                                        </div>
                                    </div>
                                ) : (
                                    // 正常完了時の表示
                                    <>
                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div className="text-center">
                                                <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                                <div className="text-2xl font-bold text-green-600">{(averageTime / 1000).toFixed(5)}秒</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm text-gray-600 mb-1">最速記録</div>
                                                <div className="text-2xl font-bold text-purple-600">{(bestTime / 1000).toFixed(5)}秒</div>
                                            </div>
                                        </div>
                                        
                                        {/* ランキング表示 */}
                                        {totalPlayers > 0 && (
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
                                                            const shareText = `ハントレで反射神経トレーニングをプレイしました！\n結果: ${currentRank ? `${currentRank}位` : 'ランキング圏外'}\n平均反応時間: ${(averageTime / 1000).toFixed(5)}秒\n#ハントレ #狩猟`;
                                                            const shareUrl = window.location.origin;
                                                            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                                            window.open(twitterUrl, '_blank');
                                                        }}
                                                        className="flex text-white items-center gap-1 px-3 py-1.5 bg-black/100 hover:bg-black/100 rounded-full text-sm font-medium transition-colors duration-200"
                                                        title="Xでシェア"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                        Xでシェア
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                                                                        

                                    </>
                                )}
                            </div>

                            {/* ハンターランク - 非表示（ロジックは保持） */}
                            {false && (
                                    <div className="text-center border-t border-blue-200 pt-8">
                                        <div className="text-lg text-gray-600 mb-4">ハンターランク</div>
                                        {results.length === MAX_TESTS && averageTime > 0 ? (
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
                                                                {(averageTime / 1000).toFixed(5)}秒平均
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : results.some(r => !r.success) ? (
                                            <div className="inline-block px-6 py-3 bg-red-500 text-white rounded-lg text-lg font-medium">
                                                フライング失格 - 5回連続成功が必要です
                                            </div>
                                        ) : (
                                            <div className="inline-block px-6 py-3 bg-gray-400 text-white rounded-lg text-lg font-medium">
                                                ランク判定不可
                                            </div>
                                        )}
                                    </div>
                            )}

                            {/* ボタン */}
                            <div className="flex flex-col gap-3 items-center">
                                    <button
                                        onClick={resetTest}
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
                                    <GameRankingTable 
                                        gameType="reflex" 
                                        limit={10} 
                                        key={`ranking-${rankingUpdateKey}`}
                                        currentGameScore={averageTime}
                                    />
                                    
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

                {/* X連携促進モーダル */}
                <XLinkPromptModal
                    isOpen={showXLinkModal && xLinkModalData !== null}
                    onClose={handleXLinkClose}
                    onLinkX={handleXLink}
                    playerName={xLinkModalData?.playerName || 'ハンター名無し'}
                    gameType={xLinkModalData?.gameType || 'reflex'}
                    score={xLinkModalData?.score || 0}
                />
            </>
        );
    }

    // mode === 'game'
    return (
        <>
        <div className="flex-1">
            <div className="min-h-screen">
                <div className="py-4 px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* ヘッダー */}
                        <div className="text-right mb-2">
                                                            <h1 className="text-sm font-medium text-gray-500 font-bold">反射神経トレーニング</h1>
                        </div>

                        {/* 進捗表示 */}
                        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-700">トレーニング進行状況</span>
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
                                {gameState === 'ready' && '画面が赤くなったらタップ！'}
                                {gameState === 'go' && 'タップ！'}
                                {gameState === 'clicked' && currentResult && (
                                    currentResult.success ? `${(currentResult.time / 1000).toFixed(5)}秒` : 'フライング！'
                                )}
                            </div>
                        </div>

                        {/* リアルタイム結果表示 */}
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">平均反応時間</div>
                                <div className="text-xl font-bold text-green-600">{validResults.length > 0 ? `${(averageTime / 1000).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}秒` : '-'}</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                                <div className="text-sm text-gray-600 mb-1">最速記録</div>
                                <div className="text-xl font-bold text-purple-600">{validResults.length > 0 ? `${(bestTime / 1000).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}秒` : '-'}</div>
                            </div>
                        </div>

                        {/* 現在のランク表示 - 非表示（ロジックは保持） */}
                        {false && averageTime > 0 && (
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



        {/* ユーザー名登録モーダル */}
        {modalGameData && (
            <UsernameRegistrationModal
                isOpen={showUsernameModal}
                onClose={() => {
                    setShowUsernameModal(false);
                    setModalGameData(null);
                }}
                onUsernameSet={(username: string) => {
                    console.log(`✅ Username set: ${username}`);
                    setShowUsernameModal(false);
                    setModalGameData(null);
                }}
                gameType={modalGameData.gameType}
                score={modalGameData.score}
                isNewRecord={modalGameData.isNewRecord}
            />
        )}
        </>
    );
};

export default ReflexTestPage; 