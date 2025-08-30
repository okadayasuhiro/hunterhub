import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Crosshair, RotateCcw, Trophy, Share2 } from 'lucide-react';
import type { TriggerTimingHistory } from '../types/game';
import { STORAGE_KEYS, getTriggerTimingHunterRank } from '../types/game';
import { useGameHistory } from '../hooks/useGameHistory';
import { UsernameRegistrationModal } from '../components/UsernameRegistrationModal';
import { HybridRankingService } from '../services/hybridRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import XLinkPromptModal from '../components/XLinkPromptModal';
import { UserIdentificationService } from '../services/userIdentificationService';
import GameRankingTable from '../components/GameRankingTable';

interface TriggerTimingGamePageProps {
    mode: 'instructions' | 'game' | 'result';
}

// ゲーム設定
const GAME_CONFIG = {
    TOTAL_ROUNDS: 5,
    TARGET_SIZE: 20,
    SPEED_RANGES: [
        { min: 30, max: 50 },   // Round 1 - 遅め
        { min: 40, max: 60 },   // Round 2
        { min: 50, max: 70 },   // Round 3
        { min: 60, max: 80 },   // Round 4
        { min: 70, max: 90 }    // Round 5 - 速め
    ],
    TARGET_COLOR: '#000000',
    CROSSHAIR_COLOR: '#FF0000',
    CROSSHAIR_SIZE: 40,
    GAME_AREA_SIZE: 320
};

interface Position {
    x: number;
    y: number;
}

interface GameTarget {
    id: string;
    position: Position;
    velocity: Position;
    size: number;
    isMoving: boolean;
}

interface GameCrosshair {
    position: Position;
    size: number;
}

interface RoundResult {
    round: number;
    hit: boolean;
    reactionTime: number;
    accuracy: number;
}

interface TriggerTimingResult {
    score: number;
    averageReactionTime: number;
    hitRate: number;
    results: RoundResult[];
    timestamp: number;
}

