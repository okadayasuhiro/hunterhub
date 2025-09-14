import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const ROOT = process.cwd();
const INPUT = path.resolve(ROOT, 'public/images/404deer.png');
const OUTPUT = path.resolve(ROOT, 'public/images/404deer.webp');

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error('Input not found:', INPUT);
    process.exit(1);
  }
  await sharp(INPUT).webp({ quality: 90 }).toFile(OUTPUT);
  console.log('Converted to', OUTPUT);
}

main().catch(err => { console.error(err); process.exit(1); });
