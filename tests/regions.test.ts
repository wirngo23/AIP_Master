import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, settingsSchema, editSettings, baselineSettings, selectSample } from '../lib/aip/domain.ts';
import { REGIONAL_PRESETS, applyRegionalPreset } from '../lib/aip/regions.ts';
import { appearanceAmounts, createWarp } from '../lib/aip/appearance.ts';

test('each focused region has a distinct catalog; every preset preserves identity and other regions',()=>{
  for(const mode of ['lips','hair','beard','jawline'] as const){
    const options=REGIONAL_PRESETS.filter(p=>p.mode===mode); assert.ok(options.length>=5);
    for(const sample of ['woman','man','upload'] as const) for(const p of options){
      const base={...DEFAULT_SETTINGS,sample,cheek:18,brow:12,previewOriginal:true};
      const result=applyRegionalPreset(base,p.id);
      assert.equal(result.sample,sample);assert.equal(result.editMode,mode);assert.equal(result.previewOriginal,false);
      assert.equal(result.cheek,18);assert.equal(result.brow,12);assert.ok(settingsSchema.safeParse(result).success);
      if(mode!=='lips') assert.equal(result.lip,base.lip);
      if(mode!=='jawline') assert.equal(result.jaw,base.jaw);
    }
  }
});
test('focused jaw direction is independent from the full face archetype',()=>{
  const narrow=applyRegionalPreset(DEFAULT_SETTINGS,'jaw-soft-taper');
  const wide=applyRegionalPreset(DEFAULT_SETTINGS,'jaw-structured');
  assert.ok(appearanceAmounts(narrow)[1]<0);assert.ok(appearanceAmounts(wide)[1]>0);
  assert.throws(()=>applyRegionalPreset(DEFAULT_SETTINGS,'unknown'));
});
test('first focused edit on either sample does not activate unchosen face modifications',()=>{
  for(const sample of ['woman','man'] as const){
    const s=selectSample(baselineSettings(),sample);
    const next=applyRegionalPreset(s,'lips-cupid');
    assert.equal(next.cheek,0);assert.equal(next.jaw,0);assert.equal(next.brow,0);assert.equal(next.beard,undefined);assert.equal(next.hairColor,undefined);
  }
});
test('actual sample update merge clears previously selected regional effects',()=>{
  const old={...applyRegionalPreset(applyRegionalPreset(DEFAULT_SETTINGS,'jaw-long'),'beard-boxed'),hairColor:'copper' as const,lipWidth:45};
  const next=editSettings(old,selectSample(old,'man'));
  assert.equal(next.chin,undefined);assert.equal(next.beard,undefined);assert.equal(next.hairColor,undefined);assert.equal(next.lipWidth,undefined);assert.equal(next.regionPresets,undefined);
  const lips=applyRegionalPreset(next,'lips-natural');assert.equal(lips.jaw,0);assert.equal(lips.beard,undefined);
});
test('new modes validate while illegal values are rejected; edits activate preview',()=>{
  for(const editMode of ['beard','jawline']) assert.ok(settingsSchema.safeParse({...DEFAULT_SETTINGS,editMode}).success);
  assert.equal(settingsSchema.safeParse({...DEFAULT_SETTINGS,beardDensity:101}).success,false);
  assert.equal(editSettings({...DEFAULT_SETTINGS,previewOriginal:true},{chin:25}).previewOriginal,false);
});
test('regional lip and chin changes collapse to exact baseline when original is selected',()=>{
  const pair:[{x:number;y:number},{x:number;y:number}]=[{x:.3,y:.5},{x:.7,y:.5}];
  const face={cheeks:pair,jaw:pair,brows:pair,corners:pair,lips:{x:.5,y:.4},width:.5,height:.6,lipWidth:.2,lipHeight:.03};
  const original=createWarp({...applyRegionalPreset(DEFAULT_SETTINGS,'lips-cupid'),chin:50,previewOriginal:true},face);
  assert.ok(original.moves.every(v=>v===0));assert.equal(original.lipScale,0);assert.ok(original.lipShape.every(v=>v===0));
});
test('maximum lip emphasis cannot invert the central texture mapping',()=>{
  const pair:[{x:number;y:number},{x:number;y:number}]=[{x:.3,y:.5},{x:.7,y:.5}];
  const face={cheeks:pair,jaw:pair,brows:pair,corners:pair,lips:{x:.5,y:.4},width:.5,height:.6,lipWidth:.2,lipHeight:.03};
  const warp=createWarp({...DEFAULT_SETTINGS,lip:100,lipUpper:100,lipLower:100,intensity:100,phase:50},face);
  assert.ok(warp.lipShape[0]>0&&warp.lipShape[0]<1);assert.ok(warp.lipShape[1]>0&&warp.lipShape[1]<1);
});
