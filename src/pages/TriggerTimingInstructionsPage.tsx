import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Crosshair, Trophy, Users, Play, ArrowLeft } from 'lucide-react';
import { HybridRankingService } from '../services/hybridRankingService';
import GameRankingTable from '../components/GameRankingTable';

const TriggerTimingInstructionsPage: React.FC = () => {
    const navigate = useNavigate();
    const [topPlayerCount, setTopPlayerCount] = useState<number>(0);
    const [topPlayer, setTopPlayer] = useState<any>(null);

    useEffect(() => {
        const loadTopPlayerData = async () => {
            try {
                const rankingService = HybridRankingService.getInstance();
                
                // トップランカー情報を取得
                const topPlayersData = await rankingService.getAllTopPlayersOptimized();
                const targetTopPlayer = topPlayersData.target;
                setTopPlayer(targetTopPlayer);
                
                // 総プレイヤー数を取得
                const result = await rankingService.getTotalPlayCountOptimized('target');
                setTopPlayerCount(result);
            } catch (error) {
                console.error('Failed to load top player data:', error);
            }
        };

        loadTopPlayerData();
    }, []);

    const handleStartGame = () => {
        navigate('/trigger-timing/game');
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* ヘッダー */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-red-100 p-3 rounded-full mr-4">
                            <Target className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">トリガータイミングトレーニング</h1>
                    </div>
                    <p className="text-gray-600 text-lg">照準に向かうターゲットの射撃タイミングを向上</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* 左側：ルール説明 */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                            <Target className="w-6 h-6 text-red-600 mr-2" />
                            トレーニング内容
                        </h2>

                        <div className="space-y-6">
                            {/* ルール1 */}
                            <div className="flex items-start">
                                <div className="bg-red-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                                    <span className="text-red-600 font-bold text-sm">1</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">ターゲット出現</h3>
                                    <p className="text-gray-600 text-sm">画面外から黒い円（●）が直線移動で出現します</p>
                                </div>
                            </div>

                            {/* ルール2 */}
                            <div className="flex items-start">
                                <div className="bg-red-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                                    <span className="text-red-600 font-bold text-sm">2</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">目標地点確認</h3>
                                    <p className="text-gray-600 text-sm">赤い十字マーク（✚）が目標地点として表示されます</p>
                                </div>
                            </div>

                            {/* ルール3 */}
                            <div className="flex items-start">
                                <div className="bg-red-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                                    <span className="text-red-600 font-bold text-sm">3</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">精密停止</h3>
                                    <p className="text-gray-600 text-sm">ターゲットをクリックして目標地点で停止させます</p>
                                </div>
                            </div>

                            {/* ルール4 */}
                            <div className="flex items-start">
                                <div className="bg-red-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                                    <span className="text-red-600 font-bold text-sm">4</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">得点計算</h3>
                                    <p className="text-gray-600 text-sm">目標地点の中心に近いほど高得点（最高5.0点）</p>
                                </div>
                            </div>

                            {/* ルール5 */}
                            <div className="flex items-start">
                                <div className="bg-red-100 rounded-full p-2 mr-4 mt-1 flex-shrink-0">
                                    <span className="text-red-600 font-bold text-sm">5</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">総合評価</h3>
                                    <p className="text-gray-600 text-sm">5回のチャレンジの総得点でランキング決定</p>
                                </div>
                            </div>
                        </div>

                        {/* 難易度説明 */}
                        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                                <Trophy className="w-4 h-4 mr-2" />
                                段階的難易度上昇
                            </h4>
                            <p className="text-yellow-700 text-sm">
                                ラウンドが進むにつれて、ターゲットの移動速度が上がり、サイズが小さくなります
                            </p>
                        </div>

                        {/* ボタン */}
                        <div className="mt-8 space-y-3">
                            <button
                                onClick={handleStartGame}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                トレーニング開始
                            </button>
                            <button
                                onClick={handleBack}
                                className="w-1/2 mx-auto block bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                戻る
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
                            <Users className="w-4 h-4 mr-2" />
                            <span>{topPlayerCount}位中 上位10位まで表示</span>
                        </div>

                        {/* 実際のランキング表示（X連携対応） */}
                        <GameRankingTable 
                            gameType="target"
                            limit={10}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TriggerTimingInstructionsPage;
