import React from 'react';
import { useNavigate } from 'react-router-dom';
import { animals } from '../data/diagnosis/animals';
import type { Animal } from '../types/diagnosis';

// 動物を4つのカテゴリに分類
const categorizeAnimals = () => {
    const categories = {
        '水鳥': [] as Animal[],
        '山鳥・里鳥': [] as Animal[],
        '哺乳類（小型）': [] as Animal[],
        '哺乳類（大型）': [] as Animal[]
    };

    animals.forEach(animal => {
        if (animal.category === '鳥類') {
            // カモ類などの水鳥
            if (['magamo', 'karugamo', 'hidorigamo', 'hashibirogamo', 'onagagamo', 'kogamo',
                'hoshihajiro', 'kinkurohajiro', 'suzugamo', 'kurogamo', 'yoshigamo', 'kawau'].includes(animal.id)) {
                categories['水鳥'].push(animal);
            } else {
                // その他の鳥類（山鳥・里鳥）
                categories['山鳥・里鳥'].push(animal);
            }
        } else if (animal.category === '哺乳類') {
            // 大型哺乳類
            if (['nihon_shika', 'inoshishi', 'higuma', 'tsukinowaguma'].includes(animal.id)) {
                categories['哺乳類（大型）'].push(animal);
            } else {
                // 小型哺乳類
                categories['哺乳類（小型）'].push(animal);
            }
        }
    });

    return categories;
};

const DiagnosisGalleryPage: React.FC = () => {
    const navigate = useNavigate();
    const categories = categorizeAnimals();

    const handleAnimalClick = (animalId: string) => {
        // 適切な診断結果ページに遷移（実際のハッシュ値を生成）
        const dummyHash = btoa(`gallery-${animalId}-${Date.now()}`).slice(0, 8);
        navigate(`/diagnosis/result/${animalId}/${dummyHash}`);
    };



    const getCategoryDescription = (categoryName: string) => {
        switch (categoryName) {
            case '水鳥': return '水辺を愛し、流れに身を任せながらも確実に目標を達成する協調性豊かなタイプ';
            case '山鳥・里鳥': return '自然との調和を大切にし、美しさと品格を兼ね備えた魅力的なタイプ';
            case '哺乳類（小型）': return '機敏で適応力が高く、小さな体に大きな可能性を秘めたエネルギッシュなタイプ';
            case '哺乳類（大型）': return '堂々とした存在感と強いリーダーシップを持つ、頼れる大物タイプ';
            default: return '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="container mx-auto px-4">
                {/* ヘッダー */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        狩猟鳥獣図鑑
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                        46種の狩猟鳥獣を4つのカテゴリに分類。<br />気になる動物をクリックして、その動物の性格診断結果を見てみましょう。
                    </p>
                </div>

                {/* カテゴリ別動物表示 */}
                {Object.entries(categories).map(([categoryName, categoryAnimals]) => (
                    <div key={categoryName} className="mb-16">
                        {/* カテゴリヘッダー */}
                        <div className="border-b-4 border-blue-500 pb-6 mb-8">
                            <h2 className="text-3xl font-bold mb-3 text-gray-800">
                                {categoryName}
                                <span className="ml-3 text-lg font-medium text-blue-600">
                                    {categoryAnimals.length}種
                                </span>
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed max-w-4xl">
                                {getCategoryDescription(categoryName)}
                            </p>
                        </div>

                        {/* 動物カード */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {categoryAnimals.map(animal => (
                                <div
                                    key={animal.id}
                                    onClick={() => handleAnimalClick(animal.id)}
                                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:bg-blue-50"
                                >
                                    {/* 動物画像 */}
                                    <div className="aspect-square overflow-hidden rounded-t-lg flex items-center justify-center relative">
                                        {/* 背景の円 */}
                                        <div className="absolute w-3/4 h-3/4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full"></div>
                                        {/* 動物画像 */}
                                        <img
                                            src={`/images/animals/${animal.id}.webp`}
                                            alt={animal.name}
                                            className="w-1/2 h-1/2 object-cover transition-transform duration-300 hover:scale-110 relative z-10"
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/animals/default.png';
                                            }}
                                        />
                                    </div>

                                    {/* 動物情報 */}
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                                            {animal.name}
                                        </h3>
                                        <p className="text-sm text-blue-600 font-medium mb-2">
                                            {animal.catchphrase}
                                        </p>
                                        <p className="text-sm text-gray-600 line-clamp-3">
                                            {animal.description}
                                        </p>

                                        {/* 性格スコア */}
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center">
                                                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                                                <span>エネルギー: {animal.energy}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                                <span>思考: {animal.thinking}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                                <span>社交: {animal.social}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                                                <span>安定: {animal.stability}</span>
                                            </div>
                                        </div>

                                        {/* クリック誘導 */}
                                        <div className="mt-3 text-center">
                                            <span className="text-xs text-blue-500 font-medium">
                                                クリックして診断結果を見る →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* カテゴリ別診断ボタン */}
                        <div className="text-center">
                            <button
                                onClick={() => navigate('/diagnosis')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 px-24 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg text-xl mt-16"
                            >
                                性格診断を受ける
                            </button>
                            <p className="text-sm text-gray-500 mt-2">
                                3分で完了！あなたも{categoryName}タイプかも？
                            </p>
                        </div>
                    </div>
                ))}


            </div>
        </div>
    );
};

export default DiagnosisGalleryPage; 