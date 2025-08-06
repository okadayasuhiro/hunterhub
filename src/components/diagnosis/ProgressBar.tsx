interface ProgressBarProps {
    current: number;
    total: number;
    className?: string;
}

export default function ProgressBar({ current, total, className = '' }: ProgressBarProps) {
    const percentage = Math.round((current / total) * 100);

    return (
        <div className={`w-full ${className}`}>
            {/* 進捗テキスト */}
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600">
                    進捗状況
                </span>
                <span className="text-sm font-bold text-blue-600">
                    {current} / {total}
                </span>
            </div>

            {/* 進捗バー */}
            <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            {/* パーセンテージ */}
            <div className="text-center mt-2">
                <span className="text-xs text-slate-500">
                    {percentage}% 完了
                </span>
            </div>
        </div>
    );
} 