import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { settingsSchema } from '@/lib/aip/domain';
import { database, failure, HttpError, json, limitedBody, owner } from '@/lib/aip/server';
import { requestPhotoEdit } from '@/lib/aip/photo-provider';
import { photoStrength } from '@/lib/aip/photographic';
const enabled=()=>env.AIP_PHOTO_RENDER_ENABLED==='true'&&Boolean(env.OPENAI_API_KEY);
export async function GET(){try{await owner();return json({enabled:enabled(),dailyLimit:10,provider:'OpenAI',model:'gpt-image-2.5-sunburst'});}catch(e){return failure(e);}}
export async function POST(request:Request){
 try{
  const user=await owner(request);
  if(!enabled())throw new HttpError(503,'Photographic rendering needs a connected image service. Instant previews remain available.');
  const raw=await limitedBody(request,4500000);
  let form:FormData;try{form=await new Response(raw,{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();}catch{throw new HttpError(400,'The photo upload could not be read.');}
  if(form.get('consent')!=='true')throw new HttpError(400,'Permission to send this adult portrait to OpenAI is required.');
  const id=z.string().uuid().parse(form.get('requestId'));
  let input:unknown;try{input=JSON.parse(String(form.get('settings')));}catch{throw new HttpError(400,'Appearance settings could not be read.');}
  const settings=settingsSchema.parse(input),photo=form.get('photo');
  if(photoStrength(settings)===0)throw new HttpError(400,'These controls select the original appearance. No photographic request is needed.');
  if(!(photo instanceof File)||photo.type!=='image/jpeg'||photo.size>4000000)throw new HttpError(400,'Use a normalized JPEG up to 4 MB.');
  const signature=new Uint8Array(await photo.slice(0,3).arrayBuffer());if(signature[0]!==255||signature[1]!==216||signature[2]!==255)throw new HttpError(400,'A valid JPEG is required.');
  const db=database(),day=new Date().toISOString().slice(0,10);
  // Atomic quota reservation: concurrent requests cannot exceed the daily account cap.
  const result=await db.prepare('INSERT INTO photo_render_requests(id,owner,day) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM photo_render_requests WHERE owner=? AND day=?)<10 ON CONFLICT(id) DO NOTHING').bind(id,user,day,user,day).run();
  if(result.meta.changes!==1)throw new HttpError(429,'This request was already submitted or the daily limit of 10 renders has been reached. Failed attempts also count.');
  const image=await requestPhotoEdit(env.OPENAI_API_KEY!,photo,settings,id);
  return json({image:`data:image/jpeg;base64,${image}`,provenance:'AI appearance exploration',requestId:id});
 }catch(e){return failure(e);}
}