const TriggerTimingGamePage: React.FC<TriggerTimingGamePageProps> = ({ mode }) => {
    const navigate = useNavigate();
    
    // ゲーム状態管理（反射神経ゲームと同じパターン）
    const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
    const [currentRound, setCurrentRound] = useState(0);
    const [results, setResults] = useState<RoundResult[]>([]);
    
    // ターゲット・照準管理
    const [target, setTarget] = useState<GameTarget | null>(null);
    const [crosshair, setCrosshair] = useState<GameCrosshair | null>(null);
    
    // タイマー・アニメーション管理
    const animationFrameRef = useRef<number | undefined>(undefined);
    const roundStartTimeRef = useRef<number>(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    
    // ゲーム履歴管理
    const { gameHistory, saveGameResult, getBestRecord, isNewRecord, shouldShowUsernameModal } = useGameHistory<TriggerTimingHistory>(STORAGE_KEYS.TRIGGER_TIMING_HISTORY);
    
    // モーダル状態
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [modalGameData, setModalGameData] = useState<{ gameType: string; score: number; isNewRecord: boolean } | null>(null);
    const [showXLinkModal, setShowXLinkModal] = useState(false);
    const [xLinkModalData, setXLinkModalData] = useState<{ gameType: string; score: number; playerName: string } | null>(null);
    
    // ユーザー情報
    const [isXLinked, setIsXLinked] = useState<boolean | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    const [currentRank, setCurrentRank] = useState<number | null>(null);
    const [totalPlayers, setTotalPlayers] = useState<number>(0);
    const [rankingUpdateKey, setRankingUpdateKey] = useState<number>(0);

    // ゲーム開始
    const handleStartGame = useCallback(() => {
        console.log('🎮 ゲーム開始');
        setGameState('waiting');
        setCurrentRound(0);
        setResults([]);
        setTarget(null);
        setCrosshair(null);
        
        // 最初のラウンドを開始
        setTimeout(() => {
            startRound(0);
        }, 500);
    }, []);

    // ラウンド開始
    const startRound = useCallback((roundNumber: number) => {
        console.log(`🚀 ラウンド ${roundNumber + 1} 開始`);
        
        if (roundNumber >= GAME_CONFIG.TOTAL_ROUNDS) {
            finishGame();
            return;
        }

        setCurrentRound(roundNumber);
        
        // 照準を画面中央に配置
        const crosshairPos = {
            x: GAME_CONFIG.GAME_AREA_SIZE / 2,
            y: GAME_CONFIG.GAME_AREA_SIZE / 2
        };
        
        setCrosshair({
            position: crosshairPos,
            size: GAME_CONFIG.CROSSHAIR_SIZE
        });

        // ターゲットを生成（照準に向かって移動）
        const targetData = generateTarget(crosshairPos, roundNumber);
        console.log('🎯 ターゲット設定:', targetData);
        setTarget(targetData);
        
        roundStartTimeRef.current = performance.now();
        
        // 状態をplayingに変更してからアニメーション開始
        setGameState('playing');
        
        // 少し遅延してアニメーション開始（状態更新を待つ）
        setTimeout(() => {
            console.log('🎬 アニメーション開始要求');
            startAnimation();
        }, 50);
    }, []);

    // ターゲット生成
    const generateTarget = useCallback((crosshairPos: Position, roundNumber: number): GameTarget => {
        // 画面端からランダムな位置でスタート
        const side = Math.floor(Math.random() * 4); // 0:上, 1:右, 2:下, 3:左
        let startPos: Position;

        switch (side) {
            case 0: // 上から
                startPos = { x: Math.random() * GAME_CONFIG.GAME_AREA_SIZE, y: -GAME_CONFIG.TARGET_SIZE };
                break;
            case 1: // 右から
                startPos = { x: GAME_CONFIG.GAME_AREA_SIZE + GAME_CONFIG.TARGET_SIZE, y: Math.random() * GAME_CONFIG.GAME_AREA_SIZE };
                break;
            case 2: // 下から
                startPos = { x: Math.random() * GAME_CONFIG.GAME_AREA_SIZE, y: GAME_CONFIG.GAME_AREA_SIZE + GAME_CONFIG.TARGET_SIZE };
                break;
            default: // 左から
                startPos = { x: -GAME_CONFIG.TARGET_SIZE, y: Math.random() * GAME_CONFIG.GAME_AREA_SIZE };
                break;
        }

        // 照準への方向ベクトルを計算
        const dx = crosshairPos.x - startPos.x;
        const dy = crosshairPos.y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 正規化された方向ベクトル
        const directionX = dx / distance;
        const directionY = dy / distance;
        
        // ラウンドに応じた速度
        const speedRange = GAME_CONFIG.SPEED_RANGES[roundNumber];
        const speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
        
        return {
            id: `target-${roundNumber}`,
            position: startPos,
            velocity: {
                x: directionX * speed,
                y: directionY * speed
            },
            size: GAME_CONFIG.TARGET_SIZE,
            isMoving: true
        };
    }, []);

    // アニメーション開始
    const startAnimation = useCallback(() => {
        console.log('🎬 アニメーション関数実行開始', { gameState });
        
            const animate = () => {
                setTarget(prevTarget => {
                if (!prevTarget || !prevTarget.isMoving) {
                    console.log('🚫 アニメーション停止:', { prevTarget: !!prevTarget, isMoving: prevTarget?.isMoving });
                    return prevTarget;
                }

                    const newPosition = {
                        x: prevTarget.position.x + prevTarget.velocity.x * 0.016, // 60fps想定
                        y: prevTarget.position.y + prevTarget.velocity.y * 0.016
                    };

                console.log('🎯 ターゲット移動:', {
                    old: prevTarget.position,
                    new: newPosition,
                    velocity: prevTarget.velocity
                });

                // 画面外に出たかチェック
                const margin = 50;
                if (newPosition.x < -margin || newPosition.x > GAME_CONFIG.GAME_AREA_SIZE + margin ||
                    newPosition.y < -margin || newPosition.y > GAME_CONFIG.GAME_AREA_SIZE + margin) {
                    
                    console.log('📤 ターゲット画面外:', newPosition);
                    
                    // ミス（0点）として記録
                        const result: RoundResult = {
                        round: currentRound,
                        hit: false,
                        reactionTime: 0,
                        accuracy: 0
                    };
                    
                    setResults(prev => [...prev, result]);
                    
                    // 次のラウンドへ
                    setTimeout(() => {
                        startRound(currentRound + 1);
                    }, 500);
                        
                        return { ...prevTarget, isMoving: false };
                    }

                    return {
                        ...prevTarget,
                        position: newPosition
                    };
                });

            // ゲーム状態がplayingの場合のみアニメーション継続
            if (gameState === 'playing') {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                console.log('🛑 アニメーション停止 - ゲーム状態:', gameState);
            }
        };

        console.log('🎬 requestAnimationFrame 開始');
        animationFrameRef.current = requestAnimationFrame(animate);
    }, [gameState]);

    // ターゲットクリック処理
    const handleTargetClick = useCallback(() => {
        if (gameState !== 'playing' || !target?.isMoving) return;

        const reactionTime = performance.now() - roundStartTimeRef.current;
        
        // ヒット判定（簡単な距離計算）
        const hit = true; // クリックできた時点でヒット
        const accuracy = 100; // 基本的にクリックできれば100%

        const result: RoundResult = {
            round: currentRound,
            hit,
            reactionTime,
            accuracy
        };
        
        setResults(prev => [...prev, result]);
        setTarget(prev => prev ? { ...prev, isMoving: false } : null);
        
        // アニメーション停止
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

    // 次のラウンドへ
        setTimeout(() => {
            startRound(currentRound + 1);
        }, 500);
    }, [gameState, target, currentRound]);

    // ゲーム終了
    const finishGame = useCallback(async () => {
        console.log('🏁 ゲーム終了');
        setGameState('finished');
        
        // アニメーション停止
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        
        // スコア計算
        const hitResults = results.filter(r => r.hit);
        const totalScore = hitResults.length * 1000; // 簡単なスコア計算
        const averageReactionTime = hitResults.length > 0 
            ? hitResults.reduce((sum, r) => sum + r.reactionTime, 0) / hitResults.length
            : 0;
        const hitRate = (hitResults.length / results.length) * 100;
        
        // ゲーム履歴に保存
        const gameResult: TriggerTimingHistory = {
            date: new Date().toISOString(),
            totalScore,
            averageScore: totalScore / GAME_CONFIG.TOTAL_ROUNDS,
            bestRoundScore: Math.max(...results.map(r => r.hit ? 1000 : 0)),
            rounds: results.map(r => ({
                round: r.round,
                score: r.hit ? 1000 : 0,
                distance: 100, // 仮の値
                targetSpeed: 50, // 仮の値
                targetSize: GAME_CONFIG.TARGET_SIZE,
                reactionTime: r.reactionTime
            }))
        };
        
        await saveGameResult(gameResult);
        
        // ランキング処理は後で実装
        console.log('ゲーム結果:', gameResult);
    }, [results, saveGameResult]);

    // クリーンアップ
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // 説明画面
    if (mode === 'instructions') {
    return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="w-8 h-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">射撃タイミング・トレーニング</h1>
                            <p className="text-gray-600">動く標的を狙い撃ちして反射神経を鍛えよう</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-sm font-bold">1</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">標的を狙撃</h3>
                                    <p className="text-sm text-gray-600">画面中央の照準に向かって移動する黒い円をタップ</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-sm font-bold">2</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">5ラウンド挑戦</h3>
                                    <p className="text-sm text-gray-600">ラウンドが進むにつれて標的の速度が上がります</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-sm font-bold">3</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">スコア計算</h3>
                                    <p className="text-sm text-gray-600">反応時間と命中率でスコアが決まります</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/trigger-timing/game')}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                            >
                                トレーニング開始
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-1/2 mx-auto block bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                戻る
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ゲーム画面
    if (mode === 'game') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <div className="max-w-md mx-auto">
                {/* プログレスバー */}
                <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>ラウンド {currentRound + 1} / {GAME_CONFIG.TOTAL_ROUNDS}</span>
                            <span>命中: {results.filter(r => r.hit).length} / {results.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentRound) / GAME_CONFIG.TOTAL_ROUNDS) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* ゲームエリア */}
                    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                    <div 
                        ref={gameAreaRef}
                            className="relative bg-gray-100 rounded-lg mx-auto"
                        style={{ 
                                width: GAME_CONFIG.GAME_AREA_SIZE, 
                                height: GAME_CONFIG.GAME_AREA_SIZE 
                            }}
                        >
                            {/* 照準 */}
                        {crosshair && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: crosshair.position.x - crosshair.size / 2,
                                    top: crosshair.position.y - crosshair.size / 2,
                                    width: crosshair.size,
                                    height: crosshair.size,
                                }}
                            >
                                <Crosshair 
                                    className="w-full h-full"
                                    style={{ color: GAME_CONFIG.CROSSHAIR_COLOR }}
                                />
                            </div>
                        )}

                        {/* ターゲット */}
                            {target && target.isMoving && (
                            <div
                                    className="absolute cursor-pointer rounded-full"
                                style={{
                                    left: target.position.x - target.size / 2,
                                    top: target.position.y - target.size / 2,
                                    width: target.size,
                                    height: target.size,
                                    backgroundColor: GAME_CONFIG.TARGET_COLOR,
                                }}
                                onClick={handleTargetClick}
                            />
                        )}

                            {/* 待機状態 */}
                        {gameState === 'waiting' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button
                                        onClick={handleStartGame}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
                                    >
                                        開始
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 統計情報 */}
                    <div className="bg-white rounded-lg shadow-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-red-600">
                                    {results.filter(r => r.hit).length}
                                </div>
                                <div className="text-sm text-gray-600">命中数</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {results.filter(r => r.hit).length > 0 
                                        ? Math.round(results.filter(r => r.hit).reduce((sum, r) => sum + r.reactionTime, 0) / results.filter(r => r.hit).length)
                                        : 0}ms
                                </div>
                                <div className="text-sm text-gray-600">平均反応時間</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 結果画面
    if (mode === 'result') {
        const hitCount = results.filter(r => r.hit).length;
        const totalScore = hitCount * 1000; // 簡単なスコア計算
        const averageReactionTime = hitCount > 0 
            ? results.filter(r => r.hit).reduce((sum, r) => sum + r.reactionTime, 0) / hitCount
            : 0;
        const hitRate = (hitCount / results.length) * 100;

        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                        <div className="text-center mb-6">
                            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">トレーニング完了</h1>
                            
                            {/* スコア表示 */}
                            <div className="bg-red-50 rounded-lg p-4 mb-4">
                                <div className="text-3xl font-bold text-red-600 mb-2">{totalScore}</div>
                                <div className="text-sm text-gray-600">スコア</div>
                                {currentRank && (
                                    <div className="text-lg font-semibold text-gray-700 mt-2">
                                        {currentRank}位 / {totalPlayers}人中
                                    </div>
                                )}
                            </div>

                            {/* 詳細統計 */}
                            <div className="grid grid-cols-3 gap-4 text-center mb-6">
                                <div>
                                    <div className="text-xl font-bold text-green-600">{hitCount}</div>
                                    <div className="text-xs text-gray-600">命中数</div>
                    </div>
                                <div>
                                    <div className="text-xl font-bold text-blue-600">{Math.round(averageReactionTime)}ms</div>
                                    <div className="text-xs text-gray-600">平均反応時間</div>
                    </div>
                                <div>
                                    <div className="text-xl font-bold text-purple-600">{Math.round(hitRate)}%</div>
                                    <div className="text-xs text-gray-600">命中率</div>
                    </div>
                    </div>
                </div>

                        {/* アクションボタン */}
                        <div className="space-y-3">
                    <button
                                onClick={() => navigate('/trigger-timing/game')}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                                もう一度トレーニングする
                    </button>
                    <button
                                onClick={() => navigate('/')}
                                className="w-1/2 mx-auto block bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                メニューに戻る
                            </button>
                        </div>

                        {/* シェアボタン */}
                        <div className="flex justify-center space-x-4 mt-4">
                            <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
                                <Share2 className="w-4 h-4" />
                    </button>
                        </div>
                    </div>

                    {/* ランキングテーブル */}
                    <GameRankingTable 
                        gameType="trigger-timing"
                        updateKey={rankingUpdateKey}
                    />
                </div>

                {/* モーダル */}
                {showUsernameModal && modalGameData && (
                    <UsernameRegistrationModal
                        isOpen={showUsernameModal}
                        onClose={() => setShowUsernameModal(false)}
                        onUsernameSet={() => setShowUsernameModal(false)}
                        gameType={modalGameData.gameType}
                        score={modalGameData.score}
                        isNewRecord={modalGameData.isNewRecord}
                    />
                )}

                {showXLinkModal && xLinkModalData && (
                    <XLinkPromptModal
                        isOpen={showXLinkModal}
                        onClose={() => setShowXLinkModal(false)}
                        onLinkX={() => setShowXLinkModal(false)}
                        gameType={xLinkModalData.gameType}
                        score={xLinkModalData.score}
                        playerName={xLinkModalData.playerName}
                    />
                )}
        </div>
    );
    }

    return null;
};

export default TriggerTimingGamePage;