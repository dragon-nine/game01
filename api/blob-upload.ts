import { put } from '@vercel/blob';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');
  const prefix = searchParams.get('prefix') || '';

  if (!filename) {
    return Response.json({ error: 'filename query param required' }, { status: 400 });
  }

  const pathname = prefix ? `${prefix}${filename}` : filename;

  try {
    const blob = await put(pathname, req.body!, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true,
      addRandomSuffix: false,
    });

    return Response.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
