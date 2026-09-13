import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { baselineSettings } from '../lib/aip/domain.ts';
import { photoRenderKey, photoPrompt, regionalAlpha, framingMatches, topOriginMaskIndex, photoStrength } from '../lib/aip/photographic.ts';
import type { FaceGeometry } from '../lib/aip/appearance.ts';
const pair:[{x:number;y:number},{x:number;y:number}]=[{x:.3,y:.6},{x:.7,y:.6}];
const f:FaceGeometry={cheeks:pair,jaw:pair,brows:pair,corners:pair,lips:{x:.5,y:.4},chin:{x:.5,y:.25},noseBase:{x:.5,y:.52},width:.5,height:.5,lipWidth:.2,lipHeight:.04};
test('photographic output is invalidated by source or selected appearance changes, not comparison position',()=>{
 const s={...baselineSettings('man'),editMode:'beard' as const,beard:'boxed' as const,beardDensity:72};
 assert.equal(photoRenderKey('a',s),photoRenderKey('a',{...s,previewOriginal:false}));
 assert.notEqual(photoRenderKey('a',s),photoRenderKey('b',s));
 assert.notEqual(photoRenderKey('a',s),photoRenderKey('a',{...s,beardDensity:30}));
});
test('regional rendering preserves original lips and upper face outside a beard request',()=>{
 assert.equal(regionalAlpha(f,'beard',.5,.4),0);
 assert.equal(regionalAlpha(f,'beard',.5,.7),0);
 assert.ok(regionalAlpha(f,'beard',.6,.34)>.5);
 assert.equal(regionalAlpha(f,'lips',.5,.7),0);
 assert.ok(regionalAlpha(f,'lips',.5,.4)>.9);
});
test('photo rendering prompt expresses cosmetic intent without converting percentages into doses',()=>{
 const p=photoPrompt({...baselineSettings('man'),editMode:'beard',beard:'boxed',beardDensity:72});
 assert.match(p,/identity/i);assert.match(p,/boxed/i);assert.match(p,/not.*dose/i);
 assert.doesNotMatch(p,/72\s*(units|ml)/i);
});
test('large framing changes are rejected before compositing',()=>{
 assert.ok(framingMatches(f,f));
 assert.equal(framingMatches(f,{...f,width:f.width*1.35}),false);
 assert.equal(framingMatches(f,{...f,brows:[{x:.55,y:.6},{x:.95,y:.6}]}),false);
});
test('jawline composite cannot change the neck or background below the chin',()=>{
 assert.equal(regionalAlpha(f,'jawline',.5,0),0);
 assert.equal(regionalAlpha(f,'jawline',.5,.15),0);
 assert.ok(regionalAlpha(f,'jawline',.6,.32)>.5);
});
test('canvas sampling reverses the WebGL-oriented hair mask rows',()=>{
 assert.equal(topOriginMaskIndex(4,3,1,0),9);
 assert.equal(topOriginMaskIndex(4,3,1,2),1);
});
test('photographic jaw direction follows the archetype when no override exists',()=>{
 assert.match(photoPrompt({...baselineSettings(),editMode:'jawline',jaw:40}),/direction -1/);
});

test('focused photographic intensity and progression endpoints preserve baseline',()=>{const s={...baselineSettings(),editMode:'lips' as const,lip:65};assert.equal(photoStrength({...s,intensity:0}),0);assert.equal(photoStrength({...s,phase:0}),0);assert.equal(photoStrength({...s,phase:100}),0);assert.equal(photoStrength({...s,phase:50,intensity:50}),.5);assert.match(photoPrompt({...s,intensity:0}),/Effective visual strength is 0 percent/);});

test('quota migration and atomic reservation cap requests per owner and day',()=>{const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0001_photo_render_requests.sql',import.meta.url),'utf8'));const sql=readFileSync(new URL('../app/api/photo-render/route.ts',import.meta.url),'utf8').match(/prepare\('([^']*INSERT INTO photo_render_requests[^']*)'\)/)![1];const insert=db.prepare(sql);for(let i=0;i<10;i++)assert.equal(Number(insert.run(String(i),'a','day','a','day').changes),1);assert.equal(Number(insert.run('11','a','day','a','day').changes),0);assert.equal(Number(insert.run('12','b','day','b','day').changes),1);assert.equal(Number(insert.run('12','b','day','b','day').changes),0);assert.equal(Number(insert.run('13','a','next','a','next').changes),1);db.close();});
