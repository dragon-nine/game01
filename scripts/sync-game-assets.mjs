import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ENDPOINT = process.env.R2_ENDPOINT;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME || 'dragon-nine';
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const TARGET_DIR = join(import.meta.dirname, '..', 'games', 'game01', 'public');
const PREFIX = 'game01/';

async function main() {
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.log('[sync-assets] R2 credentials not set, skipping sync');
    return;
  }

  const r2 = new S3Client({
    region: 'auto',
    endpoint: ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });

  console.log('[sync-assets] Fetching asset list from Cloudflare R2...');

  let continuationToken;
  let synced = 0;

  do {
    const result = await r2.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: PREFIX,
      ContinuationToken: continuationToken,
    }));

    for (const obj of result.Contents || []) {
      const relativePath = obj.Key.slice(PREFIX.length);
      if (!relativePath) continue;

      const targetPath = join(TARGET_DIR, relativePath);
      await mkdir(dirname(targetPath), { recursive: true });

      const url = `${PUBLIC_URL}/${obj.Key}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[sync-assets] Failed to fetch ${obj.Key}: ${res.status}`);
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      await writeFile(targetPath, buffer);
      synced++;
      console.log(`  -> ${relativePath} (${(obj.Size / 1024).toFixed(1)}KB)`);
    }

    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`[sync-assets] Synced ${synced} files to ${TARGET_DIR}`);
}

main().catch((err) => {
  console.error('[sync-assets] Error:', err);
  process.exit(1);
});
