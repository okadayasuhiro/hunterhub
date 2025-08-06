import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#ecf6ff' }}>
            <div className="text-center px-4">
                <div className="mb-8">
                    <div className="text-8xl mb-4">🎯</div>
                    <h1 className="text-6xl font-light text-gray-800 mb-4">404</h1>
                    <h2 className="text-2xl font-light text-gray-600 mb-6">
                        ページが見つかりません
                    </h2>
                    <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
                        お探しのページは存在しないか、移動された可能性があります。
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleGoHome}
                        className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300"
                    >
                        ホームに戻る
                    </button>

                    <div className="text-sm text-gray-400">
                        <p>または、以下のゲームを直接お試しください：</p>
                        <div className="mt-4 space-x-4">
                            <button
                                onClick={() => navigate('/reflex/instructions')}
                                className="text-blue-500 hover:text-blue-600 underline"
                            >
                                反射神経テスト
                            </button>
                            <button
                                onClick={() => navigate('/target/instructions')}
                                className="text-blue-500 hover:text-blue-600 underline"
                            >
                                ターゲット追跡
                            </button>
                            <button
                                onClick={() => navigate('/sequence/instructions')}
                                className="text-blue-500 hover:text-blue-600 underline"
                            >
                                数字順序ゲーム
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage; 