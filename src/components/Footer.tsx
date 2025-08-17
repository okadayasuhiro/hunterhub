import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="w-full mt-auto border-t border-gray-700" style={{ backgroundColor: '#2A2A2E' }}>
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* アプリ情報 */}
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-white mb-5">HunterHub</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            反射神経と集中力を鍛える<br />
                            オンライントレーニングプラットフォーム
                        </p>
                    </div>

                    {/* ゲーム一覧 */}
                    <div className="text-center md:text-right">
                        <h4 className="text-white font-semibold mb-5">
                            トレーニングメニュー
                        </h4>
                        <ul className="text-gray-300 text-sm space-y-3">
                            <li>
                                <Link 
                                    to="/reflex/instructions" 
                                    className="hover:text-white transition-colors duration-200"
                                >
                                    反射神経テスト
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/target/instructions" 
                                    className="hover:text-white transition-colors duration-200"
                                >
                                    ターゲット追跡
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/sequence/instructions" 
                                    className="hover:text-white transition-colors duration-200"
                                >
                                    数字順序ゲーム
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ソーシャルシェア */}
                <div className="mt-10 text-center">
                    <h4 className="text-white font-semibold mb-5">
                        HunterHubをシェア
                    </h4>
                    <div className="flex justify-center space-x-4 mb-6">
                        {/* X (Twitter) */}
                        <button
                            onClick={() => {
                                const url = encodeURIComponent(window.location.href);
                                const text = encodeURIComponent('HunterHubで反射神経と集中力を鍛えよう！🎯 あなたのハンタースキルはどのレベル？');
                                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                            }}
                            className="bg-black hover:bg-gray-800 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center w-12 h-12"
                            title="Xでシェア"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={() => {
                                const url = encodeURIComponent(window.location.href);
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center w-12 h-12"
                            title="Facebookでシェア"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </button>

                        {/* LINE */}
                        <button
                            onClick={() => {
                                const url = encodeURIComponent(window.location.href);
                                const text = encodeURIComponent('HunterHubで反射神経と集中力を鍛えよう！');
                                window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank');
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center w-12 h-12"
                            title="LINEでシェア"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                            </svg>
                        </button>

                        {/* Discord */}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`HunterHubで反射神経と集中力を鍛えよう！🎯 ${window.location.href}`);
                                alert('Discordでシェアするためのテキストをコピーしました！');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center w-12 h-12"
                            title="Discord用テキストをコピー"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                        </button>

                        {/* クリップボードコピー */}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('URLをクリップボードにコピーしました！');
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center w-12 h-12"
                            title="URLをコピー"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* コピーライト */}
                <div className="border-t border-gray-700 mt-10 pt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        © 2024 HunterHub - あなたの反射神経と集中力を次のレベルへ
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 