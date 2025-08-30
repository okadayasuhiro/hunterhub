import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="w-full mt-auto border-t border-gray-700" style={{ backgroundColor: '#2A2A2E' }}>
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* アプリ情報 */}
                    <div className="text-center md:text-left">
                        <div className="mb-5">
                            <img 
                                src="/images/logo-w-w.png" 
                                alt="ハントレ" 
                                className="h-8 mx-auto md:mx-0"
                            />
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            反射神経と集中力を鍛える<br />
                            オンライントレーニングプラットフォーム
                        </p>
                    </div>


                </div>

                {/* ソーシャルシェア */}
                <div className="mt-10 text-center">
                    <h4 className="text-white font-semibold mb-5">
                        ハントレをシェア
                    </h4>
                    <div className="flex justify-center space-x-4 mb-6">
                        {/* X (Twitter) */}
                        <button
                            onClick={() => {
                                const url = encodeURIComponent(window.location.href);
                                const text = encodeURIComponent('ハントレで反射神経と集中力を鍛えよう！🎯 あなたのハンタースキルはどのレベル？');
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
                                const text = encodeURIComponent('ハントレで反射神経と集中力を鍛えよう！');
                                window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank');
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center w-12 h-12"
                            title="LINEでシェア"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
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
                    
                    {/* お問い合わせリンク */}
                    <div className="mt-6">
                        <a
                            href="https://forms.gle/FdWpWuBft4KS6q5A6"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            お問い合わせ
                        </a>
                    </div>
                </div>

                {/* コピーライト */}
                <div className="border-t border-gray-700 mt-10 pt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        © 2025 ハントレ All rights reserved.<br />狩猟時の反射神経と集中力をトレーニング
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 