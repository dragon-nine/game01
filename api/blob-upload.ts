import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const filename = req.query.filename as string;
  const prefix = (req.query.prefix as string) || '';

  if (!filename) {
    return res.status(400).json({ error: 'filename query param required' });
  }

  const pathname = prefix ? `${prefix}${filename}` : filename;

  try {
    const blob = await put(pathname, req, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true,
      addRandomSuffix: false,
    });

    res.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
