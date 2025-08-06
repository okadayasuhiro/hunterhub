import { questions } from './questions';
import { animals } from './animals';
import { diagnoseUser, OptimizedScoringSystem } from './diagnosisLogic';
import type { PersonalityProfile } from '../../types/diagnosis';

// テスト用関数
export function testDiagnosisSystem() {
    console.log('=== 診断システムテスト開始 ===');

    // 全A選択のテスト
    const allAAnswers = questions.map(q => ({
        questionId: q.id,
        choice: 'A' as const
    }));

    // 全B選択のテスト
    const allBAnswers = questions.map(q => ({
        questionId: q.id,
        choice: 'B' as const
    }));

    // 全C選択のテスト
    const allCAnswers = questions.map(q => ({
        questionId: q.id,
        choice: 'C' as const
    }));

    // 全D選択のテスト
    const allDAnswers = questions.map(q => ({
        questionId: q.id,
        choice: 'D' as const
    }));

    console.log('\n--- 質問とスコア確認 ---');
    questions.forEach((q, i) => {
        console.log(`${q.id}: weight=${q.weight}`);
        q.options.forEach((opt, j) => {
            const choice = ['A', 'B', 'C', 'D'][j];
            console.log(`  ${choice}: E=${opt.energy}, T=${opt.thinking}, S=${opt.social}, St=${opt.stability}`);
        });
    });

    // プロファイル計算の詳細ログ
    console.log('\n--- 全A選択の詳細計算 ---');
    const profileA = calculateProfileWithLog(allAAnswers);
    console.log('結果プロファイル:', profileA);

    console.log('\n--- 全B選択の詳細計算 ---');
    const profileB = calculateProfileWithLog(allBAnswers);
    console.log('結果プロファイル:', profileB);

    console.log('\n--- 全C選択の詳細計算 ---');
    const profileC = calculateProfileWithLog(allCAnswers);
    console.log('結果プロファイル:', profileC);

    console.log('\n--- 全D選択の詳細計算 ---');
    const profileD = calculateProfileWithLog(allDAnswers);
    console.log('結果プロファイル:', profileD);

    // 動物との適合度計算
    console.log('\n--- 動物適合度トップ5 (全A選択) ---');
    testCompatibility(profileA);

    console.log('\n--- 動物適合度トップ5 (全B選択) ---');
    testCompatibility(profileB);

    console.log('\n--- 動物適合度トップ5 (全C選択) ---');
    testCompatibility(profileC);

    console.log('\n--- 動物適合度トップ5 (全D選択) ---');
    testCompatibility(profileD);

    // 実際の診断結果
    console.log('\n--- 実際の診断結果 ---');
    const resultA = diagnoseUser(allAAnswers);
    const resultB = diagnoseUser(allBAnswers);
    const resultC = diagnoseUser(allCAnswers);
    const resultD = diagnoseUser(allDAnswers);

    console.log(`全A選択 → ${resultA.animal.name} (適合度: ${resultA.compatibility}%)`);
    console.log(`全B選択 → ${resultB.animal.name} (適合度: ${resultB.compatibility}%)`);
    console.log(`全C選択 → ${resultC.animal.name} (適合度: ${resultC.compatibility}%)`);
    console.log(`全D選択 → ${resultD.animal.name} (適合度: ${resultD.compatibility}%)`);
}

function calculateProfileWithLog(answers: Array<{ questionId: string; choice: 'A' | 'B' | 'C' | 'D' }>): PersonalityProfile {
    let totalEnergy = 0;
    let totalThinking = 0;
    let totalSocial = 0;
    let totalStability = 0;
    let totalWeight = 0;

    console.log('詳細計算ログ:');

    answers.forEach((answer, index) => {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) return;

        const weight = question.weight;
        const choiceIndex = ['A', 'B', 'C', 'D'].indexOf(answer.choice);
        const scores = question.options[choiceIndex];

        if (scores) {
            const weightedE = scores.energy * weight;
            const weightedT = scores.thinking * weight;
            const weightedS = scores.social * weight;
            const weightedSt = scores.stability * weight;

            totalEnergy += weightedE;
            totalThinking += weightedT;
            totalSocial += weightedS;
            totalStability += weightedSt;
            totalWeight += weight;

            console.log(`Q${index + 1}(${answer.choice}): E=${scores.energy}*${weight}=${weightedE}, T=${scores.thinking}*${weight}=${weightedT}, S=${scores.social}*${weight}=${weightedS}, St=${scores.stability}*${weight}=${weightedSt}`);
        }
    });

    console.log(`合計: E=${totalEnergy}, T=${totalThinking}, S=${totalSocial}, St=${totalStability}, Weight=${totalWeight}`);

    // 平均計算
    const avgE = totalEnergy / totalWeight;
    const avgT = totalThinking / totalWeight;
    const avgS = totalSocial / totalWeight;
    const avgSt = totalStability / totalWeight;

    console.log(`平均: E=${avgE}, T=${avgT}, S=${avgS}, St=${avgSt}`);

    // 現在の正規化（問題がある可能性）
    const normalizedE = Math.round(avgE * 10 / 9);
    const normalizedT = Math.round(avgT * 10 / 9);
    const normalizedS = Math.round(avgS * 10 / 9);
    const normalizedSt = Math.round(avgSt * 10 / 9);

    console.log(`正規化後: E=${normalizedE}, T=${normalizedT}, S=${normalizedS}, St=${normalizedSt}`);

    return {
        energy: normalizedE,
        thinking: normalizedT,
        social: normalizedS,
        stability: normalizedSt
    };
}

function testCompatibility(userProfile: PersonalityProfile) {
    const matches = animals.map(animal => {
        const distance = Math.sqrt(
            Math.pow(userProfile.energy - animal.energy, 2) +
            Math.pow(userProfile.thinking - animal.thinking, 2) +
            Math.pow(userProfile.social - animal.social, 2) +
            Math.pow(userProfile.stability - animal.stability, 2)
        );

        const maxDistance = 18;
        const compatibility = Math.max(0, 100 - (distance / maxDistance) * 100);

        return {
            animal,
            distance,
            compatibility: Math.round(compatibility)
        };
    }).sort((a, b) => b.compatibility - a.compatibility);

    matches.slice(0, 5).forEach((match, index) => {
        const { animal, distance, compatibility } = match;
        console.log(`${index + 1}. ${animal.name}: E=${animal.energy}, T=${animal.thinking}, S=${animal.social}, St=${animal.stability} (距離: ${distance.toFixed(2)}, 適合度: ${compatibility}%)`);
    });
}

// ブラウザのコンソールで実行するためのグローバル関数
(window as any).testDiagnosisSystem = testDiagnosisSystem; 