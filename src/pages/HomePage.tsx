import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Crosshair, Hash, Target, Compass, Clock, Trophy } from 'lucide-react';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory } from '../types/game';
import { STORAGE_KEYS } from '../types/game';
import panel1 from '../assets/images/panel1.png';

interface LastResult {
    primaryStat: string;
    primaryValue: string;
    secondaryStat?: string;
    secondaryValue?: string;
    date: string;
}

interface GameCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    lastResult?: LastResult;
    imageSrc?: string;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, icon, path, lastResult, imageSrc }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(path);
    };

    return (
        <div
            className="bg-white rounded-xl shadow-lg border-0 cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group overflow-hidden"
            style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            onClick={handleClick}
        >
            {imageSrc && (
                <div className="h-40 relative">
                    <img src={imageSrc} alt="panel" className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
            )}
            <div className="text-left p-8">
                <div className="flex items-center mb-4">
                    <div className="mr-3 group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                        {title}
                    </h3>
                </div>
                <p className="text-gray-600 font-normal leading-relaxed mb-6">
                    {description}
                </p>
                
                {/* 前回の結果表示（常に表示で高さ統一） */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border min-h-[100px]">
                    {lastResult ? (
                        <>
                            <div className="flex items-center mb-2">
                                <Trophy size={16} className="text-yellow-600 mr-2" />
                                <span className="text-sm font-medium text-gray-700">前回の記録</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500">{lastResult.primaryStat}</p>
                                    <p className="text-lg font-bold text-blue-600">{lastResult.primaryValue}</p>
                                </div>
                                {lastResult.secondaryStat && (
                                    <div>
                                        <p className="text-xs text-gray-500">{lastResult.secondaryStat}</p>
                                        <p className="text-lg font-bold text-green-600">{lastResult.secondaryValue}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center mt-2">
                                <Clock size={12} className="text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500">{lastResult.date}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-2">
                            <div className="flex items-center mb-2">
                                <Trophy size={16} className="text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-500">記録</span>
                            </div>
                            <p className="text-sm text-gray-400 text-center">まだプレイ記録が<br />ありません</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-6">
                    <button className="w-full px-8 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium group-hover:bg-blue-600 transition-all duration-300 shadow-md group-hover:shadow-lg">
                        開始する
                    </button>
                </div>
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
    const ENABLE_REFLEX_PANEL = true;
    const [lastResults, setLastResults] = useState<{
        reflex?: LastResult;
        target?: LastResult;
        sequence?: LastResult;
    }>({});

    // LocalStorageから各ゲームの最新記録を取得
    useEffect(() => {
        const loadLastResults = () => {
            try {
                // 反射神経テストの最新記録
                const reflexHistory = localStorage.getItem(STORAGE_KEYS.REFLEX_HISTORY);
                if (reflexHistory) {
                    const history: ReflexGameHistory[] = JSON.parse(reflexHistory);
                    if (history.length > 0) {
                        const latest = history[0];
                        setLastResults(prev => ({
                            ...prev,
                            reflex: {
                                primaryStat: '平均反応時間',
                                primaryValue: `${Math.round(latest.averageTime)}ms`,
                                secondaryStat: '成功率',
                                secondaryValue: `${Math.round(latest.successRate)}%`,
                                date: new Date(latest.date).toLocaleDateString('ja-JP')
                            }
                        }));
                    }
                }

                // ターゲット追跡ゲームの最新記録
                const targetHistory = localStorage.getItem(STORAGE_KEYS.TARGET_HISTORY);
                if (targetHistory) {
                    const history: TargetTrackingHistory[] = JSON.parse(targetHistory);
                    if (history.length > 0) {
                        const latest = history[0];
                        setLastResults(prev => ({
                            ...prev,
                            target: {
                                primaryStat: '合計時間',
                                primaryValue: `${(latest.totalTime / 1000).toFixed(1)}s`,
                                secondaryStat: '平均反応',
                                secondaryValue: `${Math.round(latest.averageReactionTime)}ms`,
                                date: new Date(latest.date).toLocaleDateString('ja-JP')
                            }
                        }));
                    }
                }

                // 数字順序ゲームの最新記録
                const sequenceHistory = localStorage.getItem(STORAGE_KEYS.SEQUENCE_HISTORY);
                if (sequenceHistory) {
                    const history: SequenceGameHistory[] = JSON.parse(sequenceHistory);
                    if (history.length > 0) {
                        const latest = history[0];
                        setLastResults(prev => ({
                            ...prev,
                            sequence: {
                                primaryStat: '完了時間',
                                primaryValue: `${(latest.completionTime / 1000).toFixed(1)}s`,
                                secondaryStat: 'ランク',
                                secondaryValue: latest.rankTitle,
                                date: new Date(latest.date).toLocaleDateString('ja-JP')
                            }
                        }));
                    }
                }
            } catch (error) {
                console.error('Failed to load last results:', error);
            }
        };

        loadLastResults();
    }, []);

    return (
        <div className="flex-1">
            {/* ヒーローセクション */}
            <div className="relative flex items-center justify-center py-12 px-4 min-h-[20vh] overflow-hidden hero-background">
                {/* グラデーションオーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-blue-300/40 to-transparent"></div>
                {/* 半透明黒オーバーレイでテキスト可読性UP */}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="flex items-center justify-center mb-6">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 text-stone-50 mb-4">
                            狩猟をオンラインでも
                        </h1>

                    </div>
                    <p className="text-xl md:text-2xl text-white font-light mb-4 drop-shadow-lg">
                        狩猟者の息抜きと、これから狩猟を楽しむ<br />人達のためのお遊びサイト
                    </p>
                </div>
            </div>

            {/* ゲーム選択セクション */}
            <div className="py-16 px-4" style={{ backgroundColor: '#f8fafc' }}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-4">
                            トレーニングメニュー
                        </h2>
                        <p className="text-lg text-gray-600 font-light">
                            あなたの反射神経と集中力を鍛える3つのゲーム
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <GameCard
                            title="反射神経テスト"
                            description="緑から赤への色変化に素早く反応して、クリックしてください。赤になる前にクリックするとフライング！。"
                            icon={<Zap size={32} className="text-blue-500" />}
                            path="/reflex/instructions"
                            lastResult={lastResults.reflex}
                            imageSrc={ENABLE_REFLEX_PANEL ? panel1 : undefined}
                        />
                        <GameCard
                            title="ターゲット追跡"
                            description="画面上の標的を順番にクリック！10個のターゲットを順番に撃ち抜き、反応時間と総合時間を測定します。"
                            icon={<Crosshair size={32} className="text-blue-600" />}
                            path="/target/instructions"
                            lastResult={lastResults.target}
                        />
                        <GameCard
                            title="数字順序ゲーム"
                            description="画面上にランダムに配置された数字を小さい順にクリックします！反応時間と総合時間を競います。"
                            icon={<Hash size={32} className="text-blue-700" />}
                            path="/sequence/instructions"
                            lastResult={lastResults.sequence}
                        />
                    </div>
                </div>
            </div>

            {/* 狩猟動物診断セクション */}
            <div className="bg-white py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-4">
                            狩猟動物診断
                        </h2>
                        <p className="text-lg text-gray-600 font-light">
                            あなたの性格を分析し、最適な狩猟対象動物を診断
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <GameCard
                            title="狩猟鳥獣診断"
                            description="12の質問であなたの性格を分析し、46種の狩猟対象動物から最も近い1匹を診断します。所要時間約5分。"
                            icon={<Compass size={32} className="text-green-600" />}
                            path="/diagnosis"
                        />
                    </div>
                </div>
            </div>

            {/* 特徴セクション */}
            <div className="py-12 px-4" style={{ backgroundColor: '#f8fafc' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-gray-500 font-light">
                        継続的なトレーニングで、狩猟時の反射神経と集中力を向上させましょう
                    </p>
                </div>
            </div>


        </div>
    );
};

export default HomePage; 