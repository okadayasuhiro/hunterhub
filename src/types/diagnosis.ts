// 狩猟鳥獣診断の型定義（修正版）

export interface Animal {
    id: string;            // 英字 ID (ユニーク)
    name: string;          // 和名
    category: string;      // カテゴリ（鳥類/哺乳類）
    energy: number;        // 活動性 (1-10)
    thinking: number;      // 思考性 (1-10)
    social: number;        // 社交性 (1-10)
    stability: number;     // 安定性 (1-10)
    catchphrase: string;   // キャッチフレーズ
    description: string;   // 説明文
}

export interface PersonalityProfile {
    energy: number;        // 活動性 (1-10)
    thinking: number;      // 思考性 (1-10)
    social: number;        // 社交性 (1-10)
    stability: number;     // 安定性 (1-10)
}

export interface Answer {
    questionId: string;    // 質問ID
    choice: 'A' | 'B' | 'C' | 'D';  // 選択肢
}

export interface Question {
    id: string;
    text: string;
    options: Array<{
        text: string;
        energy: number;
        thinking: number;
        social: number;
        stability: number;
    }>;
    weight: number;
}

export interface DiagnosisResult {
    animal: Animal;
    userProfile: PersonalityProfile;
    compatibility: number;
    explanation: string;
    alternatives: Animal[];
}

export interface FallbackResult {
    explanation: string;
    suggestedAnimals: Animal[];
}

export interface DiagnosisState {
    currentQuestion: number;
    answers: Answer[];
    isCompleted: boolean;
    result: DiagnosisResult | null;
    isLoading: boolean;
} 