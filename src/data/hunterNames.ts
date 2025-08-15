// 厨二っぽいハンター名前リスト（100種類）
export const HUNTER_NAMES = [
  // 闇・光系
  '闇', '光', '影', '輝', '夜', '暁', '黎明', '黄昏', '月', '星',
  '陽', '陰', '煌', '漆黒', '純白', '銀', '金', '紅蓮', '蒼', '翠',
  
  // 自然・元素系
  '炎', '氷', '雷', '風', '嵐', '雲', '霧', '雪', '霜', '露',
  '海', '波', '流', '滝', '岩', '山', '森', '花', '桜', '楓',
  
  // 武器・戦闘系
  '剣', '刃', '槍', '弓', '盾', '鎧', '牙', '爪', '翼', '角',
  '鋼', '刀', '矢', '弾', '砲', '戦', '闘', '撃', '斬', '突',
  
  // 神話・伝説系
  '龍', '鳳', '麒麟', '虎', '狼', '鷹', '蛇', '鴉', '獅子', '豹',
  '神', '魔', '王', '皇', '帝', '覇', '聖', '魂', '霊', '鬼',
  
  // 抽象・概念系
  '無', '夢', '幻', '真', '偽', '空', '虚', '実', '絶', '極',
  '究', '永', '瞬', '刹那', '永遠', '運命', '宿命', '因果', '業', '縁',
  
  // 追加の厨二ワード
  '深淵', '天使', '悪魔', '騎士', '魔王', '英雄', '伝説', '神話', '奇跡', '破滅'
] as const;

// ランダムなハンター名を生成
export const generateRandomHunterName = (): string => {
  const randomIndex = Math.floor(Math.random() * HUNTER_NAMES.length);
  return `ハンター${HUNTER_NAMES[randomIndex]}`;
};

// 特定のインデックスからハンター名を生成（一意性のため）
export const generateHunterNameFromSeed = (seed: string): string => {
  // シード値をハッシュ化して安定したインデックスを生成
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  
  const index = Math.abs(hash) % HUNTER_NAMES.length;
  return `ハンター${HUNTER_NAMES[index]}`;
};
