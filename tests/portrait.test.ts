import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "@shaderfrog/glsl-parser/index.js";

test("the actual photo shaders parse without syntax errors", () => {
  const source = readFileSync(
    new URL("../components/aip/portrait.tsx", import.meta.url),
    "utf8",
  );
  const shaders = [
    ...source.matchAll(/const (?:vertex|fragment) = `([\s\S]*?)`;/g),
  ];
  assert.equal(shaders.length, 2);
  for (const shader of shaders)
    assert.doesNotThrow(() => parse(shader[1], { quiet: true }));
});
