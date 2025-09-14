import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#ecf6ff' }}>
            <div className="text-center px-4 py-10">
                <div className="mb-6">
                    <img src="/images/404deer.webp" alt="Not found deer" className="mx-auto w-48 h-48 object-contain" />
                </div>
                <h1 className="text-5xl font-semibold text-gray-800 mb-2">404</h1>
                <h2 className="text-xl font-normal text-gray-600 mb-4">ページが見つかりません</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    お探しのページは存在しないか、移動された可能性があります。
                </p>

                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={handleGoHome}
                        className="w-full max-w-40 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
                    >
                        ホームに戻る
                    </button>
                    <div className="text-xs text-gray-400">
                        <p>人気のコンテンツへ</p>
                        <div className="mt-2 flex items-center justify-center gap-3 flex-wrap">
                            <button
                                onClick={() => navigate('/reflex/instructions')}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                            >
                                反射神経テスト
                            </button>
                            <button
                                onClick={() => navigate('/target/instructions')}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                            >
                                ターゲット追跡
                            </button>
                            <button
                                onClick={() => navigate('/sequence/instructions')}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
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