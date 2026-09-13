import test from "node:test";
import assert from "node:assert/strict";
import {
  geometryFromLandmarks,
  createWarp,
  appearanceAmounts,
} from "../lib/aip/appearance.ts";
import { DEFAULT_SETTINGS, ARCHETYPES } from "../lib/aip/domain.ts";
const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
for (const [i, x, y] of [
  [234, 0.2, 0.45],
  [454, 0.8, 0.45],
  [205, 0.28, 0.52],
  [425, 0.72, 0.52],
  [132, 0.24, 0.68],
  [361, 0.76, 0.68],
  [105, 0.35, 0.3],
  [334, 0.65, 0.3],
  [10, 0.5, 0.15],
  [152, 0.5, 0.85],
  [13, 0.5, 0.6],
  [14, 0.5, 0.64],
  [61, 0.4, 0.62],
  [291, 0.6, 0.62],
  [1, 0.5, 0.5],
])
  points[i] = { x, y };
test("analysis rejects absent, cropped, tilted and non-finite faces", () => {
  assert.throws(() => geometryFromLandmarks([], 1));
  const bad = points.map((p) => ({ ...p }));
  bad[105].y = 0.8;
  assert.throws(() => geometryFromLandmarks(bad, 1));
  bad[105].x = NaN;
  assert.throws(() => geometryFromLandmarks(bad, 1));
});
test("analysis validates every lip, jaw and beard-boundary landmark", () => {
  for (const id of [0,2,17,93,58,172,136,150,149,176,148,377,400,378,379,365,397,288,323]) {
    const bad = points.map(p => ({...p}));
    bad[id].x = NaN;
    assert.throws(() => geometryFromLandmarks(bad, 1), `invalid landmark ${id}`);
  }
});
test("edits follow facial landmarks and remain identity at zero", () => {
  const face = geometryFromLandmarks(points, 1);
  const zero = createWarp({ ...DEFAULT_SETTINGS, intensity: 0 }, face);
  assert.ok(zero.moves.every((v) => v === 0));
  assert.equal(zero.lipScale, 0);
  const shifted = geometryFromLandmarks(
    points.map((p) => ({ x: p.x + 0.03, y: p.y })),
    1,
  );
  const a = createWarp(DEFAULT_SETTINGS, face),
    b = createWarp(DEFAULT_SETTINGS, shifted);
  assert.ok(Math.abs(b.regions[0] - a.regions[0] - 0.03) < 1e-6);
});
test("Soft and Defined contour visibly diverge instead of subpixel preset differences", () => {
  const face = geometryFromLandmarks(points, 1);
  const edits = ARCHETYPES.filter((a) => ["F01", "F06"].includes(a.id)).map(
    (a) =>
      createWarp(
        {
          ...DEFAULT_SETTINGS,
          archetype: a.id,
          cheek: a.values[0],
          jaw: a.values[1],
          lip: a.values[2],
          brow: a.values[3],
        },
        face,
      ),
  );
  assert.ok(Math.abs(edits[0].moves[4] - edits[1].moves[4]) * 750 > 8);
  assert.ok(appearanceAmounts(DEFAULT_SETTINGS)[1] < 0);
  for (const a of ARCHETYPES) {
    const warp = createWarp(
      {
        ...DEFAULT_SETTINGS,
        archetype: a.id,
        intensity: 100,
        cheek: 100,
        jaw: 100,
        lip: 100,
        brow: 100,
      },
      face,
    );
    assert.ok(
      warp.moves.every((v) => Number.isFinite(v) && Math.abs(v) <= 0.1),
    );
  }
});
