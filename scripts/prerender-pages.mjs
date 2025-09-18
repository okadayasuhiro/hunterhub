#!/usr/bin/env node
/**
 * 簡易プリレンダリングスクリプト
 * SPA → スタティックHTML変換
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './dist-prerendered';

const ROUTES = [
  { path: '/', filename: 'index.html' },
  { path: '/diagnosis', filename: 'diagnosis/index.html' },
  { path: '/diagnosis/gallery', filename: 'diagnosis/gallery/index.html' },
  { path: '/reflex/instructions', filename: 'reflex/instructions/index.html' },
  { path: '/target/instructions', filename: 'target/instructions/index.html' },
  { path: '/sequence/instructions', filename: 'sequence/instructions/index.html' },
  { path: '/ranking', filename: 'ranking/index.html' },
  { path: '/privacy', filename: 'privacy/index.html' },
  { path: '/terms', filename: 'terms/index.html' },
  { path: '/news', filename: 'news/index.html' }
];

// 動物診断結果ページを動的に生成
const ANIMAL_IDS = [
  'higuma', 'tsukinowaguma', 'araiguma', 'tanuki', 'anaguma', 'kitsune',
  'nihon_shika', 'inoshishi', 'nutria', 'no_usagi', 'yuki_usagi', 'shima_risu',
  'taiwan_risu', 'hakubishin', 'ten', 'itachi_male', 'siberia_itachi', 'mink',
  'noinu', 'noneko', 'kiji', 'yamadori', 'kojukei', 'kijibato', 'hashiboso_garasu',
  'hashibuto_garasu', 'miyamagarasu', 'suzume', 'nyunai_suzume', 'hiyodori',
  'mukudori', 'magamo', 'karugamo', 'kogamo', 'hidorigamo', 'onagagamo',
  'hashibirogamo', 'hoshihajiro', 'kinkurohajiro', 'suzugamo', 'kurogamo',
  'yoshigamo', 'kawau', 'tashigi', 'yamashigi', 'ezo_raicho'
];

// 動物診断結果ページをルートに追加
ANIMAL_IDS.forEach(animalId => {
  ROUTES.push({
    path: `/diagnosis/result/${animalId}`,
    filename: `diagnosis/result/${animalId}/index.html`
  });
});

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function prerenderPage(browser, route) {
  const page = await browser.newPage();
  
  try {
    console.log(`Prerendering: ${route.path}`);
    
    // ページアクセス
    await page.goto(`${BASE_URL}${route.path}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // React レンダリング完了まで待機
    await page.waitForSelector('main, .app, #root', { timeout: 10000 });
    
    // 追加の読み込み待機
    await page.waitForTimeout(2000);
    
    // HTML取得
    const html = await page.content();
    
    // ファイル保存
    const outputPath = path.join(OUTPUT_DIR, route.filename);
    ensureDir(outputPath);
    fs.writeFileSync(outputPath, html, 'utf-8');
    
    console.log(`✅ Saved: ${outputPath}`);
    
  } catch (error) {
    console.error(`❌ Failed to prerender ${route.path}:`, error.message);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Starting prerendering process...');
  
  // 出力ディレクトリ作成
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Puppeteer起動
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // 各ページをプリレンダリング
    for (const route of ROUTES) {
      await prerenderPage(browser, route);
    }
    
    console.log(`✅ Prerendering completed! ${ROUTES.length} pages generated.`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('❌ Prerendering failed:', error);
  process.exit(1);
});
