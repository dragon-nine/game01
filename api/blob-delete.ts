import { del } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return Response.json({ error: 'url field required' }, { status: 400 });
    }

    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
