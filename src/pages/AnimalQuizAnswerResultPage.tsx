import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import animalQuizService from '../services/animalQuizService';
import type { QuestionResult, AnimalQuizGameState } from '../types/animalQuiz';

const AnimalQuizAnswerResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [gameState, setGameState] = useState<AnimalQuizGameState | null>(null);

  useEffect(() => {
    const result = animalQuizService.getCurrentQuestionResult();
    const state = animalQuizService.getCurrentGameState();
    
    if (!result || !state || !state.isGameActive) {
      // 結果やゲーム状態がない場合は説明画面に戻る
      navigate('/animal-quiz/instructions');
      return;
    }

    setQuestionResult(result);
    setGameState(state);
  }, [navigate]);

  const handleNextQuestion = () => {
    const hasNextQuestion = animalQuizService.proceedToNextQuestion();
    
    if (hasNextQuestion) {
      // 次の問題へ
      navigate('/animal-quiz/game');
    } else {
      // 全問題完了、結果画面へ
      navigate('/animal-quiz/result');
    }
  };

  if (!questionResult || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">結果を読み込み中...</p>
        </div>
      </div>
    );
  }

  const isCorrect = questionResult.isCorrect;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 結果カード */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {/* 結果表示 */}
          <div className="text-center mb-6">
            <div className="mb-4">
              {isCorrect ? (
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-2" />
                  <h2 className="text-xl font-bold text-green-600">正解！</h2>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-500 mr-2" />
                  <h2 className="text-xl font-bold text-red-600">不正解</h2>
                </div>
              )}
            </div>

            {/* 動物画像 */}
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 rounded-lg p-4 shadow-inner">
                <img
                  src={questionResult.question.animal.imageFile}
                  alt={questionResult.question.animal.name}
                  className="w-48 max-h-48 object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder-animal.png';
                  }}
                />
              </div>
            </div>

            {/* 回答情報 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600 mb-1">正解</p>
                  <p className="text-lg font-bold text-green-600">
                    {questionResult.question.correctAnswer}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">あなたの回答</p>
                  <p className={`text-lg font-bold ${
                    isCorrect ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {questionResult.userAnswer || '未回答'}
                  </p>
                </div>
              </div>
            </div>

            {/* 次へボタン */}
            <div className="text-center mb-4">
              <button
                onClick={handleNextQuestion}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300 flex items-center mx-auto"
              >
                {gameState.currentQuestionIndex + 1 >= gameState.questions.length ? (
                  <>
                    結果を見る
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    次の問題へ
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>

            {/* 解説 */}
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="text-base font-bold text-blue-800 mb-2">
                {questionResult.question.animal.name} について
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {questionResult.question.animal.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalQuizAnswerResultPage;