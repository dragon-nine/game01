import { list } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prefix = (req.query.prefix as string) || '';

  try {
    const result = await list({ prefix, token: process.env.BLOB_READ_WRITE_TOKEN });
    res.json({
      blobs: result.blobs.map((b) => ({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
