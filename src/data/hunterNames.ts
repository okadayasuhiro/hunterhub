// ハンター名前生成システム（数字カウントアップ方式）

// グローバルカウンターをLocalStorageで管理
const HUNTER_COUNTER_KEY = 'hunterhub_hunter_counter';

// 次のハンター番号を取得
const getNextHunterNumber = (): number => {
  const currentCounter = localStorage.getItem(HUNTER_COUNTER_KEY);
  const nextNumber = currentCounter ? parseInt(currentCounter, 10) + 1 : 1;
  localStorage.setItem(HUNTER_COUNTER_KEY, nextNumber.toString());
  return nextNumber;
};

// ユーザーIDから一意の番号を生成（既存ユーザー用）
const getUserNumberFromSeed = (seed: string): number => {
  // シード値をハッシュ化して安定した番号を生成
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  
  // 1から9999の範囲で番号を生成
  const number = (Math.abs(hash) % 9999) + 1;
  return number;
};

// ランダムなハンター名を生成（新規ユーザー用）
export const generateRandomHunterName = (): string => {
  const hunterNumber = getNextHunterNumber();
  return `ハンター${hunterNumber}`;
};

// 特定のシードからハンター名を生成（既存ユーザー用）
export const generateHunterNameFromSeed = (seed: string): string => {
  const hunterNumber = getUserNumberFromSeed(seed);
  return `ハンター${hunterNumber}`;
};
