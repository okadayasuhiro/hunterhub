import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full mt-auto" style={{ backgroundColor: '#006cc1', margin: 0, padding: 0 }}>
            <div className="w-full px-4 py-8" style={{ margin: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* アプリ情報 */}
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start mb-3">
                            <span className="text-xl mr-2">🎯</span>
                            <h3 className="text-lg font-bold text-white">HunterHub</h3>
                        </div>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            狩猟者向けの反射神経と集中力を鍛える<br />
                            トレーニングアプリケーション
                        </p>
                    </div>

                    {/* ゲーム一覧 */}
                    <div className="text-center">
                        <h4 className="text-white font-semibold mb-3">トレーニングメニュー</h4>
                        <ul className="text-blue-100 text-sm space-y-1">
                            <li>⚡ 反射神経テスト</li>
                            <li>🎯 ターゲット追跡</li>
                            <li>🔢 数字順序ゲーム</li>
                        </ul>
                    </div>

                    {/* ランクシステム */}
                    <div className="text-center md:text-right">
                        <h4 className="text-white font-semibold mb-3">ハンターランク</h4>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            12段階のランクシステムで<br />
                            あなたの実力を測定
                        </p>
                        <div className="mt-3">
                            <span className="text-yellow-300 text-xs">
                                🏆 ハンター・オブ・ザ・オリジン
                            </span>
                        </div>
                    </div>
                </div>

                {/* コピーライト */}
                <div className="border-t border-blue-500 mt-8 pt-6 text-center">
                    <p className="text-blue-100 text-sm">
                        © 2024 HunterHub - 継続的なトレーニングで狩猟スキルを向上
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 