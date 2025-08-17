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