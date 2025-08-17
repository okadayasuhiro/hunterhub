import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ExternalLink } from 'lucide-react';
import { UserIdentificationService } from '../services/userIdentificationService';
import XAuthService from '../services/xAuthService';

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
    const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
    
    const userService = UserIdentificationService.getInstance();

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
                setDisplayName(name);
                setIsXLinked(linked);
            } catch (error) {
                console.error('Failed to load user info:', error);
            }
        };
        
        loadUserInfo();
    }, [userService]);

    // 実際のX OAuth連携
    const handleXLink = async () => {
        console.log('🔧 X Link button clicked, isXLinked:', isXLinked);
        
        if (isXLinked) {
            // 連携解除
            await userService.unlinkXAccount();
            const newName = await userService.getDisplayName();
            setDisplayName(newName);
            setIsXLinked(false);
            alert('X連携を解除しました。ランキングが更新されます。');
            
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

    return (
        <header className="w-full glass-card border-0 border-b border-white/20 relative z-[10000]" style={{ margin: 0, padding: 0 }}>
            {/* メニュー外クリックで閉じる */}
            {showUserMenu && (
                <div 
                    className="fixed inset-0 z-[9998]" 
                    onClick={() => setShowUserMenu(false)}
                />
            )}
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
                                className="flex items-center px-3 py-2 glass-light text-slate-700 rounded-lg hover:bg-white/30 transition-all duration-200"
                            >
                                <User className="w-4 h-4 mr-2" />
                                {displayName}
                                {isXLinked && <ExternalLink className="w-3 h-3 ml-1 text-blue-500" />}
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
                                            console.log('🔧 Button clicked!');
                                            alert('ボタンがクリックされました！');
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
                        <div className="text-slate-600 text-sm">
                            狩猟者向け反射神経トレーニング
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header; 