import { diagnoseUser } from '../data/diagnosis/diagnosisLogic';
import type { PersonalityProfile } from '../types/diagnosis';

// デバッグ用のグローバル関数を設定
export function setupDiagnosisDebug() {
    if (typeof window === 'undefined') return;

    // デバッグモード有効化
    (window as any).DEBUG_DIAGNOSIS = true;

    // パターンテスト関数
    (window as any).testPattern = function (pattern: string) {
        console.log('=== パターンテスト ===');
        console.log('パターン:', pattern);

        if (pattern.length !== 12 || !/^[ABCD]+$/i.test(pattern)) {
            console.error('12文字のA/B/C/Dパターンを入力してください');
            return null;
        }

        const answers = pattern.toUpperCase().split('').map((choice, index) => ({
            questionId: `Q${index + 1}`,
            choice: choice as 'A' | 'B' | 'C' | 'D'
        }));

        try {
            const result = diagnoseUser(answers);
            console.log('結果動物:', result.animal.name);
            console.log('プロファイル:', result.userProfile);
            console.log('適合度:', result.compatibility + '%');
            console.log('詳細:', result);
            return result;
        } catch (error) {
            console.error('診断エラー:', error);
            return null;
        }
    };

    // 特定パターンのテスト関数
    (window as any).testInoshishi = () => (window as any).testPattern('AAAAAAAACAAA');
    (window as any).testTen = () => (window as any).testPattern('AAAAAAAACAAA');
    (window as any).testKitsune = () => (window as any).testPattern('BBBBBBBBADDD');
    (window as any).testKawau = () => (window as any).testPattern('BBBBBBBBABBB');

    // 計算検証用関数
    (window as any).calculateProfileDebug = function (pattern: string): PersonalityProfile | null {
        if (pattern.length !== 12 || !/^[ABCD]+$/i.test(pattern)) {
            console.error('12文字のA/B/C/Dパターンを入力してください');
            return null;
        }

        // 質問データ（実際と同じ）
        const questions = [
            {
                weight: 1.15, options: [
                    { energy: 8, thinking: 3, social: 4, stability: 2 },
                    { energy: 3, thinking: 8, social: 5, stability: 7 },
                    { energy: 5, thinking: 5, social: 8, stability: 4 },
                    { energy: 6, thinking: 6, social: 6, stability: 8 }
                ]
            },
            {
                weight: 1.10, options: [
                    { energy: 7, thinking: 4, social: 3, stability: 5 },
                    { energy: 4, thinking: 9, social: 4, stability: 6 },
                    { energy: 6, thinking: 6, social: 8, stability: 4 },
                    { energy: 5, thinking: 7, social: 5, stability: 8 }
                ]
            },
            {
                weight: 1.05, options: [
                    { energy: 8, thinking: 3, social: 4, stability: 3 },
                    { energy: 4, thinking: 8, social: 3, stability: 6 },
                    { energy: 5, thinking: 5, social: 8, stability: 5 },
                    { energy: 6, thinking: 6, social: 5, stability: 8 }
                ]
            },
            {
                weight: 1.20, options: [
                    { energy: 9, thinking: 3, social: 4, stability: 2 },
                    { energy: 3, thinking: 8, social: 2, stability: 7 },
                    { energy: 6, thinking: 4, social: 9, stability: 4 },
                    { energy: 5, thinking: 6, social: 5, stability: 9 }
                ]
            },
            {
                weight: 0.95, options: [
                    { energy: 8, thinking: 5, social: 3, stability: 4 },
                    { energy: 3, thinking: 8, social: 2, stability: 8 },
                    { energy: 6, thinking: 4, social: 9, stability: 5 },
                    { energy: 5, thinking: 6, social: 6, stability: 8 }
                ]
            },
            {
                weight: 1.00, options: [
                    { energy: 8, thinking: 6, social: 4, stability: 3 },
                    { energy: 4, thinking: 9, social: 3, stability: 6 },
                    { energy: 6, thinking: 5, social: 8, stability: 5 },
                    { energy: 5, thinking: 6, social: 6, stability: 7 }
                ]
            },
            {
                weight: 1.10, options: [
                    { energy: 7, thinking: 5, social: 2, stability: 4 },
                    { energy: 4, thinking: 9, social: 4, stability: 7 },
                    { energy: 6, thinking: 6, social: 9, stability: 3 },
                    { energy: 5, thinking: 7, social: 5, stability: 8 }
                ]
            },
            {
                weight: 1.15, options: [
                    { energy: 9, thinking: 4, social: 3, stability: 3 },
                    { energy: 5, thinking: 8, social: 3, stability: 7 },
                    { energy: 6, thinking: 5, social: 8, stability: 5 },
                    { energy: 4, thinking: 7, social: 6, stability: 8 }
                ]
            },
            {
                weight: 1.25, options: [
                    { energy: 8, thinking: 7, social: 4, stability: 4 },
                    { energy: 4, thinking: 8, social: 5, stability: 7 },
                    { energy: 6, thinking: 5, social: 8, stability: 6 },
                    { energy: 5, thinking: 6, social: 6, stability: 8 }
                ]
            },
            {
                weight: 1.20, options: [
                    { energy: 8, thinking: 5, social: 3, stability: 4 },
                    { energy: 4, thinking: 9, social: 4, stability: 6 },
                    { energy: 6, thinking: 6, social: 8, stability: 5 },
                    { energy: 5, thinking: 7, social: 5, stability: 8 }
                ]
            },
            {
                weight: 1.15, options: [
                    { energy: 9, thinking: 4, social: 6, stability: 3 },
                    { energy: 3, thinking: 8, social: 4, stability: 7 },
                    { energy: 5, thinking: 6, social: 8, stability: 6 },
                    { energy: 6, thinking: 7, social: 5, stability: 8 }
                ]
            },
            {
                weight: 1.05, options: [
                    { energy: 7, thinking: 5, social: 3, stability: 5 },
                    { energy: 4, thinking: 8, social: 4, stability: 7 },
                    { energy: 6, thinking: 6, social: 8, stability: 4 },
                    { energy: 5, thinking: 7, social: 6, stability: 7 }
                ]
            }
        ];

        let totalEnergy = 0, totalThinking = 0, totalSocial = 0, totalStability = 0, totalWeight = 0;

        console.log('=== 詳細計算 ===');

        pattern.toUpperCase().split('').forEach((choice, index) => {
            const question = questions[index];
            const choiceIndex = ['A', 'B', 'C', 'D'].indexOf(choice);
            const scores = question.options[choiceIndex];
            const weight = question.weight;

            const weightedE = scores.energy * weight;
            const weightedT = scores.thinking * weight;
            const weightedS = scores.social * weight;
            const weightedSt = scores.stability * weight;

            totalEnergy += weightedE;
            totalThinking += weightedT;
            totalSocial += weightedS;
            totalStability += weightedSt;
            totalWeight += weight;

            console.log(`Q${index + 1}(${choice}): E=${scores.energy}*${weight}=${weightedE.toFixed(2)}, T=${scores.thinking}*${weight}=${weightedT.toFixed(2)}, S=${scores.social}*${weight}=${weightedS.toFixed(2)}, St=${scores.stability}*${weight}=${weightedSt.toFixed(2)}`);
        });

        const avgE = totalEnergy / totalWeight;
        const avgT = totalThinking / totalWeight;
        const avgS = totalSocial / totalWeight;
        const avgSt = totalStability / totalWeight;

        console.log(`合計: E=${totalEnergy.toFixed(2)}, T=${totalThinking.toFixed(2)}, S=${totalSocial.toFixed(2)}, St=${totalStability.toFixed(2)}, Weight=${totalWeight.toFixed(2)}`);
        console.log(`平均: E=${avgE.toFixed(2)}, T=${avgT.toFixed(2)}, S=${avgS.toFixed(2)}, St=${avgSt.toFixed(2)}`);

        const profile = {
            energy: Math.max(1, Math.min(10, Math.round(avgE))),
            thinking: Math.max(1, Math.min(10, Math.round(avgT))),
            social: Math.max(1, Math.min(10, Math.round(avgS))),
            stability: Math.max(1, Math.min(10, Math.round(avgSt)))
        };

        console.log('正規化後プロファイル:', profile);
        return profile;
    };

    console.log('🔍 診断デバッグ機能が有効になりました！');
    console.log('使用方法:');
    console.log('- testPattern("AAAAAAAACAAA") - カスタムパターンテスト');
    console.log('- testInoshishi() - イノシシパターンテスト');
    console.log('- testKitsune() - キツネパターンテスト');
    console.log('- calculateProfileDebug("AAAAAAAACAAA") - 詳細計算表示');
} 