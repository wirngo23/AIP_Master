import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHETYPES,
  studySchema,
  consultationSchema,
  progression,
  assertSameOrigin,
} from "../lib/aip/domain.ts";
test("twenty distinct directions, ten in each collection", () => {
  assert.equal(ARCHETYPES.length, 20);
  assert.equal(new Set(ARCHETYPES.map((a) => a.id)).size, 20);
  for (const family of ["feminine", "masculine"])
    assert.equal(ARCHETYPES.filter((a) => a.family === family).length, 10);
});
const settings = {
  archetype: "F01",
  intensity: 45,
  cheek: 35,
  jaw: 24,
  lip: 20,
  brow: 30,
  phase: 50,
  sample: "woman",
  alignment: { zoom: 1, x: 0, y: 0 },
};
test("study validation rejects arbitrary directions, excessive values, and non-finite input", () => {
  assert.equal(
    studySchema.safeParse({ title: "My study", settings }).success,
    true,
  );
  for (const change of [
    { archetype: "inject" },
    { intensity: 101 },
    { jaw: -1 },
    { brow: Infinity },
    { phase: NaN },
  ])
    assert.equal(
      studySchema.safeParse({
        title: "Study",
        settings: { ...settings, ...change },
      }).success,
      false,
    );
});
test("conceptual progression returns to original at both ends, remains bounded, peaks at middle", () => {
  assert.equal(progression(0), 0);
  assert.equal(progression(100), 0);
  assert.equal(progression(50), 1);
  for (let t = 0; t <= 100; t++)
    assert.ok(progression(t) >= 0 && progression(t) <= 1);
});
test("consultation cannot be saved without contact consent or valid email", () => {
  const valid = {
    name: "Example Adult",
    email: "example@example.com",
    studyId: null,
    goal: "Explore options",
    followup: false,
    contactConsent: true,
  };
  assert.equal(consultationSchema.safeParse(valid).success, true);
  assert.equal(
    consultationSchema.safeParse({ ...valid, contactConsent: false }).success,
    false,
  );
  assert.equal(
    consultationSchema.safeParse({ ...valid, email: "invalid" }).success,
    false,
  );
});
test("cross-origin and missing-origin writes are rejected", () => {
  assert.doesNotThrow(() =>
    assertSameOrigin("https://aip.example", "https://aip.example/api/studies"),
  );
  assert.throws(() =>
    assertSameOrigin("https://evil.example", "https://aip.example/api/studies"),
  );
  assert.throws(() =>
    assertSameOrigin(null, "https://aip.example/api/studies"),
  );
});
