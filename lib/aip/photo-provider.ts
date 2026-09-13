import type { Settings } from './domain.ts';
import { photoPrompt } from './photographic.ts';
export async function requestPhotoEdit(key:string,photo:Blob,settings:Settings,requestId:string,send:typeof fetch=fetch){
 const form=new FormData();
 form.set('model','gpt-image-2.5-sunburst');form.set('prompt',photoPrompt(settings));form.set('image',photo,'portrait.jpg');form.set('quality','high');form.set('size','auto');form.set('output_format','jpeg');form.set('n','1');
 const response=await send('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Idempotency-Key':requestId},body:form,signal:AbortSignal.timeout(180000)});
 if(!response.ok)throw Error('The photographic service could not complete this render. No result was applied.');
 if(Number(response.headers.get('content-length')??0)>16000000)throw Error('The photographic result exceeded the image limit.');
 const reader=response.body?.getReader();if(!reader)throw Error('The photographic service returned no image.');
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000000){await reader.cancel();throw Error('The photographic result exceeded the image limit.');}chunks.push(value);}
 const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
 const body=JSON.parse(new TextDecoder().decode(data));const encoded=body.data?.[0]?.b64_json;
 if(typeof encoded!=='string'||encoded.length<100||!/^\/9j\/[A-Za-z0-9+/=\r\n]+$/.test(encoded))throw Error('The photographic service returned an invalid JPEG.');
 return encoded;
}
