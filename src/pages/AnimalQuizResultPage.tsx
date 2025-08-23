import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, CheckCircle, XCircle, RotateCcw, Home } from 'lucide-react';
import animalQuizService from '../services/animalQuizService';
import type { AnimalQuizResult } from '../types/animalQuiz';

const AnimalQuizResultPage: React.FC = () => {
      const navigate = useNavigate();

    const handleBackToHome = () => {
        navigate('/');
    };
  const [result, setResult] = useState<AnimalQuizResult | null>(null);
  const [bestScore, setBestScore] = useState<{correctCount: number, totalQuestions: number} | null>(null);

  useEffect(() => {
    const quizResult = animalQuizService.getQuizResult();
    
    if (!quizResult) {
      // 結果がない場合は説明画面に戻る
      navigate('/animal-quiz/instructions');
      return;
    }

    setResult(quizResult);
    
    // ベストスコアを保存
    animalQuizService.saveBestScore(quizResult);
    setBestScore(animalQuizService.getBestScore());
  }, [navigate]);

  const handleRetry = () => {
    animalQuizService.resetQuiz();
    navigate('/animal-quiz/instructions');
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">結果を読み込み中...</p>
        </div>
      </div>
    );
  }

  const correctPercentage = (result.correctCount / result.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 結果サマリー */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">クイズ結果</h1>
            <div className="mb-6">
              <Trophy className={`w-12 h-12 mx-auto mb-3 ${
                correctPercentage >= 80 ? 'text-yellow-500' : 
                correctPercentage >= 60 ? 'text-gray-400' : 'text-orange-400'
              }`} />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                クイズ完了！
              </h2>
              <p className="text-gray-600">
                お疲れさまでした！
              </p>
            </div>

            {/* スコア表示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
              <div className="bg-blue-50 rounded-lg p-6">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-blue-600 font-medium">正解数</p>
                <p className="text-3xl font-bold text-blue-700">
                  {result.correctCount} / {result.totalQuestions}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-600 font-medium">正解率</p>
                <p className="text-3xl font-bold text-green-700">
                  {correctPercentage.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* ベストスコア */}
            {bestScore && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">
                  🏆 あなたのベストスコア
                </h3>
                <p className="text-yellow-700">
                  {bestScore.correctCount} / {bestScore.totalQuestions} 問正解
                  （{((bestScore.correctCount / bestScore.totalQuestions) * 100).toFixed(1)}%）
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 詳細結果 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">詳細結果</h3>
          
          <div className="space-y-4">
            {result.results.map((questionResult, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                questionResult.isCorrect 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {questionResult.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">
                        問題 {index + 1}: {questionResult.question.animal.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        あなたの回答: {questionResult.answered ? questionResult.userAnswer : 'タイムアウト'}
                      </p>
                      {!questionResult.isCorrect && (
                        <p className="text-sm text-green-600">
                          正解: {questionResult.question.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={handleRetry}
            className="w-full max-w-xs bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            もう一度挑戦
          </button>
          
          <button
            onClick={handleBackToHome}
            className="w-full max-w-40 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg shadow-lg border-2 border-gray-300 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimalQuizResultPage;