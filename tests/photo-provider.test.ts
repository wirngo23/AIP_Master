import test from 'node:test';
import assert from 'node:assert/strict';
import { requestPhotoEdit } from '../lib/aip/photo-provider.ts';
import { baselineSettings } from '../lib/aip/domain.ts';
test('provider uses one fixed endpoint, server credentials, original photo and bounded generation parameters',async()=>{
 let calls=0;const image='/9j/'+ 'A'.repeat(120);
 const send=(async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/images/edits');assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer fixture');const f=options?.body as FormData;assert.equal(f.get('model'),'gpt-image-2.5-sunburst');assert.equal(f.get('n'),'1');assert.equal(f.get('output_format'),'jpeg');assert.ok(f.get('image') instanceof Blob);return Response.json({data:[{b64_json:image}]});}) as typeof fetch;
 assert.equal(await requestPhotoEdit('fixture',new Blob(['photo']),baselineSettings(),'id',send),image);assert.equal(calls,1);
});
test('provider rejects failed or malformed responses without automatic paid retries',async()=>{
 let calls=0;const fail=(async()=>{calls++;return new Response('',{status:429});}) as typeof fetch;
 await assert.rejects(requestPhotoEdit('x',new Blob(),baselineSettings(),'id',fail),/could not complete/);assert.equal(calls,1);
 await assert.rejects(requestPhotoEdit('x',new Blob(),baselineSettings(),'id',(async()=>Response.json({data:[{b64_json:'not an image'}]})) as typeof fetch),/invalid JPEG/);
});
