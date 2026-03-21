import { list } from '@vercel/blob';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const TARGET_DIR = join(import.meta.dirname, '..', 'games', 'game01', 'public');
const PREFIX = 'game01/';

async function main() {
  if (!TOKEN) {
    console.log('[sync-assets] BLOB_READ_WRITE_TOKEN not set, skipping sync');
    return;
  }

  console.log('[sync-assets] Fetching asset list from Vercel Blob...');

  let cursor;
  let synced = 0;

  do {
    const result = await list({ prefix: PREFIX, token: TOKEN, cursor });

    for (const blob of result.blobs) {
      const relativePath = blob.pathname.slice(PREFIX.length);
      if (!relativePath) continue;

      const targetPath = join(TARGET_DIR, relativePath);
      await mkdir(dirname(targetPath), { recursive: true });

      const res = await fetch(blob.url);
      if (!res.ok) {
        console.warn(`[sync-assets] Failed to fetch ${blob.pathname}: ${res.status}`);
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      await writeFile(targetPath, buffer);
      synced++;
      console.log(`  -> ${relativePath} (${(blob.size / 1024).toFixed(1)}KB)`);
    }

    cursor = result.cursor;
  } while (cursor);

  console.log(`[sync-assets] Synced ${synced} files to ${TARGET_DIR}`);
}

main().catch((err) => {
  console.error('[sync-assets] Error:', err);
  process.exit(1);
});
