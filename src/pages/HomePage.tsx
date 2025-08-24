import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Crosshair, Hash, Target, Compass, Clock, Trophy, Crown, Bell, Calendar } from 'lucide-react';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory } from '../types/game';
import { STORAGE_KEYS } from '../types/game';
import { HybridRankingService } from '../services/hybridRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import type { RankingEntry } from '../services/localRankingService';
import { UserIdentificationService } from '../services/userIdentificationService';
import panel1 from '../assets/images/panel1.png';
import panel2 from '../assets/images/panel2.png';
import panel3 from '../assets/images/panel3.png';
import panel4 from '../assets/images/panel4.png';

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

const GameCard: React.FC<GameCardProps> = ({ title, description, icon, path, lastResult, imageSrc, playCount, topPlayer, isComingSoon = false }) => {
    const navigate = useNavigate();
    

    
    // 診断系ゲーム・クイズ系ゲームかどうかを判定（ランキング・記録を表示しない）
    const isDiagnosisGame = title.includes('診断') || title.includes('クイズ');

    const handleClick = () => {
        if (isComingSoon) {
            // Coming Soonの場合はクリック無効
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
                <div className="h-40 relative bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-3xl mb-2">🚧</div>
                        <div className="text-lg font-semibold text-gray-600">Now developing...</div>
                    </div>
                </div>
            ) : imageSrc && (
                <div className="h-40 relative">
                    <img src={imageSrc} alt="panel" className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105" />
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
            <div className="text-left p-6">
                <div className="mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">
                        {title}
                    </h3>
                </div>
                <p className="text-gray-600 font-normal leading-relaxed mb-6">
                    {description}
                </p>
                
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

    // ゲーム履歴から各ゲームの最新記録を取得
    useEffect(() => {
        const loadLastResults = async () => {
            try {
                const gameHistoryService = GameHistoryService.getInstance();
                
                // 初回ロード時にLocalStorageからクラウドへ移行
                console.log('Starting migration from LocalStorage to cloud...');
                await gameHistoryService.migrateLocalToCloud();

                // 反射神経テストの最新記録
                const reflexLatest = await gameHistoryService.getLatestGameHistory<ReflexGameHistory>('reflex');
                console.log('🔍 Reflex latest game history:', reflexLatest);
                if (reflexLatest) {
                    console.log('DEBUG Raw averageTime:', reflexLatest.averageTime);
                    console.log('DEBUG Converted to seconds:', (reflexLatest.averageTime / 1000).toFixed(5));
                    console.log('DEBUG Success rate:', reflexLatest.successRate);
                    
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
                    const hybridRankingService = HybridRankingService.getInstance();
                    console.log(`🔍 HomePage: Getting reflex total play count...`);
                    const totalPlayCount = await hybridRankingService.getTotalPlayCount('reflex');
                    console.log(`🔍 HomePage: reflex total play count result:`, totalPlayCount);
                    
                    if (totalPlayCount > 0) {
                        console.log(`✅ HomePage: Successfully got reflex play count: ${totalPlayCount}`);
                        setPlayCounts(prev => ({
                            ...prev,
                            reflex: totalPlayCount
                        }));
                    } else {
                        console.warn(`⚠️ HomePage: Got 0 play count for reflex, trying fallback`);
                        throw new Error('Zero play count returned from cloud');
                    }
                } catch (error) {
                    console.error('❌ HomePage: Failed to get reflex total play count from cloud:', error);
                    console.error('Error details:', error);
                    
                    // クラウドが0件の場合はLocalStorageに依存せず0を表示
                    console.log(`🧹 HomePage: Cloud returned 0, showing 0 for reflex (ignoring localStorage)`);
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
                    const hybridRankingService = HybridRankingService.getInstance();
                    console.log(`🔍 HomePage: Getting target total play count...`);
                    const totalPlayCount = await hybridRankingService.getTotalPlayCount('target');
                    console.log(`🔍 HomePage: target total play count result:`, totalPlayCount);
                    
                    if (totalPlayCount > 0) {
                        console.log(`✅ HomePage: Successfully got target play count: ${totalPlayCount}`);
                        setPlayCounts(prev => ({
                            ...prev,
                            target: totalPlayCount
                        }));
                    } else {
                        console.warn(`⚠️ HomePage: Got 0 play count for target, trying fallback`);
                        throw new Error('Zero play count returned from cloud');
                    }
                } catch (error) {
                    console.error('❌ HomePage: Failed to get target total play count from cloud:', error);
                    console.error('Error details:', error);
                    
                    // クラウドが0件の場合はLocalStorageに依存せず0を表示
                    console.log(`🧹 HomePage: Cloud returned 0, showing 0 for target (ignoring localStorage)`);
                    setPlayCounts(prev => ({
                        ...prev,
                        target: 0
                    }));
                }

                // 数字順序ゲームの最新記録（回避策：全履歴から最新を取得）
                const sequenceHistory = await gameHistoryService.getGameHistory<SequenceGameHistory>('sequence');
                const sequenceLatest = sequenceHistory.length > 0 ? sequenceHistory[0] : null;
                console.log('🔍 Sequence latest game history:', sequenceLatest);
                if (sequenceLatest) {
                    console.log('🔍 Sequence completionTime type:', typeof sequenceLatest.completionTime, 'value:', sequenceLatest.completionTime);
                    setLastResults(prev => ({
                        ...prev,
                        sequence: {
                            primaryStat: '完了時間',
                            primaryValue: `${sequenceLatest.completionTime.toFixed(3)}s`, // 修正: 既に秒単位
                            secondaryStat: '平均クリック間隔',
                            secondaryValue: `${sequenceLatest.averageClickInterval.toFixed(3)}s`,
                            date: new Date(sequenceLatest.date).toLocaleDateString('ja-JP')
                        }
                    }));
                }
                
                // プレイ回数を設定（クラウドから全ユーザーの総プレイ回数を取得）
                // ユーザーの履歴の有無に関係なく実行
                try {
                    const hybridRankingService = HybridRankingService.getInstance();
                    console.log(`🔍 HomePage: Getting sequence total play count...`);
                    const totalPlayCount = await hybridRankingService.getTotalPlayCount('sequence');
                    console.log(`🔍 HomePage: sequence total play count result:`, totalPlayCount);
                    
                    if (totalPlayCount > 0) {
                        console.log(`✅ HomePage: Successfully got sequence play count: ${totalPlayCount}`);
                        setPlayCounts(prev => ({
                            ...prev,
                            sequence: totalPlayCount
                        }));
                    } else {
                        console.warn(`⚠️ HomePage: Got 0 play count for sequence, trying fallback`);
                        throw new Error('Zero play count returned from cloud');
                    }
                } catch (error) {
                    console.error('❌ HomePage: Failed to get sequence total play count from cloud:', error);
                    console.error('Error details:', error);
                    
                    // クラウドが0件の場合はLocalStorageに依存せず0を表示
                    console.log(`🧹 HomePage: Cloud returned 0, showing 0 for sequence (ignoring localStorage)`);
                    setPlayCounts(prev => ({
                        ...prev,
                        sequence: 0
                    }));
                }
            } catch (error) {
                console.error('Failed to load last results:', error);
            }
        };

        loadLastResults();
    }, []);

    const location = useLocation();

    // トップランカーを取得（初回 + ページナビゲーション時）
    useEffect(() => {
        const loadTopPlayers = async () => {
            try {
                const rankingService = HybridRankingService.getInstance();
                const topPlayers = await rankingService.getAllTopPlayers();
                console.log('🔍 Top players data:', topPlayers);
                if (topPlayers.sequence) {
                    console.log('🔍 Sequence top player score type:', typeof topPlayers.sequence.score, 'value:', topPlayers.sequence.score);
                }
                setTopPlayers(topPlayers);
            } catch (error) {
                console.error('❌ Failed to load top players:', error);
            }
        };

        loadTopPlayers();

    }, [location.pathname]); // ページ遷移時に再実行

    return (
        <div className="flex-1">
            {/* ヒーローセクション */}
            <div className="relative flex items-center justify-center py-12 px-4 min-h-[15vh] overflow-hidden hero-background">
                {/* グラデーションオーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-blue-300/40 to-transparent"></div>
                {/* 半透明黒オーバーレイでテキスト可読性UP */}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <p className="text-xl md:text-2xl text-white font-light mb-4 drop-shadow-lg font-bold">
                        狩猟ハンターのトレーニング<br />ハンター達のための遊び場
                    </p>
                </div>
            </div>

            {/* お知らせセクション */}
            <NoticeSection notices={notices} />

                        {/* ゲーム選択セクション */}
            <div className="py-4 px-4">
                <div className="max-w-6xl mx-auto">


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <GameCard
                            title="反射神経トレーニング"
                            description="緑から赤への色変化に素早く反応して、クリックしてください。赤になる前にクリックするとフライング！"
                            icon={<></>}
                            path="/reflex/instructions"
                            lastResult={lastResults.reflex}
                            imageSrc={ENABLE_REFLEX_PANEL ? panel1 : undefined}
                            playCount={playCounts.reflex}
                            topPlayer={topPlayers.reflex}
                        />
                        <GameCard
                            title="ターゲット追跡トレーニング"
                            description="画面上の標的を順番にクリック！10個のターゲットを順番に撃ち抜き、反応時間と総合時間を測定します。"
                            icon={<></>}
                            path="/target/instructions"
                            lastResult={lastResults.target}
                            imageSrc={ENABLE_TARGET_PANEL ? panel2 : undefined}
                            playCount={playCounts.target}
                            topPlayer={topPlayers.target}
                        />
                        <GameCard
                            title="カウントアップ・トレーニング"
                            description="画面上にランダムに配置された数字を小さい順にクリックします！反応時間と総合時間を競います。"
                            icon={<></>}
                            path="/sequence/instructions"
                            lastResult={lastResults.sequence}
                            imageSrc={ENABLE_SEQUENCE_PANEL ? panel3 : undefined}
                            playCount={playCounts.sequence}
                            topPlayer={topPlayers.sequence}
                        />
                        <GameCard
                            title="狩猟鳥獣クイズ（獣類）"
                            description={
                                <>
                                    20種の狩猟動物を識別するクイズゲーム。<br />
                                    画像を見て動物名をテキスト入力で回答してください。
                                </>
                            }
                            icon={<></>}
                            path="/animal-quiz/instructions"
                            lastResult={undefined}
                            imageSrc="/src/assets/images/panel5.png"
                            playCount={0}
                            topPlayer={undefined}
                            />
                    </div>

                    {/* 新しいゲーム（開発中） */}
                    <div className="mt-12">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            <GameCard
                                title="動物識別記憶"
                                description="瞬間的に表示される動物を正確に識別・記憶するゲームです。狩猟知識と記憶力を同時に鍛えます。"
                                icon={<></>}
                                path="#"
                                lastResult={undefined}
                                imageSrc={undefined}
                                playCount={0}
                                topPlayer={undefined}
                                isComingSoon={true}
                            />
                            <GameCard
                                title="足跡追跡記憶"
                                description="様々な動物の足跡パターンを記憶し、正確に識別するトラッキングスキルを向上させます。"
                                icon={<></>}
                                path="#"
                                lastResult={undefined}
                                imageSrc={undefined}
                                playCount={0}
                                topPlayer={undefined}
                                isComingSoon={true}
                            />
                        </div>
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
                            imageSrc={panel4}
                        />
                    </div>
                </div>
            </div>

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