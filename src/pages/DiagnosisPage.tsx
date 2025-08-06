import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DiagnosisState } from '../types/diagnosis';
import { questions } from '../data/diagnosis/questions';
import { diagnoseUser } from '../data/diagnosis/diagnosisLogic';
import { setupDiagnosisDebug } from '../utils/debugDiagnosis';
import { encodeUserProfile } from '../utils/profileHash';

export default function DiagnosisPage() {
    const navigate = useNavigate();

    const [state, setState] = useState<DiagnosisState>({
        currentQuestion: 0,
        answers: [],
        isCompleted: false,
        result: null,
        isLoading: false
    });

    // 回答を記録（新しい形式）
    const answerQuestion = useCallback((choice: 'A' | 'B' | 'C' | 'D') => {
        setState(prev => {
            const currentQuestionId = questions[prev.currentQuestion]?.id;
            if (!currentQuestionId) return prev;

            const newAnswers = [...prev.answers];
            newAnswers[prev.currentQuestion] = {
                questionId: currentQuestionId,
                choice
            };

            // 回答を記録した後、次の質問に自動遷移（最後の質問でない場合）
            const newQuestionIndex = prev.currentQuestion < questions.length - 1
                ? prev.currentQuestion + 1
                : prev.currentQuestion;

            return {
                ...prev,
                answers: newAnswers,
                currentQuestion: newQuestionIndex
            };
        });
    }, []);

    // 次の質問へ
    const nextQuestion = useCallback(() => {
        setState(prev => {
            if (prev.currentQuestion < questions.length - 1) {
                return {
                    ...prev,
                    currentQuestion: prev.currentQuestion + 1
                };
            }
            return prev;
        });
    }, []);

    // 前の質問へ
    const previousQuestion = useCallback(() => {
        setState(prev => {
            if (prev.currentQuestion > 0) {
                return {
                    ...prev,
                    currentQuestion: prev.currentQuestion - 1
                };
            }
            return prev;
        });
    }, []);

    // 診断実行（最適化されたロジック使用）
    const executeDiagnosis = useCallback(() => {
        setState(prev => ({ ...prev, isLoading: true }));

        // 非同期処理をシミュレート
        setTimeout(() => {
            try {
                const result = diagnoseUser(state.answers);

                // 結果ページにリダイレクト
                const userProfileHash = encodeUserProfile(result.userProfile);
                navigate(`/diagnosis/result/${result.animal.id}/${userProfileHash}`);

            } catch (error) {
                console.error('診断エラー:', error);
                setState(prev => ({
                    ...prev,
                    isLoading: false
                }));
            }
        }, 1000);
    }, [state.answers]);

    // リセット
    const resetDiagnosis = useCallback(() => {
        setState({
            currentQuestion: 0,
            answers: [],
            isCompleted: false,
            result: null,
            isLoading: false
        });
    }, []);

    const currentQuestion = questions[state.currentQuestion];
    const currentAnswer = state.answers[state.currentQuestion]?.choice || null;
    const progress = Math.round(((state.currentQuestion + 1) / questions.length) * 100);
    const canGoNext = state.currentQuestion < questions.length - 1;
    const canGoPrevious = state.currentQuestion > 0;
    const hasCurrentAnswer = currentAnswer !== null;
    const isAllAnswered = state.answers.length === questions.length &&
        state.answers.every(answer => answer && answer.choice);

    // アナーキー犬の応援メッセージ（質問番号ベース）
    const getEncouragementMessage = () => {
        const currentQuestionNumber = state.currentQuestion + 1; // 1-based

        if (currentQuestionNumber === 1) {
            return "最初の質問だワーン！おまえの本当の姿を見つけてやるワーン！";
        } else if (currentQuestionNumber === 2) {
            return "意外な回答だな・・・ワーン！いい感じだワーン！";
        } else if (currentQuestionNumber === 3) {
            return "あと10問だワーン。焦らず地道にやろうワーン！";
        } else if (currentQuestionNumber === 4) {
            return "オレの名前？？アナーキー・ドッグだワーン！そんなことより、答えるワーン。";
        } else if (currentQuestionNumber === 5) {
            return "ふむふむ、オマエのことが見えてきたワーン！";
        } else if (currentQuestionNumber === 6) {
            return "オレの好物は鹿の角だワーン！ハムハムするのが好きだワーン！・・・ジュル。";
        } else if (currentQuestionNumber === 7) {
            return "半分がもう終わったワーン！ワンワンとウルサイ？仕方ないワーン！犬だからな。";
        } else if (currentQuestionNumber === 8) {
            return "おまえの今の答え、オレも共感だワーン！大事だよね。・・・ワーン！";
        } else if (currentQuestionNumber === 9) {
            return "あと4問だワーン。あと少しだワンッ！";
        } else if (currentQuestionNumber === 10) {
            return "なんか、オレ・・・お前のことが好きになってきたワーン！";
        } else if (currentQuestionNumber === 11) {
            return "オマエがご主人様だったら、楽しそうだワーン！飼ってほしいワーン！";
        } else if (currentQuestionNumber === 12) {
            return "ラストワン・・・・！ワーーン！";
        }

        // フォールバック
        return "頑張って答えるワーン！";
    };



    // ローディング画面
    if (state.isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-600">診断中...</p>
                    <p className="text-sm text-slate-500 mt-2">最適化されたアルゴリズムで分析中...</p>
                </div>
            </div>
        );
    }

    // 質問画面
    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* ヘッダー */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">狩猟鳥獣診断</h1>
                    <p className="text-slate-600">12の質問であなたにぴったりの動物を見つけます</p>
                </div>

                {/* プログレスバー */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-500">
                            質問 {state.currentQuestion + 1} / {questions.length}
                        </span>
                        <span className="text-sm text-slate-500">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* アナーキー犬の応援セクション */}
                <div className="mb-8 flex items-start space-x-4">
                    {/* アナーキー犬の画像 */}
                    <div className="flex-shrink-0">
                        <img
                            src="/images/anarchy_dog.png"
                            alt="アナーキー犬"
                            className="w-16 h-16 object-cover rounded-full"
                        />
                    </div>

                    {/* 吹き出し */}
                    <div className="relative bg-white rounded-xl p-4 max-w-xl">
                        {/* 吹き出しの三角形 */}
                        <div className="absolute left-0 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white transform -translate-x-2"></div>

                        <p className="text-slate-700 font-medium text-sm leading-relaxed">
                            {getEncouragementMessage()}
                        </p>
                    </div>
                </div>

                {/* 質問カード */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">
                        {currentQuestion?.text}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion?.options.map((option, index) => {
                            const choice = ['A', 'B', 'C', 'D'][index] as 'A' | 'B' | 'C' | 'D';
                            const isSelected = currentAnswer === choice;

                            return (
                                <button
                                    key={index}
                                    onClick={() => answerQuestion(choice)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${isSelected
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${isSelected
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {choice}
                                        </span>
                                        <span className="text-slate-700">{option.text}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ナビゲーションボタン */}
                <div className="flex justify-center">
                    {canGoPrevious ? (
                        <button
                            onClick={previousQuestion}
                            className="py-3 px-8 rounded-lg font-bold border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
                        >
                            前の質問
                        </button>
                    ) : (
                        <div className="py-3 px-8"></div> // 空のスペースを維持
                    )}

                    {/* 最後の質問の場合のみ診断実行ボタンを表示 */}
                    {!canGoNext && (
                        <button
                            onClick={executeDiagnosis}
                            disabled={!isAllAnswered}
                            className={`ml-4 py-3 px-8 rounded-lg font-bold transition-colors duration-200 ${isAllAnswered
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            診断実行
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
} 