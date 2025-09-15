import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ALL_JSON = path.resolve(ROOT, 'public/news/all.json');
const OUT_HTML = path.resolve(ROOT, 'public/news/index.html');
const MAX_ITEMS = 20;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatDate(dt) {
  try {
    return new Date(dt).toISOString();
  } catch (_) {
    return '';
  }
}

function sourceDisplayName(sourceId) {
  switch (sourceId) {
    case 'hokkaido-np': return '北海道新聞';
    case 'sankei': return '産経新聞';
    case 'nhk': return 'NHKニュース';
    case 'asahi': return '朝日新聞';
    case 'akt-yahoo': return '秋田テレビ（Yahoo!）';
    case 'iwatenpv-yahoo': return '岩手日報（Yahoo!）';
    case 'wordleaf-yahoo': return 'THE PAGE（Yahoo!）';
    case 'stv-yahoo': return 'STVニュース北海道（Yahoo!）';
    default: return 'ニュース';
  }
}

function buildHtml({ items, generatedAt }) {
  const siteUrl = 'https://hantore.net';
  const pageUrl = `${siteUrl}/news`;
  const title = '狩猟ニュース（直近7日・1日2回更新）｜ハントレ';
  const description = 'ハンター向け狩猟ニュースを1日2回自動収集。北海道新聞・NHK・産経・朝日・秋田テレビ・岩手日報などから直近7日分を厳選してお届けします。';

  const ldItems = items.slice(0, MAX_ITEMS).map((it, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    item: {
      '@type': 'NewsArticle',
      headline: it.title,
      url: it.link,
      datePublished: it.publishedAt ? formatDate(it.publishedAt) : undefined,
      author: { '@type': 'Organization', name: sourceDisplayName(it.source) },
      sourceOrganization: { '@type': 'Organization', name: sourceDisplayName(it.source) },
      articleBody: it.description ? String(it.description).slice(0, 200) : undefined,
      image: it.imageUrl ? [{ '@type': 'ImageObject', url: it.imageUrl }] : undefined
    }
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '狩猟ニュース 最新一覧',
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: ldItems
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: '狩猟ニュース', item: pageUrl }
    ]
  };

  const listHtml = items.slice(0, MAX_ITEMS).map(it => {
    const dateStr = it.publishedAt ? new Date(it.publishedAt).toLocaleString('ja-JP') : '';
    const src = sourceDisplayName(it.source);
    const thumb = it.imageUrl ? `<img src="${it.imageUrl}" alt="" style="width:40px;height:22px;object-fit:cover;border-radius:4px;margin-left:8px;"/>` : '';
    return `<li class="news-item"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><a href="${it.link}" rel="nofollow noopener noreferrer" target="_blank" style="flex:1">${it.title}</a>${thumb}</div><div class="meta">${dateStr} ・ 出典: ${src}</div></li>`;
  }).join('\n');

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="canonical" href="${pageUrl}">
<meta name="description" content="${description}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ハントレ">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.6;margin:0;padding:0;background:#fafafa;color:#111}
.header{background:#021D40;color:#fff;padding:16px}
.container{max-width:960px;margin:0 auto;padding:16px}
.h1{font-size:20px;font-weight:700;margin:0}
.actions{margin-top:8px}
.back{display:inline-block;padding:6px 10px;background:#1e40af;color:#fff;text-decoration:none;border-radius:6px;font-size:12px}
.updated{font-size:12px;color:#666;margin:12px 0}
.news-list{list-style:none;padding:0;margin:0}
.news-item{padding:12px 0;border-bottom:1px solid #e5e7eb}
.news-item a{color:#1d4ed8;text-decoration:none}
.news-item a:hover{text-decoration:underline}
.meta{font-size:12px;color:#6b7280;margin-top:2px}
</style>
</head>
<body>
<div class="header">
  <div class="container">
    <div class="h1">狩猟ニュース</div>
    <div class="actions"><a class="back" href="/">トップへ戻る</a></div>
  </div>
</div>
<div class="container">
  <div class="updated">最終更新: ${new Date(generatedAt || Date.now()).toLocaleString('ja-JP')}</div>
  <ul class="news-list">${listHtml}</ul>
  <div style="margin-top:16px;text-align:center">
    <a href="/" style="display:inline-block;min-width:10rem;padding:10px 24px;background:#e5e7eb;color:#374151;border-radius:0.5rem;font-weight:500;text-decoration:none" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">ホームに戻る</a>
  </div>
</div>
</body>
</html>`;
}

function main() {
  const raw = fs.readFileSync(ALL_JSON, 'utf-8');
  const json = JSON.parse(raw);
  const now = Date.now();
  const items = (json.items || []).filter(it => {
    if (!it || !it.link) return false;
    if (!it.publishedAt) return false;
    const t = Date.parse(it.publishedAt);
    if (isNaN(t)) return false;
    const age = now - t;
    return age >= 0 && age <= SEVEN_DAYS_MS;
  });
  const html = buildHtml({ items, generatedAt: json.generatedAt });
  ensureDirFor(OUT_HTML);
  fs.writeFileSync(OUT_HTML, html, 'utf-8');
  console.log(`Generated ${OUT_HTML} with ${items.length} items.`);
}

main();
