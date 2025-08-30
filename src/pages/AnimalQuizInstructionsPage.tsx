import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MousePointer, CheckCircle, Trophy } from 'lucide-react';
import SEO from '../components/SEO';
import animalQuizService from '../services/animalQuizService';

const AnimalQuizInstructionsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    // 新しいゲームを開始する前に既存の状態をリセット
    animalQuizService.resetQuiz();
    navigate('/animal-quiz/game');
  };

  const handleBack = () => {
    navigate('/');
  };

  // ベストスコア取得
  const bestScore = animalQuizService.getBestScore();

  return (
    <div className="flex-1">
      <SEO 
        title="狩猟鳥獣クイズ - ハントレ"
        description="狩猟対象の鳥獣を写真で判別するクイズ。ハンターに必要な鳥獣識別スキルを楽しく学習できます。"
        keywords="狩猟鳥獣,クイズ,鳥獣識別,ハンター,学習,狩猟免許,野生動物"
        ogType="game"
        canonicalUrl="https://hantore.net/animal-quiz/instructions"
      />
      <div className="min-h-screen">
        <div className="py-4 px-4">
          <div className="max-w-3xl mx-auto">
            {/* ヘッダー */}
            <div className="text-right mb-4">
              <h1 className="text-sm font-medium text-gray-500">
                狩猟鳥獣（獣類）クイズトレーニング
              </h1>
            </div>

            {/* ルール説明 */}
            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">ルール</h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center">
                  <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                    <Camera className="w-3 h-3" />
                  </div>
                  <p>狩猟対象となる<span className="font-semibold text-blue-600">動物</span>の画像が表示されます</p>
                </div>
                <div className="flex items-center">
                  <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                    <MousePointer className="w-3 h-3" />
                  </div>
                  <p><span className="font-semibold text-green-600">4つの選択肢</span>から正しい動物名を選択してください</p>
                </div>
                <div className="flex items-center">
                  <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <p>回答後、<span className="font-semibold text-purple-600">正解・不正解と解説</span>が表示されます</p>
                </div>
                <div className="flex items-center">
                  <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">
                    <Trophy className="w-3 h-3" />
                  </div>
                  <p>全16問完了後、正解数と結果が表示されます</p>
                </div>
              </div>
            </div>

            {/* ベスト記録表示 */}
            {bestScore && (
              <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">ベスト記録</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">最高正解数</div>
                    <div className="text-xl font-bold text-green-600">{bestScore.correctCount} / {bestScore.totalQuestions}問</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">正解率</div>
                    <div className="text-xl font-bold text-blue-600">{((bestScore.correctCount / bestScore.totalQuestions) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* ボタン */}
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={handleStartGame}
                className="w-full max-w-xs px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300"
              >
                クイズ開始
              </button>
              <button
                onClick={handleBack}
                className="w-full max-w-40 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalQuizInstructionsPage;