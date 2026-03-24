import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { readdirSync, statSync } from 'node:fs';
const ENDPOINT = process.env.R2_ENDPOINT;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME || 'dragon-nine';

const PUBLIC_DIR = resolve(import.meta.dirname, '..', 'games', 'game01', 'public');
const PREFIX = 'game01/';

const FOLDERS = ['character', 'map', 'ui', 'audio/bgm', 'audio/sfx', 'background', 'game-over-screen', 'main-screen', 'layout'];

function getAllFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...getAllFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function getMimeType(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const types = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav',
    json: 'application/json',
  };
  return types[ext] || 'application/octet-stream';
}

async function main() {
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.error('[upload] R2 환경변수를 설정해주세요');
    console.error('  export R2_ACCESS_KEY_ID=...');
    console.error('  export R2_SECRET_ACCESS_KEY=...');
    process.exit(1);
  }

  const r2 = new S3Client({
    region: 'auto',
    endpoint: ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });

  let uploaded = 0;

  for (const folder of FOLDERS) {
    const dir = resolve(PUBLIC_DIR, folder);
    try {
      const files = getAllFiles(dir);
      for (const filePath of files) {
        const relativePath = filePath.slice(PUBLIC_DIR.length + 1);
        const key = PREFIX + relativePath;
        const content = await readFile(filePath);

        await r2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: content,
          ContentType: getMimeType(filePath),
        }));

        uploaded++;
        console.log(`  ✓ ${key} (${(content.length / 1024).toFixed(1)}KB)`);
      }
    } catch (err) {
      console.warn(`  [skip] ${folder}: ${err.message}`);
    }
  }

  console.log(`\n[upload] ${uploaded}개 파일 업로드 완료!`);
}

main().catch((err) => {
  console.error('[upload] Error:', err);
  process.exit(1);
});
