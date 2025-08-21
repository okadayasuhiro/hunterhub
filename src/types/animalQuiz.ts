// 動物クイズゲーム用の型定義

export interface AnimalData {
  id: string;
  name: string;
  imageFile: string;
  correctAnswers: string[];
  description: string; // 解説用ダミーテキスト
}

export interface AnimalQuizQuestion {
  id: string;
  animal: AnimalData;
  questionNumber: number;
  totalQuestions: number;
  choices: string[]; // 4つの選択肢
  correctAnswer: string;
}

export interface QuestionResult {
  question: AnimalQuizQuestion;
  userAnswer: string;
  isCorrect: boolean;
  answered: boolean;
}

export interface AnimalQuizResult {
  sessionId: string;
  date: string;
  results: QuestionResult[];
  correctCount: number;
  totalQuestions: number;
}

export interface AnimalQuizGameState {
  questions: AnimalQuizQuestion[];
  results: QuestionResult[];
  currentQuestionIndex: number;
  isGameActive: boolean;
  isGameComplete: boolean;
  currentQuestionResult?: QuestionResult; // 現在の問題の回答結果
}

export const ANIMAL_QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 16,
} as const;
