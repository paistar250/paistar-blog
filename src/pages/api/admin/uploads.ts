import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { uploadDirectory } from '../../../server/config';
import { csrf, endpoint, HttpError, json, readBytes, requireAdmin } from '../../../server/http';
export const POST = endpoint(async context => {
  csrf(context); requireAdmin(context);
  const type = context.request.headers.get('content-type') || '';
  if (!type.startsWith('multipart/form-data;')) throw new HttpError(415,'请选择图片文件。');
  const bytes = await readBytes(context.request,8 * 1024 * 1024);
  let form: FormData;
  try { form = await new Response(bytes as BodyInit,{headers:{'Content-Type':type}}).formData(); }
  catch { throw new HttpError(400,'图片上传格式不正确。'); }
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) throw new HttpError(400,'请选择图片文件。');
  const buffer = Buffer.from(await file.arrayBuffer());
  let optimized: Buffer;
  try {
    const image = sharp(buffer,{limitInputPixels:32_000_000,failOn:'warning'});
    const metadata = await image.metadata();
    if (!['jpeg','png','webp','avif'].includes(metadata.format || '') || (metadata.pages || 1) !== 1) throw new Error();
    optimized = await image.rotate().resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).webp({quality:84}).toBuffer();
  } catch { throw new HttpError(400,'请上传有效的 JPG、PNG、WebP 或 AVIF 静态图片，最大 3200 万像素。'); }
  await mkdir(uploadDirectory(),{recursive:true});
  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(uploadDirectory(),filename),optimized,{mode:0o640,flag:'wx'});
  return json({ url:`/uploads/${filename}`, size:optimized.length },201);
});
