import { put } from '@vercel/blob';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PUBLIC_DIR = resolve(import.meta.dirname, '..', 'games', 'game01', 'public');
const PREFIX = 'game01/';

// 업로드 대상 폴더들
const FOLDERS = ['character', 'map', 'obstacles', 'ui', 'audio/bgm', 'audio/sfx'];

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

async function main() {
  if (!TOKEN) {
    console.error('[upload] BLOB_READ_WRITE_TOKEN 환경변수를 설정해주세요');
    console.error('  export BLOB_READ_WRITE_TOKEN=vercel_blob_...');
    process.exit(1);
  }

  let uploaded = 0;

  for (const folder of FOLDERS) {
    const dir = resolve(PUBLIC_DIR, folder);
    try {
      const files = getAllFiles(dir);
      for (const filePath of files) {
        const relativePath = filePath.slice(PUBLIC_DIR.length + 1); // e.g. character/rabbit.png
        const blobPath = PREFIX + relativePath;
        const content = await readFile(filePath);

        await put(blobPath, content, {
          access: 'public',
          token: TOKEN,
          allowOverwrite: true,
          addRandomSuffix: false,
        });

        uploaded++;
        console.log(`  ✓ ${blobPath} (${(content.length / 1024).toFixed(1)}KB)`);
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
