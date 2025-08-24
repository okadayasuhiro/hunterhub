import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, CheckCircle, XCircle, RotateCcw, Home, Share2 } from 'lucide-react';
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
    <div className="flex-1">
      <div className="min-h-screen">
        <div className="py-4 px-4">
          <div className="max-w-4xl mx-auto">
            {/* ヘッダー */}
            <div className="text-center mb-4">
              <h1 className="text-m font-bold text-gray-800">
                クイズ完了です！お疲れ様でした！
              </h1>
            </div>

            {/* コンパクト結果表示 */}
            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">正解数</div>
                  <div className="text-2xl font-bold text-green-600">
                    {result.correctCount} / {result.totalQuestions}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">正解率</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {correctPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* ベストスコア表示（ランキング風） */}
              {bestScore && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 text-center mb-4">
                  <div className="text-sm text-blue-100 mb-1">あなたのベストスコア</div>
                  <div className="text-xl font-bold">
                    {bestScore.correctCount} / {bestScore.totalQuestions} 問正解 ({((bestScore.correctCount / bestScore.totalQuestions) * 100).toFixed(1)}%)
                  </div>
                </div>
              )}

              {/* シェアボタン */}
              <div className="mt-3 flex justify-center gap-2">
                <button
                  onClick={() => {
                    const shareText = `ハントレで狩猟動物クイズをプレイしました！\n結果: ${result.correctCount} / ${result.totalQuestions} 問正解\n正解率: ${correctPercentage.toFixed(1)}%`;
                    const shareUrl = window.location.origin;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: 'ハントレ - 狩猟動物クイズ結果',
                        text: shareText,
                        url: shareUrl
                      });
                    } else {
                      // フォールバック: Xでシェア
                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                      window.open(twitterUrl, '_blank');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium transition-colors duration-200"
                  title="結果をシェア"
                >
                  <Share2 className="w-4 h-4" />
                  シェア
                </button>
              </div>
            </div>

            {/* 詳細結果 */}
            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">詳細結果</h3>
              
              <div className="space-y-3">
                {result.results.map((questionResult, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    questionResult.isCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {questionResult.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">
                          問題 {index + 1}: {questionResult.question.animal.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          あなたの回答: {questionResult.answered ? questionResult.userAnswer : 'タイムアウト'}
                        </p>
                        {!questionResult.isCorrect && (
                          <p className="text-xs text-green-600">
                            正解: {questionResult.question.correctAnswer}
                          </p>
                        )}
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
                もう一度トレーニングする
              </button>
              
              <button
                onClick={handleBackToHome}
                className="w-full max-w-40 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg shadow-lg border-2 border-gray-300 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
              >
                <Home className="w-5 h-5 mr-2" />
                メニューに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalQuizResultPage;