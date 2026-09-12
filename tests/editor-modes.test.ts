import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  settingsSchema,
  editSettings,selectSample,
} from "../lib/aip/domain.ts";
import { maskBytes } from "../lib/aip/hair.ts";
import {createWarp} from "../lib/aip/appearance.ts";
test("mode switching preserves edits while lips and hair edits leave other regions intact", () => {
  const base = { ...DEFAULT_SETTINGS, previewOriginal: true };
  const lips = editSettings(base, { editMode: "lips" });
  assert.equal(lips.previewOriginal, true);
  assert.equal(lips.cheek, base.cheek);
  const changed = editSettings(lips, { lip: 70 });
  assert.equal(changed.previewOriginal, false);
  assert.equal(changed.jaw, base.jaw);
  const hair = editSettings(changed, { hairColor: "copper" });
  assert.equal(hair.lip, 70);
  assert.equal(hair.hairColor, "copper");
  assert.equal(
    editSettings(hair, { previewOriginal: true }).previewOriginal,
    true,
  );
  assert.equal(
    settingsSchema.safeParse({ ...hair, editMode: "invalid" }).success,
    false,
  );
});
test("hair mask uploads in correct vertical orientation and clamps invalid confidence", () => {
  assert.deepEqual(
    [...maskBytes(new Float32Array([0, 1, 0.5, NaN]), 2, 2)],
    [128, 0, 0, 255],
  );
});
test("Original suppresses every face and lip displacement without deleting saved controls",()=>{
  const pair:[{x:number;y:number},{x:number;y:number}]=[{x:.3,y:.5},{x:.7,y:.5}];
  const warp=createWarp({...DEFAULT_SETTINGS,previewOriginal:true},{cheeks:pair,jaw:pair,brows:pair,corners:pair,lips:{x:.5,y:.4},width:.5,height:.6,lipWidth:.2,lipHeight:.03});
  assert.ok(warp.moves.every(v=>v===0));assert.equal(warp.lipScale,0);
});
test("switching from an upload to either sample clears inherited framing and starts original",()=>{
  for(const sample of ["man","woman"] as const) {
    const result=selectSample({...DEFAULT_SETTINGS,sample:"upload",alignment:{zoom:1.8,x:.2,y:-.2}},sample);
    assert.deepEqual(result.alignment,{zoom:1,x:0,y:0});assert.equal(result.previewOriginal,true);assert.equal(result.sample,sample);
  }
});
