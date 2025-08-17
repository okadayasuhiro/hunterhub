import React from 'react';
import { X, Trophy } from 'lucide-react';

interface XLinkPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLinkX: () => void;
    playerName: string;
    gameType: string;
    score: number;
}

const XLinkPromptModal: React.FC<XLinkPromptModalProps> = ({
    isOpen,
    onClose,
    onLinkX,
    playerName,
    gameType,
    score
}) => {
        if (!isOpen) {
        return null;
    }

    const getGameDisplayName = (type: string) => {
        switch (type) {
            case 'reflex': return '反射神経テスト';
            case 'target': return 'ターゲット追跡';
            case 'sequence': return '数字順序ゲーム';
            default: return 'ゲーム';
        }
    };

    const getScoreUnit = (type: string) => {
        switch (type) {
            case 'reflex': return 'ms';
            case 'target': return 'ms';
            case 'sequence': return 'ms';
            default: return '';
        }
    };

    // 🔧 修正: React Portalを使わず通常のJSXとして返す
    return (
        <>
            {/* オーバーレイ */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                style={{ 
                    zIndex: 999999,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                }}
            >
                {/* モーダル本体 */}
                <div 
                    className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative shadow-2xl"
                    style={{ 
                        zIndex: 1000000,
                        position: 'relative'
                    }}
                >
                    {/* 閉じるボタン */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>

                    {/* ヘッダー */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-3">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            お疲れさまでした！
                        </h3>
                        <p className="text-sm text-gray-600">
                            {getGameDisplayName(gameType)}で良いスコアを記録しました
                        </p>
                    </div>

                    {/* スコア表示 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                        <div className="text-sm text-gray-600 mb-1">あなたのスコア</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {score}{getScoreUnit(gameType)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            プレイヤー: {playerName}
                        </div>
                    </div>

                    {/* X連携促進メッセージ */}
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-700 mb-3">
                            Xと連携すると、あなたの名前でランキングに表示されます
                        </p>
                        <div className="text-xs text-gray-500">
                            ※ 連携しなくても引き続きプレイできます
                        </div>
                    </div>

                    {/* ボタン */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            後で
                        </button>
                        <button
                            onClick={onLinkX}
                            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-black rounded-full hover:bg-gray-800 transition-all duration-200 flex items-center justify-center"
                        >
                            {/* 公式Xロゴ */}
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="currentColor"
                                className="mr-2"
                            >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
X連携
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default XLinkPromptModal;
