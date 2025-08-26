import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Crosshair, Hash, Target, Compass, Clock, Trophy, Crown, Bell, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HomePageService, type HomePageData } from '../services/homePageService';
import type { RankingEntry } from '../services/hybridRankingService';
import LazyImage from '../components/LazyImage';
import panel1 from '../assets/images/panel1.png';
import panel2 from '../assets/images/panel2.png';
import panel3 from '../assets/images/panel3.png';
import panel4 from '../assets/images/panel4.png';
import panel5 from '../assets/images/panel5.png';

interface LastResult {
    primaryStat: string;
    primaryValue: string;
    secondaryStat?: string;
    secondaryValue?: string;
    date: string;
}

interface Notice {
    id: string;
    date: string;
    title: string;
    content?: string;
    type?: 'info' | 'update' | 'maintenance' | 'event';
}

interface GameCardProps {
    title: string;
    description: string | React.ReactNode;
    icon: React.ReactNode;
    path: string;
    lastResult?: LastResult;
    imageSrc?: string;
    playCount?: number;
    topPlayer?: RankingEntry | null;
    isComingSoon?: boolean;
}

// お知らせコンポーネント（2行レイアウト版）
const NoticeSection: React.FC<{ notices: Notice[] }> = ({ notices }) => {
    if (!notices || notices.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">お知らせ</span>
            </div>
            <div className="space-y-1">
                {notices.slice(0, 2).map((notice) => (
                    <div key={notice.id} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500 font-medium min-w-[2.5rem]">{notice.date}</span>
                        <span className="text-gray-800 flex-1">{notice.title}</span>
                    </div>
                ))}
            </div>

        </div>
    );
};

