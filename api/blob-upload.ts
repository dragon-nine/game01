import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKET, PUBLIC_URL } from './r2-client';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');
  const prefix = searchParams.get('prefix') || '';

  if (!filename) {
    return Response.json({ error: 'filename query param required' }, { status: 400 });
  }

  const pathname = prefix ? `${prefix}${filename}` : filename;

  try {
    const body = new Uint8Array(await req.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: pathname,
      Body: body,
      ContentType: req.headers.get('content-type') || 'application/octet-stream',
    }));

    const url = `${PUBLIC_URL}/${pathname}`;
    return Response.json({ url, pathname });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
