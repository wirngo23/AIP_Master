import test from "node:test";
import assert from "node:assert/strict";
import {
  deformPoint,
  MUSCLES,
  viewPreset,
  scenarioSchema,
  muscleRay,
} from "../lib/aip/spatial.ts";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
test("every selectable muscle has a surface on both sides of the actual reference scan", async () => {
  const file = await readFile(
    new URL(
      "../public/models/reference-head/LeePerrySmith.glb",
      import.meta.url,
    ),
  );
  const gltf = await new GLTFLoader().parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    "",
  );
  let geometry: THREE.BufferGeometry | undefined;
  gltf.scene.traverse((o) => {
    if (o instanceof THREE.Mesh && !geometry) geometry = o.geometry.clone();
  });
  assert.ok(geometry);
  geometry.computeBoundingBox();
  const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
  const scale = 3.6 / geometry.boundingBox!.getSize(new THREE.Vector3()).y;
  geometry
    .translate(-center.x, -center.y, -center.z)
    .scale(scale, scale, scale);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.updateMatrixWorld(true);
  for (const group of MUSCLES)
    for (const side of group.paired ? [-1, 1] : [1]) {
      const anchor = muscleRay(group, side);
      const ray = new THREE.Raycaster(
        new THREE.Vector3(...anchor.origin),
        new THREE.Vector3(...anchor.direction),
      );
      assert.ok(
        ray.intersectObject(mesh)[0],
        `${group.id} side ${side} must be visible`,
      );
    }
  geometry.dispose();
  mesh.material.dispose();
});
test("3D baseline and back of head are unchanged by appearance editing", () => {
  const p: [number, number, number] = [0.3, 0.5, 0.7];
  assert.deepEqual(deformPoint(p, [0, 0, 0, 0], 0), p);
  assert.deepEqual(
    deformPoint([0.3, 0.5, -0.7], [1, 1, 1, 1], 1),
    [0.3, 0.5, -0.7],
  );
  for (const amount of [0, 0.5, 1])
    assert.ok(
      deformPoint(p, [amount, amount, amount, amount], amount).every(
        Number.isFinite,
      ),
    );
});
test("360-degree presets cover front, both sides and back", () => {
  assert.equal(viewPreset("front"), 0);
  assert.equal(viewPreset("back"), Math.PI);
  assert.equal(viewPreset("left"), -Math.PI / 2);
  assert.equal(viewPreset("right"), Math.PI / 2);
});
test("muscle atlas has unique groups, actions and no injection coordinates or dose recommendations", () => {
  assert.ok(MUSCLES.length >= 20);
  assert.equal(new Set(MUSCLES.map((m) => m.id)).size, MUSCLES.length);
  for (const m of MUSCLES) {
    assert.ok(m.action.length > 3);
    assert.equal("dose" in m, false);
    assert.equal("injectionSite" in m, false);
  }
});
test("scenario inputs do not supply a predicted response and reject negative dose", () => {
  const base = {
    kind: "toxin",
    product: "BOTOX Cosmetic",
    amount: 5,
    muscle: "frontalis",
    activity: 60,
    reduction: 30,
  };
  assert.equal(scenarioSchema.safeParse(base).success, true);
  assert.equal(
    scenarioSchema.safeParse({ ...base, amount: -1 }).success,
    false,
  );
  assert.equal(
    scenarioSchema.safeParse({ ...base, muscle: "unknown" }).success,
    false,
  );
  assert.equal(
    scenarioSchema.safeParse({ ...base, predictedEffect: 90 }).success,
    false,
  );
});
