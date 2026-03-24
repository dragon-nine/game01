import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2, BUCKET, PUBLIC_URL } from './r2-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') || '';
  const delimiter = searchParams.get('delimiter') || '';

  try {
    const result = await r2.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ...(delimiter ? { Delimiter: delimiter } : {}),
    }));

    const origin = new URL(req.url).origin;
    const blobs = (result.Contents || []).map((obj) => ({
      url: `${origin}/api/blob-image?key=${encodeURIComponent(obj.Key!)}`,
      downloadUrl: `${PUBLIC_URL}/${obj.Key}`,
      pathname: obj.Key!,
      size: obj.Size || 0,
      uploadedAt: obj.LastModified?.toISOString() || '',
    }));

    const folders = (result.CommonPrefixes || [])
      .map((cp) => cp.Prefix!)
      .filter(Boolean);

    return Response.json({ blobs, folders });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
