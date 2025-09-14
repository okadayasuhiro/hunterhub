import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const FEED_URL = 'https://www.hokkaido-np.co.jp/output/7/free/index.ad.xml';
const OUTPUT_PATH = path.resolve(process.cwd(), 'public/news/hokkaido.json');
const EXCLUDE_PATH = path.resolve(process.cwd(), 'config/news_exclude.json');
const MAX_ITEMS = 50;

const POSITIVE_KEYWORDS = [
  '狩猟','猟','猟友会','ハンター','有害鳥獣','駆除','捕獲','出没','目撃','獣害','誤射',
  '銃砲','散弾銃','空気銃','猟期','禁猟','禁猟区','鳥獣保護',
  '鹿','シカ','エゾシカ',
  '熊','クマ','ヒグマ','ツキノワグマ'
];

const NEGATIVE_KEYWORDS = [
  '熊本','熊谷','熊野','くまモン','テディベア','ベアーズ'
];

const STRONG_KEYWORDS = new Set([
  '狩猟','猟','ハンター','有害鳥獣','駆除','捕獲','出没','目撃','獣害',
  'ヒグマ','ツキノワグマ','熊','クマ','鹿','エゾシカ','シカ'
]);

function stripCdata(text) {
  if (!text) return '';
  return text.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i');
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

function matchKeywords(title) {
  const matched = [];
  for (const kw of POSITIVE_KEYWORDS) {
    if (title.includes(kw)) matched.push(kw);
  }
  const negatives = [];
  for (const kw of NEGATIVE_KEYWORDS) {
    if (title.includes(kw)) negatives.push(kw);
  }
  let score = 0;
  for (const kw of matched) score += STRONG_KEYWORDS.has(kw) ? 2 : 1;
  for (const kw of negatives) score -= 3;
  return { matched, negatives, score };
}

function parseItems(xml) {
  const items = [];
  const re = /<item\b[\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[0];
    let title = extractTag(block, 'title');
    title = stripCdata(title) || title;

    let link = extractTag(block, 'link');
    link = stripCdata(link) || link;
    if (!link) {
      // fallback: pick first URL
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

    if (!title || !link) continue;
    items.push({ title, link, publishedAt: publishedAtIso });
  }
  return items;
}

async function main() {
  const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'hantore-news-fetcher/1.0' } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const xml = await res.text();

  const rawItems = parseItems(xml);
  const excludeIds = readExcludeIds();

  const filtered = [];
  for (const it of rawItems) {
    const { matched, negatives, score } = matchKeywords(it.title);
    if (matched.length < 1 || negatives.length > 0) continue;
    const id = sha256(it.link || `${it.title}|${it.publishedAt}`);
    if (excludeIds.has(id)) continue;
    filtered.push({
      id,
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

  const limited = filtered.slice(0, MAX_ITEMS);
  const out = {
    source: 'hokkaido-np',
    generatedAt: new Date().toISOString(),
    items: limited
  };

  ensureDirFor(OUTPUT_PATH);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`Wrote ${limited.length} items to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


