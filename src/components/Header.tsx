import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
    onHomeClick?: () => void;
    showBackButton?: boolean;
    onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, showBackButton, onBackClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

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

    return (
        <header className="w-full" style={{ backgroundColor: '#006cc1', margin: 0, padding: 0 }}>
            <div className="w-full px-4 py-4" style={{ margin: 0 }}>
                <div className="flex items-center justify-between">
                    {/* ロゴ部分 */}
                    <div
                        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleHomeClick}
                    >
                        <h1 className="text-2xl font-bold text-white">HunterHub</h1>
                    </div>

                    {/* ナビゲーション部分 */}
                    <div className="flex items-center space-x-4">
                        {shouldShowBackButton && (
                            <button
                                onClick={handleBackClick}
                                className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all duration-200"
                            >
                                <span className="mr-2">←</span>
                                戻る
                            </button>
                        )}
                        <div className="text-white text-sm">
                            狩猟者向け反射神経トレーニング
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header; 