const GameCard: React.FC<GameCardProps> = React.memo(({ 
    title, 
    description, 
    icon, 
    path, 
    lastResult, 
    imageSrc, 
    playCount, 
    topPlayer, 
    isComingSoon = false 
}) => {
    const navigate = useNavigate();
    
    // 診断系ゲーム・クイズ系ゲームかどうかを判定（ランキング・記録を表示しない）
    const isDiagnosisGame = title.includes('診断') || title.includes('クイズ');

    const handleClick = () => {
        if (isComingSoon) {
            // Coming Soonの場合はタップ無効
            return;
        }
        navigate(path);
    };

    return (
        <div
            className={`bg-white rounded-xl shadow-lg border-0 transform transition-all duration-300 group overflow-hidden ${
                isComingSoon 
                    ? 'opacity-75 cursor-default' 
                    : 'cursor-pointer hover:shadow-xl hover:-translate-y-2'
            }`}
            style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            onClick={handleClick}
        >
            {isComingSoon ? (
                <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-3xl mb-2">🚧</div>
                        <div className="text-lg font-semibold text-gray-600">Now developing...</div>
                    </div>
                </div>
            ) : imageSrc && (
                <div className="h-40 relative">
                    <LazyImage 
                        src={imageSrc} 
                        alt="panel" 
                        className="transform transition-transform duration-500 group-hover:scale-105" 
                        placeholder="読み込み中..."
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    {/* クイズ系ゲームの場合は免許ラベル、その他はプレイ回数を表示 */}
                    {title.includes('クイズ') ? (
                        <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-md shadow-sm">
                            狩猟免許 未取得者向け
                        </div>
                    ) : playCount !== undefined && (
                        <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-md shadow-sm" style={{ backgroundColor: '#2f76ac' }}>
                            総プレイ数: {playCount}回
                        </div>
                    )}
                </div>
            )}
            
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                </div>
                
                <div className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {description}
                </div>

                {/* 診断系・クイズ系ゲームは記録・ランキングを表示しない */}
                {!isDiagnosisGame && (
                    <>
                        {/* あなたの前回記録 */}
                        {lastResult && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <div className="text-xs text-gray-500 mb-1">あなたの前回記録</div>
                                <div className="flex justify-center">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">{lastResult.primaryValue}</div>
                                        <div className="text-xs text-gray-500">{lastResult.primaryStat}</div>
                                        <div className="text-xs text-gray-400 mt-1">{lastResult.date}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* トッププレイヤー */}
                        {topPlayer && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Crown className="w-4 h-4 text-yellow-600" />
                                    <span className="text-xs text-yellow-700 font-medium">1位プレイヤー</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-bold text-gray-800">{topPlayer.displayName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-yellow-700">{topPlayer.score}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.title === nextProps.title &&
        prevProps.playCount === nextProps.playCount &&
        prevProps.lastResult?.date === nextProps.lastResult?.date &&
        prevProps.topPlayer?.displayName === nextProps.topPlayer?.displayName &&
        prevProps.isComingSoon === nextProps.isComingSoon
    );
});

const HomePage: React.FC = () => {
    const ENABLE_REFLEX_PANEL = true;
    const ENABLE_TARGET_PANEL = true;
    const ENABLE_SEQUENCE_PANEL = true;
    
    // サンプルお知らせデータ
    const notices: Notice[] = [
        {
            id: '1',
            date: '09.21',
            title: 'ハントレをリリースしました！',
            type: 'event'
        },
        {
            id: '2',
            date: '09.23',
            title: '新規トレーニングメニューを追加しました',
            type: 'update'
        }
    ];

    // Phase 3: 統合APIサービスをメモ化
    const homePageService = useMemo(() => HomePageService.getInstance(), []);
    
    // Phase 3: React Query で統合データ取得（7回のAPI呼び出し → 1回に統合）
    const { 
        data: homePageData, 
        isLoading, 
        error 
    } = useQuery({
        queryKey: ['homepageData'],
        queryFn: () => homePageService.getHomePageDataOptimized(),
        staleTime: 5 * 60 * 1000, // 5分間キャッシュ
        gcTime: 10 * 60 * 1000, // 10分間保持（React Query v5では cacheTime → gcTime）
        retry: 2
    });

    // データ読み込み完了時のログ
    useEffect(() => {
        if (homePageData) {
            console.log(`🚀 Phase 3: HomePage data loaded in ${homePageData.loadTime.toFixed(2)}ms`);
        }
    }, [homePageData]);

    // エラー時のログ
    useEffect(() => {
        if (error) {
            console.error('❌ Phase 3: HomePage data loading failed:', error);
        }
    }, [error]);

    // データの分割（後方互換性のため）
    const lastResults = homePageData?.lastResults || {};
    const playCounts = homePageData?.playCounts || { reflex: 0, target: 0, sequence: 0 };
    const topPlayers = homePageData?.topPlayers || {};

    // Phase 3: LocalStorage移行処理（初回のみ）
    useEffect(() => {
        const migrateData = async () => {
            try {
                await homePageService.migrateLocalToCloud();
            } catch (error) {
                console.error('❌ Failed to migrate local data:', error);
            }
        };
        migrateData();
    }, [homePageService]);

    // ローディング状態の表示
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">データを読み込み中...</p>
                </div>
            </div>
        );
    }

    // エラー状態の表示
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">データの読み込みに失敗しました</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        再読み込み
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1">
            {/* ヒーローセクション */}
            <div className="relative flex items-center justify-center py-12 px-4 min-h-[15vh] overflow-hidden hero-background">
                {/* グラデーションオーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-blue-300/40 to-transparent"></div>
                {/* 上から下へのブラックグラデーション（下に向かって透明に） */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-transparent"></div>
                {/* 薄いGlassmorphismレイヤー */}
                <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm"></div>
                
                {/* パーティクル背景 */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${3 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
                
                <div className="text-center relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        狩猟感覚を、遊びながら鍛える
                    </h1>
                    <p className="text-lg md:text-xl text-white">
                        ハンターのためのオンライントレーニング
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* お知らせセクション */}
                <NoticeSection notices={notices} />

                {/* ゲームカードグリッド */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 反射神経テスト */}
                    {ENABLE_REFLEX_PANEL && (
                        <GameCard
                            title="反射神経テスト"
                            description="狩猟に必要な瞬間的な判断力と反応速度を鍛えます。画面が赤から緑に変わったら素早くクリック！"
                            icon={<Zap className="w-5 h-5 text-yellow-500" />}
                            path="/reflex"
                            lastResult={lastResults.reflex}
                            imageSrc={panel1}
                            playCount={playCounts.reflex}
                            topPlayer={topPlayers.reflex}
                        />
                    )}

                    {/* ターゲット追跡 */}
                    {ENABLE_TARGET_PANEL && (
                        <GameCard
                            title="ターゲット追跡"
                            description="動く標的を正確に追跡する能力を向上させます。獲物の動きを予測して素早く反応しましょう。"
                            icon={<Target className="w-5 h-5 text-red-500" />}
                            path="/target"
                            lastResult={lastResults.target}
                            imageSrc={panel2}
                            playCount={playCounts.target}
                            topPlayer={topPlayers.target}
                        />
                    )}

                    {/* 数字順序ゲーム */}
                    {ENABLE_SEQUENCE_PANEL && (
                        <GameCard
                            title="カウントアップ・トレーニング"
                            description="数字を順番にクリックして集中力と正確性を鍛えます。狩猟時の冷静な判断力向上に効果的。"
                            icon={<Hash className="w-5 h-5 text-green-500" />}
                            path="/sequence"
                            lastResult={lastResults.sequence}
                            imageSrc={panel3}
                            playCount={playCounts.sequence}
                            topPlayer={topPlayers.sequence}
                        />
                    )}

                    {/* 狩猟動物診断 */}
                    <GameCard
                        title="狩猟動物診断"
                        description="あなたの性格や特徴から、どの狩猟動物に最も近いかを診断します。自分の狩猟スタイルを発見しよう！"
                        icon={<Compass className="w-5 h-5 text-purple-500" />}
                        path="/diagnosis"
                        imageSrc={panel4}
                    />

                    {/* 狩猟鳥獣クイズ */}
                    <GameCard
                        title="狩猟鳥獣クイズ"
                        description={
                            <div>
                                狩猟対象となる鳥獣の識別能力をテスト。<br />
                                狩猟免許取得前の学習にも最適です。
                            </div>
                        }
                        icon={<Target className="w-5 h-5 text-orange-500" />}
                        path="/animal-quiz"
                        imageSrc={panel5}
                    />

                    {/* Coming Soon ゲーム1 */}
                    <GameCard
                        title="動物識別記憶"
                        description="瞬間的に表示される動物を記憶し、正確に識別する能力を鍛えます。"
                        icon={<Clock className="w-5 h-5 text-blue-500" />}
                        path="/memory-identification"
                        isComingSoon={true}
                    />

                    {/* Coming Soon ゲーム2 */}
                    <GameCard
                        title="足跡追跡記憶"
                        description="動物の足跡パターンを記憶し、追跡能力を向上させるトレーニング。"
                        icon={<Crosshair className="w-5 h-5 text-indigo-500" />}
                        path="/track-memory"
                        isComingSoon={true}
                    />

                    {/* Coming Soon ゲーム3 */}
                    <GameCard
                        title="狩猟シミュレーション"
                        description="リアルな狩猟環境をシミュレートした総合トレーニング。"
                        icon={<Trophy className="w-5 h-5 text-amber-500" />}
                        path="/hunting-simulation"
                        isComingSoon={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePage;
