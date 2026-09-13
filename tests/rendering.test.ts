import test from 'node:test';
import assert from 'node:assert/strict';
import { beardCoverage, beardProfile } from '../lib/aip/beard.ts';
import { inspectionAlignment } from '../lib/aip/inspection.ts';
import type { FaceGeometry } from '../lib/aip/appearance.ts';
const pair:[{x:number;y:number},{x:number;y:number}]=[{x:.3,y:.45},{x:.7,y:.45}];
const face:FaceGeometry={cheeks:pair,jaw:pair,brows:[{x:.35,y:.7},{x:.65,y:.7}],corners:[{x:.4,y:.45},{x:.6,y:.45}],lips:{x:.5,y:.45},chin:{x:.5,y:.3},width:.5,height:.5,lipWidth:.2,lipHeight:.04,noseBase:{x:.5,y:.53}};
test('beard styles leave lips, nose and upper face untouched and have distinct coverage',()=>{
 for(const style of ['stubble','boxed','goatee','mustache','chinstrap'] as const){
  assert.equal(beardCoverage(face,style,.5,.45),0);assert.equal(beardCoverage(face,style,.5,.65),0);assert.equal(beardCoverage(face,style,.5,.53),0);
 }
 assert.ok(beardCoverage(face,'boxed',.36,.4)>.5);assert.equal(beardCoverage(face,'goatee',.36,.4),0);
 assert.ok(beardCoverage(face,'mustache',.54,.487)>.2);assert.equal(beardCoverage(face,'mustache',.5,.35),0);
 assert.ok(beardProfile('boxed').length>beardProfile('stubble').length*2);
});
test('close-up framing centers the requested editing region without changing the face settings',()=>{
 const a=inspectionAlignment(face,[1,1],'lips');assert.ok(a.zoom>2);assert.ok(Math.abs((face.lips.x-.5+a.x)*a.zoom+.5-.5)<1e-8);assert.ok(Math.abs((face.lips.y-.5+a.y)*a.zoom+.5-.5)<1e-8);
});
