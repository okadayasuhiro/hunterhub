import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import animalQuizService from '../services/animalQuizService';
import type { AnimalQuizGameState, AnimalQuizQuestion } from '../types/animalQuiz';

const AnimalQuizGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<AnimalQuizGameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AnimalQuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);

  useEffect(() => {
    // ゲーム状態を取得
    let state = animalQuizService.getCurrentGameState();
    
    // 状態が存在しない、完了している、または不正な状態の場合は新しいゲームを開始
    if (!state || state.isGameComplete || !state.isGameActive) {
      state = animalQuizService.startNewQuiz();
    }
    
    // 現在の問題を取得
    const currentQ = animalQuizService.getCurrentQuestion();
    if (!currentQ) {
      // 問題が取得できない場合は説明画面に戻る
      navigate('/animal-quiz/instructions');
      return;
    }
    
    setGameState(state);
    setCurrentQuestion(currentQ);
  }, [navigate]);

  const handleAnswerSelect = (answer: string) => {
    if (isAnswering || !gameState || !gameState.isGameActive) return;

    setSelectedAnswer(answer);
    setIsAnswering(true);

    const result = animalQuizService.submitAnswer(answer);
    
    if (result) {
      // 回答結果画面に遷移
      navigate('/animal-quiz/answer-result');
    }
  };

  if (!gameState || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">クイズを準備中...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentQuestion.questionNumber / currentQuestion.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 進捗バー */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              問題 {currentQuestion.questionNumber} / {currentQuestion.totalQuestions}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% 完了
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* 問題カード */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              この動物の名前は？
            </h2>
            
            {/* 動物画像 */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-lg p-4 shadow-inner">
                <img
                  src={currentQuestion.animal.imageFile}
                  alt="動物の画像"
                  className="w-64 max-h-64 object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder-animal.png';
                  }}
                />
              </div>
            </div>

            {/* 4択ボタン */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {currentQuestion.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(choice)}
                  disabled={isAnswering}
                  className={`px-4 py-3 md:py-4 text-base md:text-lg font-medium rounded-lg border-2 transition-all duration-200 min-h-[48px] flex items-center justify-center ${
                    isAnswering
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  } ${
                    selectedAnswer === choice
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalQuizGamePage;