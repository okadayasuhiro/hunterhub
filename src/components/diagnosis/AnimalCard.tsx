import type { Animal } from '../../types/diagnosis';

interface AnimalCardProps {
    animal: Animal;
    onClick?: () => void;
    className?: string;
    showDetails?: boolean;
}

export default function AnimalCard({
    animal,
    onClick,
    className = '',
    showDetails = false
}: AnimalCardProps) {
    return (
        <div
            className={`
        bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {/* 動物画像プレースホルダー */}
            <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-6xl">
                    {animal.name.includes('カモ') || animal.name.includes('ガモ') ? '🦆' :
                        animal.name.includes('カラス') ? '🐦‍⬛' :
                            animal.name.includes('スズメ') ? '🐦' :
                                animal.name.includes('キジ') ? '🐓' :
                                    animal.name.includes('クマ') ? '🐻' :
                                        animal.name.includes('イノシシ') ? '🐗' :
                                            animal.name.includes('シカ') ? '🦌' :
                                                animal.name.includes('タヌキ') ? '🦝' :
                                                    animal.name.includes('キツネ') ? '🦊' :
                                                        animal.name.includes('ウサギ') ? '🐰' :
                                                            animal.name.includes('リス') ? '🐿️' :
                                                                '🐾'}
                </div>
            </div>

            {/* 動物情報 */}
            <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {animal.name}
                </h3>

                <p className="text-blue-600 font-medium mb-3">
                    {animal.catchphrase}
                </p>

                {animal.description && (
                    <p className="text-slate-600 text-sm mb-4">
                        {animal.description}
                    </p>
                )}

                {showDetails && (
                    <div className="space-y-2">
                        <div className="flex items-center text-sm">
                            <span className="text-slate-500 w-16">カテゴリ:</span>
                            <span className="text-slate-700 font-medium">
                                {animal.category}
                            </span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-slate-500 w-16">活動性:</span>
                            <span className="text-slate-700 font-medium">
                                {animal.energy}/10
                            </span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-slate-500 w-16">社交性:</span>
                            <span className="text-slate-700 font-medium">
                                {animal.social}/10
                            </span>
                        </div>
                    </div>
                )}

                {/* カテゴリ表示 */}
                <div className="flex gap-2 mt-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {animal.category}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        活動性: {animal.energy}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        社交性: {animal.social}
                    </span>
                </div>
            </div>
        </div>
    );
} 