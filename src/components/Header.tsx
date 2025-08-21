import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ExternalLink, Menu, X, Share2, FileText, Shield } from 'lucide-react';
import { UserIdentificationService } from '../services/userIdentificationService';
import XAuthService from '../services/xAuthService';
import { HybridRankingService } from '../services/hybridRankingService';

interface HeaderProps {
    onHomeClick?: () => void;
    showBackButton?: boolean;
    onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, showBackButton, onBackClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [displayName, setDisplayName] = useState<string>('');
    const [isXLinked, setIsXLinked] = useState<boolean>(false);
    const [xProfileImageUrl, setXProfileImageUrl] = useState<string>('');
    const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
    const [showHamburgerMenu, setShowHamburgerMenu] = useState<boolean>(false);
    const [gameStats, setGameStats] = useState<{[key: string]: {playCount: number, rank: number | null}}>({});
    
    const userService = UserIdentificationService.getInstance();

    // ゲームリスト定義（統計情報付き）
    const gameLinksWithStats = [
        { name: '反射神経テスト', path: '/reflex/instructions', gameType: 'reflex', showStats: true },
        { name: 'ターゲット追跡', path: '/target/instructions', gameType: 'target', showStats: true },
        { name: '数字順序ゲーム', path: '/sequence/instructions', gameType: 'sequence', showStats: true },
        { name: '狩猟動物クイズ', path: '/animal-quiz/instructions', gameType: 'quiz', showStats: false },
    ];

    // SNSシェアリンク
    const shareLinks = [
        { name: 'X (Twitter)', path: '#', action: 'shareX', icon: '𝕏' },
        { name: 'Facebook', path: '#', action: 'shareFacebook', icon: '📘' },
        { name: 'LINE', path: '#', action: 'shareLine', icon: '💬' },
    ];

    // 法的文書リンク
    const legalLinks = [
        { name: '利用規約', path: '/terms', icon: FileText },
        { name: 'プライバシーポリシー', path: '/privacy', icon: Shield },
    ];

    const handleHomeClick = () => {
        if (onHomeClick) {
            onHomeClick();
        } else {
            navigate('/');
        }
    };

    const handleBackClick = () => {
        if (onBackClick) {
            onBackClick();
        } else {
            navigate(-1); // ブラウザの戻る機能
        }
    };

    // 現在のパスに基づいて戻るボタンの表示を決定
    const shouldShowBackButton = showBackButton || location.pathname !== '/';

