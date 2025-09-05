import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Crosshair, Hash, Target, Compass, Clock, Trophy, Crown, Bell, Calendar } from 'lucide-react';
import SEO from '../components/SEO';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory } from '../types/game';
import { STORAGE_KEYS } from '../types/game';
import { HybridRankingService } from '../services/hybridRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import type { RankingEntry } from '../services/hybridRankingService';
import { UserIdentificationService } from '../services/userIdentificationService';
// Phase 3最適化: React Query導入
import { useQuery } from '@tanstack/react-query';
import { HomePageService, type HomePageData } from '../services/homePageService';
// Phase 3最適化: 遅延読み込み画像
import LazyImage from '../components/LazyImage';
// WebP画像に変更（98%サイズ削減効果）
import panel1 from '../assets/images/panel1.webp';
import panel2 from '../assets/images/panel2.webp';
import panel3 from '../assets/images/panel3.webp';
import panel4 from '../assets/images/panel4.webp';
import panel5 from '../assets/images/panel5.webp';

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

// 広告カードコンポーネント
const AdCard: React.FC = React.memo(() => {
    return (
        <div className="bg-white rounded-xl shadow-lg border-0 transform transition-all duration-300 group overflow-hidden">
            <div className="relative">
                {/* 広告ラベル */}
                <div className="absolute top-2 left-2 z-10">
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        広告
                    </span>
                </div>
                
                {/* 広告コンテンツ */}
                <div className="p-4 flex flex-col items-center justify-center">
                    <a href="https://px.a8.net/svt/ejp?a8mat=45C668+CHIAIA+4NJ4+6GRMP" rel="nofollow" className="block mb-4">
                        <img 
                            width="336" 
                            height="280" 
                            alt="広告" 
                            src="https://www28.a8.net/svt/bgt?aid=250830656755&wid=001&eno=01&mid=s00000021712001086000&mc=1"
                            className="rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                            style={{ border: 'none' }}
                        />
                    </a>
                    <img 
                        width="1" 
                        height="1" 
                        src="https://www11.a8.net/0.gif?a8mat=45C668+CHIAIA+4NJ4+6GRMP" 
                        alt=""
                        style={{ display: 'none', border: 'none' }}
                    />
                    
                    {/* 広告説明テキスト */}
                    <div className="w-full px-2">
                        <h3 className="text-base font-semibold text-gray-800 mb-2 text-left">
                            Jackeryポータブル電源
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed text-left">
                            キャンプ、夜釣りなどのアウトドアに活用！ スマホやパソコンの電力を確保、電池が切れる心配なし。 防災用のみではなくアウトドアにもよく活用されている 持ち運びにやすいポータブル電源です。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
});

// お知らせコンポーネント（2行レイアウト版）
const NoticeSection: React.FC<{ notices: Notice[] }> = ({ notices }) => {
    if (!notices || notices.length === 0) {
        return null;
    }

    return (
        <div className="py-3 px-4 border-b border-slate-200/60" style={{ backgroundColor: '#021D40' }}>
            <div className="max-w-6xl mx-auto">
                <div className="space-y-1.5">
                    {notices.slice(0, 2).map((notice) => (
                        <div key={notice.id} className="flex items-center space-x-3">
                            <span className="text-xs text-gray-300 font-medium whitespace-nowrap bg-gray-600 px-2 py-0.5 rounded-full">
                                {notice.date}
                            </span>
                            <span className="text-sm text-white font-medium">
                                {notice.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GameCard: React.FC<GameCardProps> = React.memo(({ title, description, icon, path, lastResult, imageSrc, playCount, topPlayer, isComingSoon = false }) => {
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
            className={`bg-white rounded-xl shadow-lg border-0 transform transition-all duration-300 group overflow-hidden flex flex-col ${
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
                <div className="h-40 relative bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
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
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                        placeholder="読み込み中..."
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    {/* クイズ系ゲームの場合は免許ラベル、その他はプレイ回数を表示 */}
                    {title.includes('クイズ') ? (
                        <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-md shadow-sm">
                            狩猟免許 未取得者向け
                        </div>
                    ) : playCount !== undefined && (
                        <div className="absolute bottom-0 right-0 px-2 py-1 text-sm font-medium transform transition-transform duration-500 group-hover:scale-105 text-white" style={{ backgroundColor: '#2f76ac' }}>
                            Total {playCount} plays
                        </div>
                    )}
                </div>
            )}
            <div className="text-left p-6 flex flex-col flex-1">
                <div className="mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">
                        {title}
                    </h3>
                </div>
                <div className="text-gray-600 font-normal leading-relaxed mb-6">
                    {description}
                </div>
                
                {/* 1位プレイヤー表示（診断系ゲーム以外のみ） */}
                {!isDiagnosisGame && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                        {topPlayer ? (
                            <>
                                {/* デスクトップレイアウト（md以上） */}
                                <div className="hidden md:flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Crown className="w-4 h-4 text-yellow-600 mr-2" />
                                        <span className="text-sm font-medium text-gray-700 mr-2">1位</span>
                                        <span className="text-md font-bold text-yellow-700">
                                            {title.includes('反射神経')
                                                ? `${((topPlayer?.score || 0) / 1000).toFixed(5)}s`
                                                : title.includes('ターゲット') || title.includes('カウントアップ')
                                                ? `${((topPlayer?.score || 0) / 1000).toFixed(3)}s`
                                                : `${topPlayer?.score}`
                                            }
                                        </span>
                                    </div>
                                    <div className="relative group">
                                        <span 
                                            className="text-sm text-yellow-700 truncate max-w-[160px] inline-block cursor-help"
                                            title={topPlayer?.displayName}
                                        >
                                            {topPlayer?.displayName}
                                        </span>
                                        
                                        {/* ホバーツールチップ */}
                                        <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap pointer-events-none">
                                            {topPlayer?.displayName}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* モバイルレイアウト（md未満） */}
                                <div className="md:hidden">
                                    {/* 上段：1位 + スコア */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <Crown className="w-4 h-4 text-yellow-600 mr-2" />
                                            <span className="text-sm font-medium text-gray-700">1位</span>
                                        </div>
                                        <span className="text-md font-bold text-yellow-700">
                                            {title.includes('反射神経')
                                                ? `${((topPlayer?.score || 0) / 1000).toFixed(5)}s`
                                                : title.includes('ターゲット') || title.includes('カウントアップ')
                                                ? `${((topPlayer?.score || 0) / 1000).toFixed(3)}s`
                                                : `${topPlayer?.score}`
                                            }
                                        </span>
                                    </div>
                                    {/* 下段：ユーザー名 */}
                                    <div className="ml-6">
                                        <span className="text-sm text-yellow-700 truncate block">
                                            {topPlayer?.displayName}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center">
                                <Crown className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-500">まだランキングがありません</span>
                            </div>
                        )}
                    </div>
                )}
                
                {/* 前回の結果表示（診断系ゲーム以外のみ） */}
                {!isDiagnosisGame && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border min-h-[100px]">
                        {lastResult ? (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <span className="text-sm font-medium text-gray-700">あなたの前回記録</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock size={12} className="text-gray-400 mr-1" />
                                        <span className="text-xs text-gray-500">{lastResult.date}</span>
                                    </div>
                                </div>
                                <div className={`${lastResult.secondaryStat ? 'grid grid-cols-2 gap-3' : 'flex justify-center'}`}>
                                    <div className={`${!lastResult.secondaryStat ? 'text-center' : ''}`}>
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
                )}
                
                <div className="mt-auto">
                    <button className="w-full px-8 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium group-hover:bg-blue-600 transition-all duration-300 shadow-md group-hover:shadow-lg">
                        トレーニングする
                    </button>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // 最適化: 重要なpropsのみ比較
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
            date: '09.05',
            title: 'いくつかの不具合を修正しました',
            type: 'event'
        },
        {
            id: '2',
            date: '08.31',
            title: '新規トレーニングメニューを追加しました',
            type: 'update'
        }
    ];
    const [lastResults, setLastResults] = useState<{
        reflex?: LastResult;
        target?: LastResult;
        sequence?: LastResult;
    }>({});
    
    const [playCounts, setPlayCounts] = useState<{
        reflex?: number;
        target?: number;
        sequence?: number;
    }>({});
    
    const [topPlayers, setTopPlayers] = useState<{
        reflex?: RankingEntry | null;
        target?: RankingEntry | null;
        sequence?: RankingEntry | null;
    }>({});

    // Phase 2: 基本キャッシュ - サービスインスタンスをメモ化
    const gameHistoryService = useMemo(() => GameHistoryService.getInstance(), []);
    const hybridRankingService = useMemo(() => HybridRankingService.getInstance(), []);
    
    // Phase 3最適化: HomePageServiceインスタンスをメモ化
    const homePageService = useMemo(() => HomePageService.getInstance(), []);

    // Phase 3最適化: React Query導入（既存のuseEffectと並行動作）
    const { data: optimizedData, isLoading: isOptimizedLoading, error: optimizedError } = useQuery<HomePageData>({
        queryKey: ['homePageData'],
        queryFn: () => homePageService.getHomePageDataOptimized(),
        staleTime: 5 * 60 * 1000, // 5分間キャッシュ
        gcTime: 10 * 60 * 1000, // 10分間保持
        retry: 2,
        refetchOnWindowFocus: false
    });

    // 本番最適化: DEV環境のみログ出力
    useEffect(() => {
        if (optimizedData && import.meta.env.DEV) {
            console.log('🚀 Phase 3最適化: React Query統合データ取得成功', {
                loadTime: optimizedData.loadTime,
                lastResults: Object.keys(optimizedData.lastResults).length,
                playCounts: optimizedData.playCounts,
                topPlayers: Object.keys(optimizedData.topPlayers).length
            });
        }
        // エラーログは本番でも重要（ただし簡潔に）
        if (optimizedError && import.meta.env.DEV) {
            console.error('❌ Phase 3最適化: React Query統合データ取得エラー', optimizedError);
        }
    }, [optimizedData, optimizedError]);

    // Phase 2: お知らせデータをメモ化（再レンダリング防止）
    const memoizedNotices = useMemo(() => notices, []);

    // Phase 2: ゲームカード設定をメモ化
    const gameCardConfigs = useMemo(() => [
        {
            title: "反射神経トレーニング",
            description: "緑から赤への色変化に素早く反応して、タップしてください。赤になる前にタップするとフライング！",
            path: "/reflex/instructions",
            imageSrc: ENABLE_REFLEX_PANEL ? panel1 : undefined,
            gameType: 'reflex' as const
        },
        {
            title: "ターゲット追跡トレーニング",
            description: "画面上の標的を順番にタップ！10個のターゲットを順番に撃ち抜き、反応時間と総合時間を測定します。",
            path: "/target/instructions",
            imageSrc: ENABLE_TARGET_PANEL ? panel2 : undefined,
            gameType: 'target' as const
        },
        {
            title: "カウントアップ・トレーニング",
            description: "画面上にランダムに配置された数字を小さい順にタップします！反応時間と総合時間を競います。",
            path: "/sequence/instructions",
            imageSrc: ENABLE_SEQUENCE_PANEL ? panel3 : undefined,
            gameType: 'sequence' as const
        }
    ], [ENABLE_REFLEX_PANEL, ENABLE_TARGET_PANEL, ENABLE_SEQUENCE_PANEL]);

    // Phase 2: 開発中ゲームカード設定をメモ化
    const developingGameConfigs = useMemo(() => [
        // 初期リリース対象外: 全ての開発中ゲームをコメントアウト
        // {
        //     title: "動物識別記憶",
        //     description: "瞬間的に表示される動物を正確に識別・記憶するゲームです。狩猟知識と記憶力を同時に鍛えます。",
        //     path: "#",
        //     isComingSoon: true
        // },
        // {
        //     title: "足跡追跡記憶",
        //     description: "動物の足跡パターンを記憶し、正確に再現するゲームです。フィールドでの追跡技術を向上させます。",
        //     path: "#",
        //     isComingSoon: true
        // },
        // {
        //     title: "射撃タイミング",
        //     description: "最適な射撃タイミングを判断するゲームです。風向きや距離を考慮した精密射撃を練習します。",
        //     path: "#",
        //     isComingSoon: true
        // }
    ], []);

    // Phase 3最適化: 初期マイグレーション処理（React Queryと並行）
    useEffect(() => {
        const initializeMigration = async () => {
            try {
                await homePageService.migrateLocalToCloud();
                if (import.meta.env.DEV) {
                    console.log('🚀 Phase 3最適化: 初期マイグレーション完了');
                }
            } catch (error) {
                console.error('❌ Phase 3最適化: 初期マイグレーションエラー', error);
            }
        };
        initializeMigration();
    }, [homePageService]);

    // ゲーム履歴から各ゲームの最新記録を取得
    useEffect(() => {
        const loadLastResults = async () => {
            const startTime = performance.now();
            try {
                
                // 初回ロード時にLocalStorageからクラウドへ移行
                await gameHistoryService.migrateLocalToCloud();

                // 反射神経テストの最新記録
                const reflexLatest = await gameHistoryService.getLatestGameHistory<ReflexGameHistory>('reflex');
                if (reflexLatest) {
                    
                    setLastResults(prev => ({
                        ...prev,
                        reflex: {
                            primaryStat: '平均反応時間',
                            primaryValue: `${(reflexLatest.averageTime / 1000).toFixed(5)}s`,
                            date: new Date(reflexLatest.date).toLocaleDateString('ja-JP')
                        }
                    }));
                }
                
                // プレイ回数を設定（クラウドから全ユーザーの総プレイ回数を取得）
                // ユーザーの履歴の有無に関係なく実行
                try {
                    const totalPlayCount = await hybridRankingService.getTotalPlayCountOptimized('reflex');

                    
                    if (totalPlayCount > 0) {
                        setPlayCounts(prev => ({
                            ...prev,
                            reflex: totalPlayCount
                        }));
                    } else {
                        throw new Error('Zero play count returned from cloud');
                    }
                } catch (error) {
                    console.error('❌ HomePage: Failed to get reflex total play count from cloud:', error);
                    
                    // クラウドが0件の場合はLocalStorageに依存せず0を表示
                    setPlayCounts(prev => ({
                        ...prev,
                        reflex: 0
                    }));
                }

                // ターゲット追跡ゲームの最新記録（回避策：全履歴から最新を取得）
                const targetHistory = await gameHistoryService.getGameHistory<TargetTrackingHistory>('target');
                const targetLatest = targetHistory.length > 0 ? targetHistory[0] : null;
                if (targetLatest) {
                    setLastResults(prev => ({
                        ...prev,
                        target: {
                            primaryStat: '合計時間',
                            primaryValue: `${targetLatest.totalTime.toFixed(3)}s`, // 修正: 既に秒単位
                            secondaryStat: '平均反応',
                            secondaryValue: `${targetLatest.averageReactionTime.toFixed(3)}s`,
                            date: new Date(targetLatest.date).toLocaleDateString('ja-JP')
                        }
                    }));
                }
                
                // プレイ回数を設定（クラウドから全ユーザーの総プレイ回数を取得）
                // ユーザーの履歴の有無に関係なく実行
                try {
                    const totalPlayCount = await hybridRankingService.getTotalPlayCountOptimized('target');
                    
                    if (totalPlayCount > 0) {
                        setPlayCounts(prev => ({
                            ...prev,
                            target: totalPlayCount
                        }));
                    } else {
                        throw new Error('Zero play count returned from cloud');
                    }
                } catch (error) {
                    console.error('❌ HomePage: Failed to get target total play count from cloud:', error);
                    
                    // クラウドが0件の場合はLocalStorageに依存せず0を表示
                    setPlayCounts(prev => ({
                        ...prev,
                        target: 0
                    }));
                }

                // 数字順序ゲームの最新記録（回避策：全履歴から最新を取得）
                const sequenceHistory = await gameHistoryService.getGameHistory<SequenceGameHistory>('sequence');
                const sequenceLatest = sequenceHistory.length > 0 ? sequenceHistory[0] : null;
                if (sequenceLatest) {
                    setLastResults(prev => ({
                        ...prev,
                        sequence: {
                            primaryStat: '完了時間',
                            primaryValue: `${sequenceLatest.completionTime.toFixed(3)}s`, // 修正: 既に秒単位
                            secondaryStat: '平均タップ間隔',
                            secondaryValue: `${sequenceLatest.averageClickInterval.toFixed(3)}s`,
                            date: new Date(sequenceLatest.date).toLocaleDateString('ja-JP')
                        }
                    }));
                }
                
                // プレイ回数を設定（クラウドから全ユーザーの総プレイ回数を取得）
                // ユーザーの履歴の有無に関係なく実行
                try {
                    const totalPlayCount = await hybridRankingService.getTotalPlayCountOptimized('sequence');
                    
                    if (totalPlayCount > 0) {
                        setPlayCounts(prev => ({
                            ...prev,
                            sequence: totalPlayCount
                        }));
                    } else {
                        throw new Error('Zero play count returned from cloud');
                    }
                } catch (error) {
                    console.error('❌ HomePage: Failed to get sequence total play count from cloud:', error);
                    
                    // クラウドが0件の場合はLocalStorageに依存せず0を表示
                    setPlayCounts(prev => ({
                        ...prev,
                        sequence: 0
                    }));
                }
            } catch (error) {
                console.error('Failed to load last results:', error);
            } finally {
                const endTime = performance.now();
                const loadTime = endTime - startTime;
                if (import.meta.env.DEV) {
                    console.log(`🚀 HomePage load time: ${loadTime.toFixed(2)}ms`);
                }
            }
        };

        loadLastResults();
    }, [gameHistoryService, hybridRankingService]);

    const location = useLocation();

    // トップランカーを取得（初回 + ページナビゲーション時）
    useEffect(() => {
        const loadTopPlayers = async () => {
            const startTime = performance.now();
            try {
                const topPlayers = await hybridRankingService.getAllTopPlayersOptimized();
                if (topPlayers.sequence) {
                }
                setTopPlayers(topPlayers);
            } catch (error) {
                console.error('❌ Failed to load top players:', error);
            } finally {
                const endTime = performance.now();
                const loadTime = endTime - startTime;
                if (import.meta.env.DEV) {
                    console.log(`🏆 Top players load time: ${loadTime.toFixed(2)}ms`);
                }
            }
        };

        loadTopPlayers();

    }, [location.pathname, hybridRankingService]); // ページ遷移時に再実行

    // 構造化データ（ホームページ用）
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "ハントレ",
        "description": "ハンタートレーニング専用サイト「ハントレ」。反射神経テスト、ターゲット追跡、狩猟動物診断でハンターのスキル向上をサポート",
        "url": "https://hantore.net",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "JPY"
        },
        "author": {
            "@type": "Organization",
            "name": "ハントレ開発チーム"
        },
        "keywords": "ハンタートレーニング,狩猟,射撃,反射神経,トレーニング,診断"
    };

    return (
        <div className="flex-1">
            <SEO 
                title="ハントレ - ハンタートレーニング・診断プラットフォーム"
                description="ハンタートレーニング専用サイト「ハントレ」。反射神経テスト、ターゲット追跡、狩猟動物診断でハンターのスキル向上をサポート"
                keywords="ハントレ,ハンタートレーニング,狩猟,射撃,ハンター,トレーニング,反射神経,診断,鳥獣"
                ogType="website"
                structuredData={structuredData}
            />
            {/* ヒーローセクション */}
            <div className="relative flex items-center justify-center py-12 px-4 min-h-[15vh] overflow-hidden hero-background">
                {/* グラデーションオーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-blue-300/40 to-transparent"></div>
                {/* 上から下へのブラックグラデーション（下に向かって透明に） */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-transparent"></div>
                {/* 薄いGlassmorphismレイヤー */}
                <div className="absolute inset-0 border-0"></div>
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    {/* パーティクル背景 */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* 第1層 - 大きめパーティクル */}
                        <div className="absolute w-3 h-3 bg-white/40 rounded-full animate-float top-1/4 left-1/4"></div>
                        <div className="absolute w-2.5 h-2.5 bg-blue-200/50 rounded-full animate-float-delayed top-1/3 right-1/3"></div>
                        <div className="absolute w-4 h-4 bg-white/30 rounded-full animate-float-slow top-2/3 left-1/2"></div>
                        <div className="absolute w-2 h-2 bg-white/50 rounded-full animate-float top-1/2 right-1/4"></div>
                        <div className="absolute w-3 h-3 bg-blue-100/40 rounded-full animate-float-delayed top-3/4 left-1/3"></div>
                        <div className="absolute w-2 h-2 bg-white/60 rounded-full animate-float-slow top-1/6 right-1/2"></div>
                        
                        {/* 第2層 - 中サイズパーティクル */}
                        <div className="absolute w-1.5 h-1.5 bg-white/50 rounded-full animate-float top-1/5 left-1/6"></div>
                        <div className="absolute w-2 h-2 bg-blue-300/40 rounded-full animate-float-delayed top-2/5 right-1/5"></div>
                        <div className="absolute w-1.5 h-1.5 bg-white/40 rounded-full animate-float-slow top-3/5 left-2/3"></div>
                        <div className="absolute w-2 h-2 bg-white/45 rounded-full animate-float top-4/5 right-2/5"></div>
                        <div className="absolute w-1.5 h-1.5 bg-blue-200/50 rounded-full animate-float-delayed top-1/8 left-3/4"></div>
                        <div className="absolute w-2 h-2 bg-white/35 rounded-full animate-float-slow top-7/8 right-1/6"></div>
                        
                        {/* 第3層 - 小サイズパーティクル */}
                        <div className="absolute w-1 h-1 bg-white/60 rounded-full animate-float top-1/10 left-1/10"></div>
                        <div className="absolute w-1 h-1 bg-blue-100/50 rounded-full animate-float-delayed top-3/10 right-1/10"></div>
                        <div className="absolute w-1 h-1 bg-white/45 rounded-full animate-float-slow top-5/10 left-4/5"></div>
                        <div className="absolute w-1 h-1 bg-white/55 rounded-full animate-float top-7/10 right-4/5"></div>
                        <div className="absolute w-1 h-1 bg-blue-200/45 rounded-full animate-float-delayed top-9/10 left-1/5"></div>
                        <div className="absolute w-1 h-1 bg-white/50 rounded-full animate-float-slow top-2/10 right-3/5"></div>
                        <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-float top-4/10 left-3/5"></div>
                        <div className="absolute w-1 h-1 bg-blue-300/40 rounded-full animate-float-delayed top-6/10 right-2/5"></div>
                        <div className="absolute w-1 h-1 bg-white/65 rounded-full animate-float-slow top-8/10 left-4/5"></div>
                        <div className="absolute w-1 h-1 bg-white/35 rounded-full animate-float top-1/12 right-1/8"></div>
                        
                        {/* 第4層 - 極小パーティクル */}
                        <div className="absolute w-0.5 h-0.5 bg-white/70 rounded-full animate-float-delayed top-1/7 left-2/7"></div>
                        <div className="absolute w-0.5 h-0.5 bg-blue-100/60 rounded-full animate-float-slow top-2/7 right-2/7"></div>
                        <div className="absolute w-0.5 h-0.5 bg-white/50 rounded-full animate-float top-3/7 left-5/7"></div>
                        <div className="absolute w-0.5 h-0.5 bg-white/60 rounded-full animate-float-delayed top-4/7 right-5/7"></div>
                        <div className="absolute w-0.5 h-0.5 bg-blue-200/50 rounded-full animate-float-slow top-5/7 left-1/7"></div>
                        <div className="absolute w-0.5 h-0.5 bg-white/55 rounded-full animate-float top-6/7 right-1/7"></div>
                    </div>
                    
                    <h1 className="relative text-2xl md:text-3xl text-white font-bold mb-4 drop-shadow-lg">
                        狩猟感覚を、遊びながら鍛える<br />
                        <span className="text-sm">ハンターのためのオンライントレーニング</span>
                    </h1>
                </div>
            </div>

            {/* お知らせセクション */}
            <NoticeSection notices={memoizedNotices} />

                        {/* ゲーム選択セクション */}
            <div className="py-4 px-4">
                <div className="max-w-6xl mx-auto">


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 反射神経トレーニング */}
                        <GameCard
                            key={gameCardConfigs[0].gameType}
                            title={gameCardConfigs[0].title}
                            description={gameCardConfigs[0].description}
                            icon={<></>}
                            path={gameCardConfigs[0].path}
                            lastResult={lastResults[gameCardConfigs[0].gameType]}
                            imageSrc={gameCardConfigs[0].imageSrc}
                            playCount={playCounts[gameCardConfigs[0].gameType]}
                            topPlayer={topPlayers[gameCardConfigs[0].gameType]}
                        />
                        
                        {/* 広告カード */}
                        <AdCard />
                        
                        {/* ターゲット追跡トレーニング */}
                        <GameCard
                            key={gameCardConfigs[1].gameType}
                            title={gameCardConfigs[1].title}
                            description={gameCardConfigs[1].description}
                            icon={<></>}
                            path={gameCardConfigs[1].path}
                            lastResult={lastResults[gameCardConfigs[1].gameType]}
                            imageSrc={gameCardConfigs[1].imageSrc}
                            playCount={playCounts[gameCardConfigs[1].gameType]}
                            topPlayer={topPlayers[gameCardConfigs[1].gameType]}
                        />
                    </div>
                    
                    {/* 2行目: カウントアップ・トレーニング */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                        <GameCard
                            key={gameCardConfigs[2].gameType}
                            title={gameCardConfigs[2].title}
                            description={gameCardConfigs[2].description}
                            icon={<></>}
                            path={gameCardConfigs[2].path}
                            lastResult={lastResults[gameCardConfigs[2].gameType]}
                            imageSrc={gameCardConfigs[2].imageSrc}
                            playCount={playCounts[gameCardConfigs[2].gameType]}
                            topPlayer={topPlayers[gameCardConfigs[2].gameType]}
                        />
                        
                        {/* 狩猟鳥獣クイズ */}
                        <GameCard
                            title="狩猟鳥獣クイズ（獣類）"
                            description={
                                <div className="space-y-3">
                                    <p className="text-gray-700 leading-relaxed">
                                    狩猟鳥獣（獣類）は20種類。それらの画像を見て狩猟動物を識別するクイズトレーニング。
                                        <span className="font-semibold text-blue-600">狩猟免許の取得</span>に必要な知識を身につけましょう。
                                    </p>
                                    <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-green-700">全16問</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-green-600">4択選択式</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        ※ノイヌ、ノネコ、シベリアイタチは除外。ユキウサギ・ノウサギはひとつにしたため、全部で16問です。
                                    </p>
                                </div>
                            }
                            icon={<></>}
                            path="/animal-quiz/instructions"
                            lastResult={undefined}
                            imageSrc={panel5}
                            playCount={0}
                            topPlayer={undefined}
                        />
                    </div>

                    {/* 初期リリース対象外: 新しいゲーム（開発中）をコメントアウト */}
                    {/* <div className="mt-12">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {developingGameConfigs.slice(0, 2).map((config, index) => (
                                <GameCard
                                    key={`developing-${index}`}
                                    title={config.title}
                                    description={config.description}
                                    icon={<></>}
                                    path={config.path}
                                    lastResult={undefined}
                                    imageSrc={undefined}
                                    playCount={0}
                                    topPlayer={undefined}
                                    isComingSoon={config.isComingSoon}
                                />
                            ))}
                        </div>
                    </div> */}
                </div>
            </div>

            {/* 初期リリース対象外: 狩猟動物診断セクションをコメントアウト */}
            {/* <div className="bg-white py-16 px-4">
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
                            imageSrc={panel4}
                        />
                    </div>
                </div>
            </div> */}

            {/* 特徴セクション */}
            <div className="py-12 px-4">
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