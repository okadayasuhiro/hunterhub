import type { PersonalityProfile } from '../types/diagnosis';

// ユーザープロファイルを短いハッシュに変換
export function encodeUserProfile(profile: PersonalityProfile): string {
    // 各値を16進数に変換して結合（例: {energy:8,thinking:7,social:6,stability:5} → "8765"）
    const encoded = `${profile.energy.toString(16)}${profile.thinking.toString(16)}${profile.social.toString(16)}${profile.stability.toString(16)}`;
    return encoded;
}

// ハッシュからユーザープロファイルを復元
export function decodeUserProfile(hash: string): PersonalityProfile | null {
    if (hash.length !== 4) {
        return null;
    }

    try {
        const energy = parseInt(hash[0], 16);
        const thinking = parseInt(hash[1], 16);
        const social = parseInt(hash[2], 16);
        const stability = parseInt(hash[3], 16);

        // 値の範囲チェック（1-10の範囲）
        if (energy < 1 || energy > 10 || thinking < 1 || thinking > 10 ||
            social < 1 || social > 10 || stability < 1 || stability > 10) {
            return null;
        }

        return { energy, thinking, social, stability };
    } catch (error) {
        return null;
    }
}

// 適合度を計算（診断ロジックから抽出）
export function calculateCompatibility(userProfile: PersonalityProfile, animalProfile: { energy: number; thinking: number; social: number; stability: number }): number {
    const distance = Math.sqrt(
        Math.pow(userProfile.energy - animalProfile.energy, 2) +
        Math.pow(userProfile.thinking - animalProfile.thinking, 2) +
        Math.pow(userProfile.social - animalProfile.social, 2) +
        Math.pow(userProfile.stability - animalProfile.stability, 2)
    );

    // 最大距離は約12.65（各軸で9の差がある場合）
    // これを100%スケールに変換
    const maxDistance = Math.sqrt(4 * Math.pow(9, 2)); // 18
    const compatibility = Math.max(0, Math.round(100 - (distance / maxDistance) * 100));

    return compatibility;
} 