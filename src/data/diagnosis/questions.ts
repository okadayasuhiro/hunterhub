import type { Question } from '../../types/diagnosis';

// 最適化された12問診断システム（拡張版）
export const questions: Question[] = [
    // 質問群A: 思考・判断パターン（4問）
    {
        id: 'Q1',
        text: '新しい挑戦に直面した時、あなたが最初に思うことは？',
        options: [
            {
                text: '面白そう！すぐやってみよう',
                energy: 10,
                thinking: 2,
                social: 4,
                stability: 1
            },
            {
                text: 'まず情報を集めて計画を立てよう',
                energy: 2,
                thinking: 10,
                social: 5,
                stability: 8
            },
            {
                text: '経験者に相談してみよう',
                energy: 5,
                thinking: 5,
                social: 10,
                stability: 4
            },
            {
                text: '様子を見ながら慎重に進めよう',
                energy: 4,
                thinking: 6,
                social: 6,
                stability: 10
            }
        ],
        weight: 1.15
    },
    {
        id: 'Q2',
        text: '複雑な問題に直面した時、どのように解決しますか？',
        options: [
            {
                text: '直感を信じて行動する',
                energy: 9,
                thinking: 2,
                social: 2,
                stability: 3
            },
            {
                text: 'データを分析して論理的に考える',
                energy: 3,
                thinking: 10,
                social: 3,
                stability: 7
            },
            {
                text: 'チームで議論して解決策を見つける',
                energy: 6,
                thinking: 6,
                social: 10,
                stability: 4
            },
            {
                text: '過去の経験を活かして対処する',
                energy: 4,
                thinking: 8,
                social: 5,
                stability: 10
            }
        ],
        weight: 1.10
    },
    {
        id: 'Q3',
        text: '重要な選択をする時の判断基準は？',
        options: [
            {
                text: '心が躍るかどうか',
                energy: 10,
                thinking: 1,
                social: 3,
                stability: 2
            },
            {
                text: '合理的で効率的か',
                energy: 3,
                thinking: 10,
                social: 2,
                stability: 7
            },
            {
                text: '周囲への影響はどうか',
                energy: 5,
                thinking: 5,
                social: 10,
                stability: 5
            },
            {
                text: 'リスクとリターンのバランス',
                energy: 5,
                thinking: 7,
                social: 5,
                stability: 10
            }
        ],
        weight: 1.05
    },
    {
        id: 'Q4',
        text: 'ストレスを感じた時、どのように対処しますか？',
        options: [
            {
                text: '体を動かして発散する',
                energy: 10,
                thinking: 2,
                social: 3,
                stability: 1
            },
            {
                text: '一人で静かに考える',
                energy: 2,
                thinking: 10,
                social: 1,
                stability: 8
            },
            {
                text: '信頼できる人に話を聞いてもらう',
                energy: 6,
                thinking: 4,
                social: 10,
                stability: 4
            },
            {
                text: '環境を変えて気分転換する',
                energy: 7,
                thinking: 6,
                social: 5,
                stability: 10
            }
        ],
        weight: 1.20
    },

    // 質問群B: 価値観・動機（4問）
    {
        id: 'Q5',
        text: '理想の休日で最も大切にしたいのは？',
        options: [
            {
                text: '新しい体験と刺激',
                energy: 10,
                thinking: 4,
                social: 2,
                stability: 3
            },
            {
                text: '静かで集中できる時間',
                energy: 1,
                thinking: 10,
                social: 1,
                stability: 9
            },
            {
                text: '大切な人との時間',
                energy: 6,
                thinking: 4,
                social: 10,
                stability: 6
            },
            {
                text: '心身のリフレッシュ',
                energy: 5,
                thinking: 6,
                social: 6,
                stability: 10
            }
        ],
        weight: 0.95
    },
    {
        id: 'Q6',
        text: '仕事で最もやりがいを感じるのは？',
        options: [
            {
                text: '困難な挑戦を克服すること',
                energy: 10,
                thinking: 6,
                social: 3,
                stability: 2
            },
            {
                text: '専門性を深めること',
                energy: 3,
                thinking: 10,
                social: 2,
                stability: 7
            },
            {
                text: 'チームで成果を出すこと',
                energy: 6,
                thinking: 5,
                social: 10,
                stability: 5
            },
            {
                text: '多様な経験を積むこと',
                energy: 7,
                thinking: 7,
                social: 6,
                stability: 8
            }
        ],
        weight: 1.00
    },
    {
        id: 'Q7',
        text: 'あなたが最も大切にしたい価値は？',
        options: [
            {
                text: '自由と独立',
                energy: 9,
                thinking: 5,
                social: 1,
                stability: 3
            },
            {
                text: '真実と正確性',
                energy: 3,
                thinking: 10,
                social: 3,
                stability: 8
            },
            {
                text: '信頼と絆',
                energy: 5,
                thinking: 4,
                social: 10,
                stability: 7
            },
            {
                text: '成長と変化',
                energy: 7,
                thinking: 8,
                social: 6,
                stability: 9
            }
        ],
        weight: 1.10
    },
    {
        id: 'Q8',
        text: '困難な状況でエネルギーの源となるのは？',
        options: [
            {
                text: '自分の可能性への信念',
                energy: 10,
                thinking: 3,
                social: 2,
                stability: 2
            },
            {
                text: '論理的思考と計画',
                energy: 4,
                thinking: 10,
                social: 2,
                stability: 8
            },
            {
                text: '周囲の人からの支援',
                energy: 6,
                thinking: 4,
                social: 10,
                stability: 5
            },
            {
                text: '安定した基盤と準備',
                energy: 3,
                thinking: 7,
                social: 5,
                stability: 10
            }
        ],
        weight: 1.15
    },

    // 質問群C: 行動・関係パターン（4問）
    {
        id: 'Q9',
        text: 'グループでの自然な役割は？',
        options: [
            {
                text: '新しいアイデアを提案する',
                energy: 9,
                thinking: 8,
                social: 3,
                stability: 3
            },
            {
                text: '情報を分析して意見する',
                energy: 3,
                thinking: 10,
                social: 4,
                stability: 8
            },
            {
                text: '意見をまとめて調整する',
                energy: 6,
                thinking: 6,
                social: 10,
                stability: 6
            },
            {
                text: '必要に応じてサポートする',
                energy: 4,
                thinking: 6,
                social: 8,
                stability: 10
            }
        ],
        weight: 1.25
    },
    {
        id: 'Q10',
        text: '意見の対立が生じた時の対応は？',
        options: [
            {
                text: '自分の信念を貫く',
                energy: 10,
                thinking: 5,
                social: 1,
                stability: 3
            },
            {
                text: '客観的事実で判断する',
                energy: 3,
                thinking: 10,
                social: 3,
                stability: 7
            },
            {
                text: '話し合いで解決を図る',
                energy: 6,
                thinking: 5,
                social: 10,
                stability: 5
            },
            {
                text: '全体最適を考えて妥協点を探す',
                energy: 4,
                thinking: 7,
                social: 6,
                stability: 10
            }
        ],
        weight: 1.20
    },
    {
        id: 'Q11',
        text: '新しい環境に入った時の行動は？',
        options: [
            {
                text: '積極的に関わって存在感を示す',
                energy: 10,
                thinking: 3,
                social: 7,
                stability: 2
            },
            {
                text: 'まず観察して理解を深める',
                energy: 2,
                thinking: 10,
                social: 3,
                stability: 8
            },
            {
                text: '人とのつながりを大切にする',
                energy: 6,
                thinking: 5,
                social: 10,
                stability: 6
            },
            {
                text: '段階的に慣れていく',
                energy: 4,
                thinking: 6,
                social: 6,
                stability: 10
            }
        ],
        weight: 1.15
    },
    {
        id: 'Q12',
        text: '成功した時、最も嬉しいのは？',
        options: [
            {
                text: '個人として認められること',
                energy: 9,
                thinking: 5,
                social: 2,
                stability: 4
            },
            {
                text: '専門性が評価されること',
                energy: 3,
                thinking: 10,
                social: 3,
                stability: 8
            },
            {
                text: 'チームに貢献できたこと',
                energy: 6,
                thinking: 4,
                social: 10,
                stability: 6
            },
            {
                text: '新しい可能性が開けたこと',
                energy: 7,
                thinking: 8,
                social: 6,
                stability: 9
            }
        ],
        weight: 1.05
    }
];

// 質問の重み係数
export const questionWeights: Record<string, number> = {
    Q1: 1.15,
    Q2: 1.10,
    Q3: 1.05,
    Q4: 1.20,
    Q5: 0.95,
    Q6: 1.00,
    Q7: 1.10,
    Q8: 1.15,
    Q9: 1.25,
    Q10: 1.20,
    Q11: 1.15,
    Q12: 1.05
}; 