        // ユーザー情報を取得
    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                const name = await userService.getDisplayName();
                const linked = await userService.isXLinked();
                const profileImageUrl = await userService.getXProfileImageUrl();
                setDisplayName(name);
                setIsXLinked(linked);
                setXProfileImageUrl(profileImageUrl || '');
            } catch (error) {
                console.error('Failed to load user info:', error);
            }
        };

        loadUserInfo();
        loadGameStats();
    }, [userService]);

    // ハンバーガーメニューが開かれた時にも統計を更新
    useEffect(() => {
        if (showHamburgerMenu) {
            loadGameStats();
        }
    }, [showHamburgerMenu]);

    // 実際のX OAuth連携
    const handleXLink = async () => {
        console.log('🔧 X Link button clicked, isXLinked:', isXLinked);
        
        if (isXLinked) {
            // 連携解除
            await userService.unlinkXAccount();
            const newName = await userService.getDisplayName();
            setDisplayName(newName);
            setIsXLinked(false);
            setXProfileImageUrl(''); // プロフィール画像もクリア
            
            // ランキング表示を確実に更新するため、少し遅延してページリフレッシュ
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            // X OAuth認証フローを開始
            console.log('🔧 Starting X OAuth flow...');
            const xAuthService = XAuthService.getInstance();
            await xAuthService.startAuthFlow();
        }
        setShowUserMenu(false);
    };

    // ゲーム統計情報を取得
    const loadGameStats = async () => {
        const stats: {[key: string]: {playCount: number, rank: number | null}} = {};
        
        try {
            const currentUserId = await userService.getCurrentUserId();
            // ハンバーガーメニュー統計情報を取得
            
            for (let i = 0; i < gameLinksWithStats.length; i++) {
                try {
                    const game = gameLinksWithStats[i];
                    if (!game || !game.showStats || !game.gameType) {
                        continue;
                    }
                    
                    // ランキングサービスから統計情報を取得
                    const hybridRankingService = HybridRankingService.getInstance();
                    const rankings = await hybridRankingService.getRankings(game.gameType, 1000);
                    
                    // 統計情報を処理
                    
                    // 現在ユーザーのランク情報を取得（userRankから）
                    const userRank = rankings.userRank;
                    
                    // 現在ユーザーの全プレイ記録数を取得（LocalStorageから直接）
                    let userScores: any[] = [];
                    try {
                        const allScores = JSON.parse(localStorage.getItem('hunterhub_global_scores') || '[]');
                        userScores = allScores.filter((score: any) => 
                            score.userId === currentUserId && score.gameType === game.gameType
                        );
                    } catch (localStorageError) {
                        console.error('LocalStorage access error:', localStorageError);
                        userScores = [];
                    }
                    
                    // 統計情報を保存
                    
                    stats[game.gameType] = {
                        playCount: userScores.length,
                        rank: userRank ? userRank.rank : null
                    };
                } catch (error) {
                    console.error('Error loading game stats:', error);
                    // エラーが発生した場合は無視して次へ
                }
            }
        } catch (error) {
            console.error('Error getting current user ID:', error);
            // デフォルト値を設定
            for (let i = 0; i < gameLinksWithStats.length; i++) {
                const game = gameLinksWithStats[i];
                if (game && game.showStats) {
                    stats[game.gameType] = { playCount: 0, rank: null };
                }
            }
        }
        
        setGameStats(stats);
    };

    // ハンバーガーメニューの処理
    const handleGameLinkClick = (path: string) => {
        navigate(path);
        setShowHamburgerMenu(false);
    };

    // SNSシェア処理
    const handleShareClick = (action: string) => {
        const url = window.location.origin;
        const text = 'HunterHub - 狩猟者向け反射神経・集中力トレーニング';
        
        switch (action) {
            case 'shareX':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'shareFacebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'shareLine':
                window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank');
                break;
        }
        setShowHamburgerMenu(false);
    };

    return (
        <>
            {/* ハンバーガーメニュー用透過黒背景オーバーレイ */}
            {showHamburgerMenu && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out z-[9999]" 
                    onClick={() => setShowHamburgerMenu(false)}
                />
            )}

            {/* ユーザーメニュー用外クリック処理 */}
            {showUserMenu && !showHamburgerMenu && (
                <div 
                    className="fixed inset-0 z-[9998]" 
                    onClick={() => setShowUserMenu(false)}
                />
            )}

            {/* 右端スライドメニュー */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[10002] ${
                showHamburgerMenu ? 'translate-x-0' : 'translate-x-full'
            }`}>
                {/* メニューヘッダー */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">ゲーム一覧</h2>
                    <button
                        onClick={() => setShowHamburgerMenu(false)}
                        className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* メニュー項目 */}
                <div className="flex-1 overflow-y-auto">
                    {/* ゲームセクション */}
                    <div className="py-2">
                        <div className="px-6 py-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">ゲーム</h3>
                        </div>
                        {gameLinksWithStats.map((game) => (
                            <button
                                key={game.path}
                                onClick={() => handleGameLinkClick(game.path)}
                                className="w-full text-left px-6 py-4 text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors duration-200 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                                            {game.name}
                                        </div>
                                        {game.showStats && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {gameStats[game.gameType] ? (
                                                    gameStats[game.gameType].playCount > 0 ? (
                                                        <>
                                                            {gameStats[game.gameType].playCount}回プレイ
                                                            {gameStats[game.gameType].rank && (
                                                                <span className="ml-2 text-blue-600 font-medium">
                                                                    #{gameStats[game.gameType].rank}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-orange-500">未プレイ</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400">読み込み中...</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-gray-400 group-hover:text-blue-600 transition-colors duration-200 ml-3">→</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* SNSシェアセクション */}
                    <div className="py-2 border-t border-gray-200">
                        <div className="px-6 py-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center">
                                <Share2 className="w-4 h-4 mr-2" />
                                シェア
                            </h3>
                        </div>
                        {shareLinks.map((share) => (
                            <button
                                key={share.action}
                                onClick={() => handleShareClick(share.action)}
                                className="w-full text-left px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200 group"
                            >
                                <div className="flex items-center">
                                    <span className="text-lg mr-3">{share.icon}</span>
                                    <span className="font-medium group-hover:text-blue-600 transition-colors duration-200">
                                        {share.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* 法的文書セクション */}
                    <div className="py-2 border-t border-gray-200">
                        <div className="px-6 py-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">情報</h3>
                        </div>
                        {legalLinks.map((legal) => (
                            <button
                                key={legal.path}
                                onClick={() => handleGameLinkClick(legal.path)}
                                className="w-full text-left px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200 group"
                            >
                                <div className="flex items-center">
                                    <legal.icon className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
                                    <span className="font-medium group-hover:text-blue-600 transition-colors duration-200">
                                        {legal.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        <header className="w-full glass-card border-0 border-b border-white/20 relative z-[10000]" style={{ margin: 0, padding: 0 }}>
            <div className="w-full px-4 py-4" style={{ margin: 0 }}>
                <div className="flex items-center justify-between">
                    {/* ロゴ部分 */}
                    <div
                        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleHomeClick}
                    >
                        <h1 className="text-2xl font-bold text-slate-700">HunterHub</h1>
                    </div>

                    {/* ナビゲーション部分 */}
                    <div className="flex items-center space-x-4">
                        {/* ユーザーメニュー */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center justify-center w-10 h-10 glass-light text-slate-700 rounded-full hover:bg-white/30 transition-all duration-200 relative"
                                title={displayName}
                            >
                                {isXLinked && xProfileImageUrl ? (
                                    // X連携済み：X連携画像を表示
                                    <div className="w-8 h-8 rounded-full overflow-hidden">
                                        <img 
                                            src={xProfileImageUrl}
                                            alt="X profile icon"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // 画像読み込み失敗時は人形アイコンにフォールバック
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = '<div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    // X未連携：人形アイコンを表示
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                )}
                                {isXLinked && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <ExternalLink className="w-2 h-2 text-white" />
                                    </div>
                                )}
                            </button>

                            {/* ユーザーメニュードロップダウン */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[10001]">
                                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                                        {isXLinked ? 'X連携中' : 'ハンター名'}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleXLink();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        {isXLinked ? 'X連携を解除' : 'Xと連携（テスト）'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {shouldShowBackButton && (
                            <button
                                onClick={handleBackClick}
                                className="flex items-center px-4 py-2 glass-light text-slate-700 rounded-lg hover:bg-white/30 transition-all duration-200"
                            >
                                <span className="mr-2">←</span>
                                戻る
                            </button>
                        )}

                        {/* ハンバーガーメニュー */}
                        <div className="relative">
                            <button
                                onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                                className="flex items-center justify-center w-10 h-10 glass-light text-slate-700 rounded-lg hover:bg-white/30 transition-all duration-200"
                                title="メニュー"
                            >
                                {showHamburgerMenu ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </button>


                        </div>
                    </div>
                </div>
            </div>
        </header>
        </>
    );
};

export default Header; 