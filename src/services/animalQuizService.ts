import type { AnimalQuizResult, AnimalQuizQuestion, AnimalQuizGameState, QuestionResult } from '../types/animalQuiz';
import { ANIMAL_QUIZ_CONFIG } from '../types/animalQuiz';
import { shuffleAnimals, generateChoices, isCorrectAnswer, ANIMAL_QUIZ_DATA } from '../data/animalQuizData';
import { v4 as uuidv4 } from 'uuid';

class AnimalQuizService {
  private static instance: AnimalQuizService;
  private gameState: AnimalQuizGameState | null = null;

  private constructor() {}

  static getInstance(): AnimalQuizService {
    if (!AnimalQuizService.instance) {
      AnimalQuizService.instance = new AnimalQuizService();
    }
    return AnimalQuizService.instance;
  }

  // 新しいクイズを開始
  startNewQuiz(): AnimalQuizGameState {
    const shuffledAnimals = shuffleAnimals();
    const questions: AnimalQuizQuestion[] = shuffledAnimals.map((animal, index) => ({
      id: uuidv4(),
      animal,
      questionNumber: index + 1,
      totalQuestions: ANIMAL_QUIZ_CONFIG.TOTAL_QUESTIONS,
      choices: generateChoices(animal, ANIMAL_QUIZ_DATA),
      correctAnswer: animal.name
    }));

    this.gameState = {
      questions,
      results: [],
      currentQuestionIndex: 0,
      isGameActive: true,
      isGameComplete: false
    };

    return this.gameState;
  }

  // 回答を提出
  submitAnswer(userAnswer: string): QuestionResult | null {
    if (!this.gameState || !this.gameState.isGameActive) {
      return null;
    }

    const currentQuestion = this.gameState.questions[this.gameState.currentQuestionIndex];
    const isCorrect = isCorrectAnswer(userAnswer, currentQuestion.correctAnswer);

    const questionResult: QuestionResult = {
      question: currentQuestion,
      userAnswer,
      isCorrect,
      answered: true
    };

    // 結果を保存
    this.gameState.results.push(questionResult);
    this.gameState.currentQuestionResult = questionResult;

    return questionResult;
  }

  // 次の問題に進む
  proceedToNextQuestion(): boolean {
    if (!this.gameState) return false;

    this.gameState.currentQuestionIndex++;
    this.gameState.currentQuestionResult = undefined;

    // ゲーム完了チェック
    if (this.gameState.currentQuestionIndex >= this.gameState.questions.length) {
      this.gameState.isGameComplete = true;
      this.gameState.isGameActive = false;
      return false; // ゲーム完了
    }

    return true; // まだ問題が残っている
  }

  // 現在のゲーム状態を取得
  getCurrentGameState(): AnimalQuizGameState | null {
    return this.gameState;
  }

  // 現在の問題を取得
  getCurrentQuestion(): AnimalQuizQuestion | null {
    if (!this.gameState || this.gameState.currentQuestionIndex >= this.gameState.questions.length) {
      return null;
    }
    return this.gameState.questions[this.gameState.currentQuestionIndex];
  }

  // 現在の問題結果を取得
  getCurrentQuestionResult(): QuestionResult | null {
    return this.gameState?.currentQuestionResult || null;
  }

  // クイズ結果を取得
  getQuizResult(): AnimalQuizResult | null {
    if (!this.gameState) return null;

    const correctCount = this.gameState.results.filter(result => result.isCorrect).length;

    return {
      sessionId: uuidv4(),
      date: new Date().toISOString(),
      results: this.gameState.results,
      correctCount,
      totalQuestions: ANIMAL_QUIZ_CONFIG.TOTAL_QUESTIONS
    };
  }

  // ゲームをリセット
  resetQuiz(): void {
    this.gameState = null;
  }

  // ベストスコアの管理（ローカルストレージ）
  saveBestScore(result: AnimalQuizResult): void {
    const bestScores = this.getBestScores();
    bestScores.push({
      date: result.date,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions
    });

    // スコア順にソート（正解数が多い順）
    bestScores.sort((a, b) => b.correctCount - a.correctCount);

    // 上位10件のみ保存
    const topScores = bestScores.slice(0, 10);
    localStorage.setItem('animalQuizBestScores', JSON.stringify(topScores));
  }

  getBestScores(): Array<{date: string, correctCount: number, totalQuestions: number}> {
    const stored = localStorage.getItem('animalQuizBestScores');
    return stored ? JSON.parse(stored) : [];
  }

  getBestScore(): {correctCount: number, totalQuestions: number} | null {
    const scores = this.getBestScores();
    if (scores.length === 0) return null;
    return {
      correctCount: scores[0].correctCount,
      totalQuestions: scores[0].totalQuestions
    };
  }
}

const animalQuizService = AnimalQuizService.getInstance();
export default animalQuizService;