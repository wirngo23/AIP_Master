import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHETYPES,
  DEFAULT_SETTINGS,
  applyArchetype,
} from "../lib/aip/domain.ts";
import { appearanceAmounts, expressionAmount } from "../lib/aip/appearance.ts";
test("masculine and feminine selections synchronize sample, preset and photo viewer", () => {
  const man = applyArchetype(DEFAULT_SETTINGS, "M01");
  assert.equal(man.sample, "man");
  assert.equal(man.viewer, "photo");
  assert.equal(man.jaw, 70);
  const woman = applyArchetype(man, "F01");
  assert.equal(woman.sample, "woman");
});
test("switching archetypes preserves an uploaded person's photo and framing", () => {
  const input = {
    ...DEFAULT_SETTINGS,
    sample: "upload" as const,
    alignment: { zoom: 1.4, x: 0.1, y: 0 },
  };
  const output = applyArchetype(input, "M01");
  assert.equal(output.sample, "upload");
  assert.deepEqual(output.alignment, input.alignment);
});
test("described soft, defined, happy and relaxed movements differ by direction", () => {
  const preset = (id: string) => applyArchetype(DEFAULT_SETTINGS, id);
  assert.ok(appearanceAmounts(preset("F01"))[0] < 0);
  assert.ok(appearanceAmounts(preset("F06"))[1] > 0);
  assert.ok(appearanceAmounts(preset("F04"))[3] < 0);
  assert.ok(expressionAmount(preset("F03")) > 0);
  assert.equal(expressionAmount(preset("F04")), 0);
  for (const a of ARCHETYPES)
    assert.ok(a.description.includes("jaw") || a.description.includes("Jaw"));
});
test("Mature starts with neutral brows but still permits brow refinement",()=>{
  const s=applyArchetype(DEFAULT_SETTINGS,"M04");
  assert.equal(appearanceAmounts(s)[3],0);
  assert.ok(appearanceAmounts({...s,brow:100})[3]>0);
});
