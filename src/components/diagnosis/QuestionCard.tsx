// import React from 'react';
import type { Question } from '../../types/diagnosis';

interface QuestionCardProps {
    question: Question;
    selectedAnswer: string;
    onAnswerSelect: (answer: string) => void;
    questionNumber: number;
    totalQuestions: number;
}

export default function QuestionCard({
    question,
    selectedAnswer,
    onAnswerSelect,
    questionNumber,
    totalQuestions
}: QuestionCardProps) {
    const choiceLabels = ['A', 'B', 'C', 'D'];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            {/* 質問番号 */}
            <div className="text-sm text-blue-600 font-medium mb-2">
                質問 {questionNumber} / {totalQuestions}
            </div>

            {/* 質問文 */}
            <h2 className="text-xl font-bold text-slate-800 mb-6">
                {question.text}
            </h2>

            {/* 選択肢 */}
            <div className="space-y-3">
                {question.options.map((option, index) => {
                    const choiceLabel = choiceLabels[index];
                    return (
                        <label
                            key={choiceLabel}
                            className={`
                  block p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${selectedAnswer === choiceLabel
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                }
                `}
                        >
                            <input
                                type="radio"
                                name="answer"
                                value={choiceLabel}
                                checked={selectedAnswer === choiceLabel}
                                onChange={(e) => onAnswerSelect(e.target.value)}
                                className="sr-only"
                            />
                            <div className="flex items-center">
                                <div className={`
                    w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                    ${selectedAnswer === choiceLabel
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-slate-300'
                                    }
                  `}>
                                    {selectedAnswer === choiceLabel && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                </div>
                                <span className="text-slate-700 font-medium">
                                    <span className="text-blue-600 font-bold mr-2">{choiceLabel}.</span>
                                    {option.text}
                                </span>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
} 