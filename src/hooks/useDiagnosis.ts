import { useState, useCallback } from 'react';
import type { DiagnosisState, DiagnosisResult } from '../types/diagnosis';
import { questions } from '../data/diagnosis/questions';
import { diagnoseUser } from '../data/diagnosis/diagnosisLogic';

export function useDiagnosis() {
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

            return {
                ...prev,
                answers: newAnswers
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
                setState(prev => ({
                    ...prev,
                    result,
                    isCompleted: true,
                    isLoading: false
                }));
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

    // 現在の質問を取得
    const getCurrentQuestion = useCallback(() => {
        return questions[state.currentQuestion];
    }, [state.currentQuestion]);

    // 現在の回答を取得
    const getCurrentAnswer = useCallback(() => {
        const currentAnswer = state.answers[state.currentQuestion];
        return currentAnswer?.choice || null;
    }, [state.answers, state.currentQuestion]);

    // 進捗計算
    const getProgress = useCallback(() => {
        return {
            current: state.currentQuestion + 1,
            total: questions.length,
            percentage: Math.round(((state.currentQuestion + 1) / questions.length) * 100)
        };
    }, [state.currentQuestion]);

    // 全質問回答済みかチェック
    const isAllAnswered = useCallback(() => {
        return state.answers.length === questions.length &&
            state.answers.every(answer => answer && answer.choice);
    }, [state.answers]);

    // 特定の質問の回答を取得
    const getAnswerForQuestion = useCallback((questionIndex: number) => {
        return state.answers[questionIndex]?.choice || null;
    }, [state.answers]);

    // 質問の回答率を取得
    const getAnsweredCount = useCallback(() => {
        return state.answers.filter(answer => answer && answer.choice).length;
    }, [state.answers]);

    return {
        // 状態
        state,

        // アクション
        answerQuestion,
        nextQuestion,
        previousQuestion,
        executeDiagnosis,
        resetDiagnosis,

        // ゲッター
        getCurrentQuestion,
        getCurrentAnswer,
        getProgress,
        isAllAnswered,
        getAnswerForQuestion,
        getAnsweredCount,

        // 便利な状態
        canGoNext: state.currentQuestion < questions.length - 1,
        canGoPrevious: state.currentQuestion > 0,
        hasCurrentAnswer: getCurrentAnswer() !== null,
        totalQuestions: questions.length,
        answeredCount: getAnsweredCount()
    };
} 