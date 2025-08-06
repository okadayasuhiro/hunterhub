import { useNavigate } from 'react-router-dom';
import { Compass, Target, Brain, Share2, Zap } from 'lucide-react';

export default function DiagnosisHomePage() {
    const navigate = useNavigate();

    const features = [
        {
            icon: Target,
            title: '46種類の動物',
            description: '日本の狩猟対象鳥獣すべてを網羅'
        },
        {
            icon: Brain,
            title: '科学的分析',
            description: '3軸×重み付けによる精密な性格分析'
        },
        {
            icon: Share2,
            title: '結果シェア',
            description: 'SNSで診断結果を友達と共有'
        }
    ];

    const sampleAnimals = [
        {
            name: 'タヌキ',
            image: '/images/animals/tanuki.png',
            catchphrase: 'トリックスターの化け上手'
        },
        {
            name: 'キツネ',
            image: '/images/animals/kitsune.png',
            catchphrase: 'クールで狡猾な情報屋'
        },
        {
            name: 'ヒグマ',
            image: '/images/animals/higuma.png',
            catchphrase: '圧倒的暴君・森の支配者'
        },
        {
            name: 'マガモ',
            image: '/images/animals/magamo.png',
            catchphrase: '汎用性高い戦略家'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ヘッダー */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <Zap className="w-5 h-5 mr-2" />
                        <span className="font-bold">HunterHub</span>
                    </button>
                </div>
            </header>

            {/* ヒーローセクション */}
            <section
                className="py-16 px-4 relative bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/images/bg_green.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* 背景オーバーレイ（テキストの可読性向上のため） */}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>

                <div className="container mx-auto text-center max-w-4xl relative z-10">
                    <div className="mb-8">
                        <Compass className="w-16 h-16 text-white mx-auto mb-4 drop-shadow-lg" />
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                            あなたはどの狩猟鳥獣タイプ？
                        </h1>
                        <p className="text-xl text-white mb-8 drop-shadow-md">
                            12の質問で性格・環境・人間関係を分析し、<br />
                            46種の狩猟対象動物からあなたにぴったりの1匹を診断
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/diagnosis/quiz')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                        診断を開始する
                    </button>

                    <p className="text-sm text-white mt-4 drop-shadow-md">
                        所要時間: 約5分
                    </p>
                </div>
            </section>

            {/* 特徴説明 */}
            <section className="py-16 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">
                        診断の特徴
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 動物プレビュー */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">
                        診断できる動物たち
                    </h2>

                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        {sampleAnimals.map((animal, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    <img
                                        src={animal.image}
                                        alt={animal.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            console.error(`画像読み込みエラー: ${animal.image}`);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">{animal.name}</h3>
                                <p className="text-sm text-blue-600">{animal.catchphrase}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => navigate('/diagnosis/gallery')}
                            className="border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
                        >
                            全46種の動物を見る
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4 bg-blue-50">
                <div className="container mx-auto text-center max-w-4xl">
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">
                        さあ、あなたの狩猟鳥獣タイプを発見しよう
                    </h2>
                    <p className="text-slate-600 mb-8">
                        質問に答えるだけで、あなたの性格に最も近い狩猟対象動物がわかります
                    </p>

                    <button
                        onClick={() => navigate('/diagnosis/quiz')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                        今すぐ診断する
                    </button>
                </div>
            </section>
        </div>
    );
} 