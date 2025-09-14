import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const FEEDS = [
  { id: 'hokkaido-np', url: 'https://www.hokkaido-np.co.jp/output/7/free/index.ad.xml' },
  { id: 'sankei', url: 'https://assets.wor.jp/rss/rdf/sankei/affairs.rdf' },
  { id: 'nhk', url: 'https://www.nhk.or.jp/rss/news/cat1.xml' },
  { id: 'asahi', url: 'https://www.asahi.com/rss/asahi/national.rdf' },
  { id: 'akt-yahoo', url: 'https://news.yahoo.co.jp/rss/media/akt/all.xml' },
  { id: 'iwatenpv-yahoo', url: 'https://news.yahoo.co.jp/rss/media/iwatenpv/all.xml' }
];
const OUTPUT_HOKKAIDO = path.resolve(process.cwd(), 'public/news/hokkaido.json');
const OUTPUT_SANKEI = path.resolve(process.cwd(), 'public/news/sankei.json');
const OUTPUT_NHK = path.resolve(process.cwd(), 'public/news/nhk.json');
const OUTPUT_ASAHI = path.resolve(process.cwd(), 'public/news/asahi.json');
const OUTPUT_AKT = path.resolve(process.cwd(), 'public/news/akt-yahoo.json');
const OUTPUT_IWATENPV = path.resolve(process.cwd(), 'public/news/iwatenpv-yahoo.json');
const OUTPUT_ALL = path.resolve(process.cwd(), 'public/news/all.json');
const EXCLUDE_PATH = path.resolve(process.cwd(), 'config/news_exclude.json');
const MAX_ITEMS = 50;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const POSITIVE_KEYWORDS = [
  '狩猟','猟','猟友会','ハンター','有害鳥獣','駆除','捕獲','獣害','誤射',
  '銃砲','散弾銃','空気銃','猟期','禁猟','禁猟区','鳥獣保護',
  '鹿','エゾシカ',
  '熊','クマ','ヒグマ','ツキノワグマ','狩猟免許','猟銃','ジビエ','猟師'
];

const NEGATIVE_KEYWORDS = [
  '熊本','熊谷','熊野','くまモン','テディベア','ベアーズ','鹿児島',
  'ヨドバシ','ヨドバシカメラ','鹿沼','鹿沼市','鹿化川','鹿角','鹿角市','男鹿','男鹿市'
];

const STRONG_KEYWORDS = new Set([
  '狩猟','猟','ハンター','有害鳥獣','駆除','捕獲','出没','目撃','獣害',
  'ヒグマ','ツキノワグマ','熊','クマ','鹿','エゾシカ'
]);

