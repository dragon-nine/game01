import { list } from '@vercel/blob';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') || '';

  try {
    const result = await list({ prefix, token: process.env.BLOB_READ_WRITE_TOKEN });
    return Response.json({
      blobs: result.blobs.map((b) => ({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
      })),
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
