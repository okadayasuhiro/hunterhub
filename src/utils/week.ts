export interface WeekInfo {
  year: number;
  week: number;
  label: string; // YYYY.WW週
}

function dateInTokyo(base?: Date): Date {
  const now = base ?? new Date();
  const parts = now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
  return new Date(parts);
}

// ISO week algorithm based on Thursday of current week
export function getISOWeekInfoTokyo(base?: Date): WeekInfo {
  const d = dateInTokyo(base);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week decides the year.
  const day = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  const year = date.getUTCFullYear();
  const label = `${year}.${String(week).padStart(2, '0')}週`;
  return { year, week, label };
}

export function getCurrentWeekInfoTokyo(): WeekInfo {
  return getISOWeekInfoTokyo(new Date());
}


/**
 * 東京タイムゾーンの当該ISO週の開始/終了(排他的)ISO8601文字列を返す
 * start: 月曜 00:00:00.000 (JST)
 * endExclusive: 翌週 月曜 00:00:00.000 (JST)
 */
export function getCurrentWeekRangeTokyo(): { startISO: string; endExclusiveISO: string } {
  const base = dateInTokyo();
  // base の JST から週の月曜 0:00 を計算
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();
  const tmp = new Date(y, m, d, 0, 0, 0, 0);
  // JSのgetDay(): Sun=0..Sat=6 → 月曜起点のオフセット
  const day = tmp.getDay();
  const offsetToMonday = (day + 6) % 7; // Mon=0
  const monday = new Date(tmp.getTime());
  monday.setDate(tmp.getDate() - offsetToMonday);
  monday.setHours(0, 0, 0, 0);
  // 翌週月曜
  const nextMonday = new Date(monday.getTime());
  nextMonday.setDate(monday.getDate() + 7);
  nextMonday.setHours(0, 0, 0, 0);
  // JSTベースだがISO化のため、そのままtoISOStringでUTC変換される
  // AppSyncの文字列比較（ISO8601）では lexicographical に整合する
  return { startISO: monday.toISOString(), endExclusiveISO: nextMonday.toISOString() };
}