function stripCdata(text) {
  if (!text) return '';
  return text.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function extractFirstUrl(text) {
  if (!text) return '';
  const m = text.match(/https?:\/\/[^\s<>"]+/);
  return m ? m[0] : '';
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readExcludeIds() {
  try {
    if (fs.existsSync(EXCLUDE_PATH)) {
      const raw = fs.readFileSync(EXCLUDE_PATH, 'utf-8');
      const json = JSON.parse(raw);
      return new Set(Array.isArray(json.ids) ? json.ids : []);
    }
  } catch (_) {}
  return new Set();
}

function matchKeywords(text) {
  const matched = [];
  for (const kw of POSITIVE_KEYWORDS) {
    if (text.includes(kw)) matched.push(kw);
  }
  const negatives = [];
  for (const kw of NEGATIVE_KEYWORDS) {
    if (text.includes(kw)) negatives.push(kw);
  }
  let score = 0;
  for (const kw of matched) score += STRONG_KEYWORDS.has(kw) ? 2 : 1;
  for (const kw of negatives) score -= 3;
  return { matched, negatives, score };
}

function parseItems(xml) {
  const items = [];
  const parts = xml.split('<item');
  if (parts.length <= 1) return items;
  if (process.env.DEBUG) {
    console.log('parts length:', parts.length - 1);
  }
  for (let i = 1; i < parts.length; i++) {
    const after = parts[i];
    const endIdx = after.indexOf('</item>');
    if (process.env.DEBUG && i <= 3) {
      console.log(`part#${i} has end?`, endIdx >= 0);
      if (endIdx < 0) {
        console.log(after.slice(0, 120));
      }
    }
    if (endIdx === -1) continue;
    const block = '<item' + after.slice(0, endIdx + '</item>'.length);

    let title = extractTag(block, 'title');
    title = stripCdata(title) || title;

    let description = extractTag(block, 'description');
    description = stripCdata(description) || description;

    let link = extractTag(block, 'link');
    link = stripCdata(link) || link;
    if (!link) {
      link = extractFirstUrl(block);
    }

    let published = extractTag(block, 'pubDate');
    if (!published) {
      const dc = extractTag(block, 'dc:date');
      if (dc) published = dc;
    }
    let publishedAtIso = '';
    if (published) {
      const d = new Date(published);
      if (!isNaN(d.getTime())) publishedAtIso = d.toISOString();
    }

    if (process.env.DEBUG && i <= 3) {
      console.log(`title#${i}:`, title);
      console.log(`link#${i}:`, link);
    }
    if (!title || !link) continue;
    items.push({ title, description, link, publishedAt: publishedAtIso });
  }
  return items;
}

async function fetchAndFilter(feed) {
  const res = await fetch(feed.url, { headers: { 'User-Agent': 'hantore-news-fetcher/1.0' } });
  if (!res.ok) throw new Error(`Fetch failed ${feed.id}: ${res.status}`);
  const xml = await res.text();
  if (process.env.DEBUG) {
    console.log(`[${feed.id}] xml length: ${xml.length}, has <item>?`, xml.includes('<item>'));
  }
  const rawItems = parseItems(xml);
  if (process.env.DEBUG) {
    console.log(`[${feed.id}] raw items: ${rawItems.length}`);
  }
  const excludeIds = readExcludeIds();
  const filtered = [];
  for (const it of rawItems) {
    const hay = `${it.title} ${it.description || ''}`;
    const { matched, negatives, score } = matchKeywords(hay);
    if (matched.length < 1 || negatives.length > 0) continue;

    // Only include items within the last 7 days (require valid publishedAt)
    if (!it.publishedAt) continue;
    const publishedTime = Date.parse(it.publishedAt);
    if (isNaN(publishedTime)) continue;
    const ageMs = Date.now() - publishedTime;
    if (ageMs < 0 || ageMs > SEVEN_DAYS_MS) continue;

    const id = sha256(it.link || `${it.title}|${it.publishedAt}`);
    if (excludeIds.has(id)) continue;
    filtered.push({
      id,
      source: feed.id,
      title: it.title,
      link: it.link,
      publishedAt: it.publishedAt,
      matchedKeywords: matched,
      score,
      excluded: false
    });
  }
  filtered.sort((a, b) => {
    const ta = a.publishedAt || '';
    const tb = b.publishedAt || '';
    if (ta === tb) return (b.score || 0) - (a.score || 0);
    return tb.localeCompare(ta);
  });
  return filtered.slice(0, MAX_ITEMS);
}

async function main() {
  const results = [];
  for (const feed of FEEDS) {
    try {
      const items = await fetchAndFilter(feed);
      results.push({ feedId: feed.id, items });
    } catch (e) {
      console.error(`Failed feed ${feed.id}:`, e.message || e);
      results.push({ feedId: feed.id, items: [] });
    }
  }

  const now = new Date().toISOString();
  const byId = Object.fromEntries(results.map(r => [r.feedId, r.items]));

  // per-source outputs
  const outH = { source: 'hokkaido-np', generatedAt: now, items: byId['hokkaido-np'] || [] };
  const outS = { source: 'sankei', generatedAt: now, items: byId['sankei'] || [] };
  const outN = { source: 'nhk', generatedAt: now, items: byId['nhk'] || [] };
  const outA = { source: 'asahi', generatedAt: now, items: byId['asahi'] || [] };
  const outK = { source: 'akt-yahoo', generatedAt: now, items: byId['akt-yahoo'] || [] };
  const outI = { source: 'iwatenpv-yahoo', generatedAt: now, items: byId['iwatenpv-yahoo'] || [] };

  // all combined (再ソート)
  const combined = [
    ...(byId['hokkaido-np'] || []),
    ...(byId['sankei'] || []),
    ...(byId['nhk'] || []),
    ...(byId['asahi'] || []),
    ...(byId['akt-yahoo'] || []),
    ...(byId['iwatenpv-yahoo'] || [])
  ].sort((a, b) => {
    const ta = a.publishedAt || '';
    const tb = b.publishedAt || '';
    if (ta === tb) return (b.score || 0) - (a.score || 0);
    return tb.localeCompare(ta);
  }).slice(0, MAX_ITEMS);
  const outAll = { source: 'multi', generatedAt: now, items: combined };

  ensureDirFor(OUTPUT_HOKKAIDO);
  ensureDirFor(OUTPUT_SANKEI);
  ensureDirFor(OUTPUT_NHK);
  ensureDirFor(OUTPUT_ASAHI);
  ensureDirFor(OUTPUT_AKT);
  ensureDirFor(OUTPUT_IWATENPV);
  ensureDirFor(OUTPUT_ALL);
  fs.writeFileSync(OUTPUT_HOKKAIDO, JSON.stringify(outH, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_SANKEI, JSON.stringify(outS, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_NHK, JSON.stringify(outN, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_ASAHI, JSON.stringify(outA, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_AKT, JSON.stringify(outK, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_IWATENPV, JSON.stringify(outI, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_ALL, JSON.stringify(outAll, null, 2), 'utf-8');
  console.log(`Wrote Hokkaido=${outH.items.length}, Sankei=${outS.items.length}, NHK=${outN.items.length}, Asahi=${outA.items.length}, All=${outAll.items.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


