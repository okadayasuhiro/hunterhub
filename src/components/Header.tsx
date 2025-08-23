import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ExternalLink, Menu, X, Share2, FileText, Shield, CircleArrowRight } from 'lucide-react';
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
    const [xDisplayName, setXDisplayName] = useState<string>('');
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
        { name: '狩猟動物診断', path: '/diagnosis', gameType: 'diagnosis', showStats: false },
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

    // 戻るボタンは表示しない（ハンバーガーメニューで代替）
    const shouldShowBackButton = false;

        // ユーザー情報を取得
    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                const name = await userService.getDisplayName();
                const linked = await userService.isXLinked();
                const profileImageUrl = await userService.getXProfileImageUrl();
                const xName = linked ? await userService.getXDisplayName() : '';
                setDisplayName(name);
                setIsXLinked(linked);
                setXProfileImageUrl(profileImageUrl || '');
                setXDisplayName(xName || '');
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
            setXDisplayName(''); // Xディスプレイ名もクリア
            
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
                    
                    // 現在ユーザーの全プレイ記録数を取得（LocalStorageから）
                    let userPlayCount = 0;
                    try {
                        // ハンバーガーメニューでは正確な方法（LocalStorage）を維持
                        const allScores = JSON.parse(localStorage.getItem('hunterhub_global_scores') || '[]');
                        const userScores = allScores.filter((score: any) => 
                            score.userId === currentUserId && score.gameType === game.gameType
                        );
                        userPlayCount = userScores.length;
                        console.log(`🔍 Header: ${game.gameType} play count from localStorage:`, userPlayCount);
                    } catch (localStorageError) {
                        console.error('LocalStorage access error:', localStorageError);
                        userPlayCount = 0;
                    }
                    
                    // 統計情報を保存
                    
                    stats[game.gameType] = {
                        playCount: userPlayCount,
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
            <div className={`fixed top-0 right-0 h-full w-80 hero-background border border-blue-200/30 shadow-2xl transform transition-transform duration-300 ease-in-out z-[10002] flex flex-col ${
                showHamburgerMenu ? 'translate-x-0' : 'translate-x-full'
            }`}>
                {/* ヒーローパネルと同じグラデーションオーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-blue-300/40 to-transparent"></div>
                {/* 半透明オーバーレイ */}
                <div className="absolute inset-0 bg-black/20"></div>
                {/* メニューヘッダー */}
                <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/30">
                    <h2 className="text-xl font-bold text-white">ゲーム一覧</h2>
                    <button
                        onClick={() => setShowHamburgerMenu(false)}
                        className="flex items-center justify-center w-8 h-8 text-white hover:text-white hover:bg-white/20 rounded-full transition-colors duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* メニュー項目 */}
                <div className="relative z-10 flex-1 overflow-y-auto flex flex-col">
                    {/* ゲームセクション */}
                    <div className="py-2">

                        {gameLinksWithStats.map((game) => (
                            <button
                                key={game.path}
                                onClick={() => handleGameLinkClick(game.path)}
                                className="w-full text-left px-6 py-3 text-white hover:bg-white/20 border-b border-white/20 transition-colors duration-200 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white group-hover:text-blue-100 transition-colors duration-200">
                                            {game.name}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-white/80">
                                        {game.showStats && (
                                            <>
                                                {gameStats[game.gameType] ? (
                                                    gameStats[game.gameType].playCount > 0 ? (
                                                        <>
                                                            <span>{gameStats[game.gameType].playCount}plays</span>
                                                            {gameStats[game.gameType].rank && (
                                                                <span className="text-yellow-200 font-medium">
                                                                    {gameStats[game.gameType].rank}位
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-orange-200">未プレイ</span>
                                                    )
                                                ) : (
                                                    <span className="text-white/60">読み込み中...</span>
                                                )}
                                            </>
                                        )}
                                        <CircleArrowRight className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-200" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* SNSシェアセクション */}
                    <div className="py-2">
                        <div className="px-6 py-3">
                            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide flex items-center">
                                <Share2 className="w-4 h-4 mr-2" />
                                シェア
                            </h3>
                        </div>
                        <div className="px-6 pb-4 pt-2">
                            <div className="flex justify-center space-x-3">
                                {/* X (Twitter) */}
                                <button
                                    onClick={() => handleShareClick('shareX')}
                                    className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-10 h-10"
                                    title="Xでシェア"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                </button>

                                {/* Facebook */}
                                <button
                                    onClick={() => handleShareClick('shareFacebook')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-10 h-10"
                                    title="Facebookでシェア"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </button>

                                {/* LINE */}
                                <button
                                    onClick={() => handleShareClick('shareLine')}
                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-10 h-10"
                                    title="LINEでシェア"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                                    </svg>
                                </button>


                                {/* クリップボードコピー */}
                                <button
                                    onClick={() => handleShareClick('copyLink')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-10 h-10"
                                    title="URLをコピー"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* スペーサー（法的文書を下部に押し下げ） */}
                    <div className="flex-1"></div>

                    {/* 法的文書セクション（最下部） */}
                    <div className="py-2 border-t border-white/20 mt-auto">
                        {legalLinks.map((legal) => (
                            <button
                                key={legal.path}
                                onClick={() => handleGameLinkClick(legal.path)}
                                className="w-full text-left px-6 py-3 text-white hover:bg-white/20 transition-colors duration-200 group"
                            >
                                <div className="flex items-center">
                                    <legal.icon className="w-4 h-4 mr-3 text-white/80 group-hover:text-white transition-colors duration-200" />
                                    <span className="font-medium group-hover:text-blue-100 transition-colors duration-200">
                                        {legal.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        <header className="w-full glass-card border-0 border-b border-white/20 relative z-[10000]" style={{ margin: 0, padding: 0 }}>
            <div className="w-full px-4" style={{ margin: 0, paddingTop: '8px', paddingBottom: '8px' }}>
                <div className="flex items-center justify-between">
                    {/* ロゴ部分 */}
                    <div
                        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleHomeClick}
                    >
                        <img 
                            src="/images/logo-w.png" 
                            alt="HunterHub" 
                            className="h-8"
                        />
                    </div>

                    {/* ナビゲーション部分 */}
                    <div className="flex items-center">
                        {/* ユーザーメニュー */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center justify-center text-white transition-all duration-200 relative"
                                style={{ 
                                    width: '60px',
                                    height: '58px',
                                    marginTop: '-9px',
                                    marginBottom: '-9px',
                                    backgroundColor: isXLinked ? 'transparent' : '#6b7280'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isXLinked ? 'rgba(255, 255, 255, 0.1)' : '#4b5563'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isXLinked ? 'transparent' : '#6b7280'}
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
                                                    parent.innerHTML = '<div class="w-8 h-8 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    // X未連携：人形アイコンを表示
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>


                            {/* ユーザーメニュードロップダウン */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[10001]">
                                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                                        {isXLinked ? (xDisplayName || 'X連携中') : displayName}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleXLink();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm flex items-center transition-colors duration-200 bg-black text-white hover:bg-gray-800"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        {isXLinked ? 'X連携を解除' : 'Xと連携'}
                                    </button>
                                    
                                    {/* X連携の説明文 */}
                                    {!isXLinked ? (
                                        <div className="px-4 py-3 text-xs text-gray-600 bg-gray-50 border-t">
                                            <p className="mb-2">
                                                X連携すると、アイコンとXのディスプレイ名を取得します。ランキングの名前がXの名前に変わります。
                                            </p>
                                            <p className="text-gray-600">
                                                それ以外の情報にはアクセスしませんので、ご安心ください。また、解除はいつでも可能です。
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 text-xs text-gray-600 bg-gray-50 border-t">
                                            <p className="text-gray-600">
                                                X連携を解除しても、過去の記録は削除されませんので、ご安心ください。
                                            </p>
                                        </div>
                                    )}
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
                                className="flex items-center justify-center text-white transition-all duration-200"
                                style={{ 
                                    width: '60px',
                                    height: '58px',
                                    marginTop: '-9px',
                                    marginBottom: '-9px',
                                    marginRight: '-17px',
                                    backgroundColor: '#2f76ac'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#285f8a'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2f76ac'}
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