// import React from 'react';

interface DiagnosisCardProps {
    onClick: () => void;
}

export default function DiagnosisCard({ onClick }: DiagnosisCardProps) {
    return (
        <div
            className="bg-white rounded-xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-2"
            style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            onClick={onClick}
        >
            {/* アイコンとタイトル */}
            <div className="flex items-center mb-4">
                <div className="text-blue-500 mr-3">
                    {/* Compass アイコンの代替として方位記号を使用 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">狩猟鳥獣診断</h3>
            </div>

            {/* 説明文 */}
            <p className="text-slate-600 mb-4 text-left">
                12の質問であなたの性格を分析し、46種の狩猟対象動物から最も近い1匹を診断します。
            </p>

            {/* 特徴 */}
            <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-500">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    46種類の動物から診断
                </div>
                <div className="flex items-center text-sm text-slate-500">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    科学的な3軸分析
                </div>
                <div className="flex items-center text-sm text-slate-500">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    所要時間: 約5分
                </div>
            </div>

            {/* 開始ボタン */}
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200">
                診断を開始する
            </button>
        </div>
    );
} 