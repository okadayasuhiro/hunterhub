import React from 'react';
import { useNavigate } from 'react-router-dom';
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
      <div className="min-h-screen">
        <div className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            {/* ヘッダー */}
            <div className="text-center mb-12">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                狩猟動物クイズ
              </h1>
            </div>

            {/* ルール説明 */}
            <div className="bg-white rounded-lg p-8 mb-12 shadow-sm border border-blue-100">
              <h2 className="text-2xl font-medium text-gray-800 mb-6">ルール</h2>
              <div className="space-y-4 text-gray-600">
                <div className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">1</span>
                  <p>狩猟対象となる16種の動物の画像が表示されます</p>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">2</span>
                  <p><strong>4つの選択肢から正しい動物名を選択してください</strong></p>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">3</span>
                  <p>回答後、正解・不正解と解説が表示されます</p>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-green-500 text-white rounded-full text-sm flex items-center justify-center mr-3 mt-0.5">4</span>
                  <p>全16問完了後、正解数と結果が表示されます</p>
                </div>
              </div>
            </div>

            {/* ベスト記録表示 */}
            {bestScore && (
              <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">ベスト記録</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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