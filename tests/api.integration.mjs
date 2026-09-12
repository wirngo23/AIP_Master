import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
const base = process.env.AIP_TEST_ORIGIN || "http://localhost:5173";
// These trusted headers simulate the Sites dispatcher ONLY against the local server.
// Never expose a standalone origin that accepts these headers from untrusted clients.
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Integration tests are local-only.");
const identity = {
  "oai-authenticated-user-id": "aip-integration-owner",
  "oai-authenticated-user-email": "integration@example.test",
  Origin: base,
};
const other = {
  ...identity,
  "oai-authenticated-user-id": "aip-integration-other",
};
const settings = {
  archetype: "F01",
  intensity: 45,
  cheek: 35,
  jaw: 24,
  lip: 20,
  brow: 30,
  phase: 50,
  sample: "upload",
  alignment: { zoom: 1, x: 0, y: 0 },
};
async function req(path, options = {}, headers = identity) {
  return fetch(base + path, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
}
let id;
let consultationId;
try {
  for (const route of ["/", "/embed", "/development"])
    assert.equal((await req(route)).status, 200, route);
  assert.equal((await req("/api/studies", {}, {})).status, 401);
  const jpg = await sharp(
    await readFile(
      new URL("../public/images/woman-portrait.png", import.meta.url),
    ),
  )
    .resize(400)
    .jpeg()
    .toBuffer();
  const makeForm = (consent = true) => {
    const f = new FormData();
    f.append(
      "data",
      JSON.stringify({ title: "Integration fixture", settings }),
    );
    f.append("photo", new Blob([jpg], { type: "image/jpeg" }), "test.jpg");
    if (consent) f.append("photoConsent", "true");
    return f;
  };
  assert.equal(
    (await req("/api/studies", { method: "POST", body: makeForm(false) }))
      .status,
    400,
    "Explicit photo consent required",
  );
  assert.equal(
    (
      await req(
        "/api/studies",
        { method: "POST", body: makeForm() },
        { ...identity, Origin: "https://wrong.example" },
      )
    ).status,
    403,
    "CSRF boundary",
  );
  const created = await req("/api/studies", {
    method: "POST",
    body: makeForm(),
  });
  assert.equal(created.status, 201, await created.clone().text());
  id = (await created.json()).study.id;
  const listed = await req("/api/studies");
  assert.ok(
    (await listed.json()).studies.some((s) => s.id === id),
    "Saved study persists",
  );
  assert.equal(
    (await req(`/api/studies/${id}/photo`, {}, other)).status,
    404,
    "Other owner cannot read photo",
  );
  assert.equal(
    (await req(`/api/studies/${id}`, { method: "DELETE" }, other)).status,
    404,
    "Other owner cannot delete study",
  );
  const photo = await req(`/api/studies/${id}/photo`);
  assert.equal(photo.status, 200);
  assert.equal(photo.headers.get("cache-control"), "private, no-store");
  assert.equal((await photo.arrayBuffer()).byteLength, jpg.byteLength);
  const contact = {
    name: "Integration fixture",
    email: "fixture@example.test",
    studyId: id,
    goal: "Test a saved preference without contacting a clinic.",
    contactConsent: true,
    followup: false,
  };
  assert.equal(
    (
      await req(
        "/api/consultations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contact),
        },
        other,
      )
    ).status,
    404,
    "Other owner cannot link private study",
  );
  const c = await req("/api/consultations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
  assert.equal(c.status, 201, await c.clone().text());
  consultationId = (await c.json()).consultation.id;
  assert.equal(
    (
      await req(`/api/consultations/${consultationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "reviewed",
          note: "Verified integration record.",
        }),
      })
    ).status,
    200,
  );
  const list = (await (await req("/api/consultations")).json()).consultations;
  assert.equal(list.find((c) => c.id === consultationId).status, "reviewed");
  assert.equal(
    (
      await req(
        `/api/consultations/${consultationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "reviewed", note: "forbidden" }),
        },
        other,
      )
    ).status,
    404,
  );
  assert.equal(
    (await req(`/api/studies/${id}`, { method: "DELETE" })).status,
    200,
  );
  assert.equal(
    (await req(`/api/studies/${id}/photo`)).status,
    404,
    "Deleted photo no longer accessible",
  );
  assert.equal(
    (await (await req("/api/consultations")).json()).consultations.find(
      (c) => c.id === consultationId,
    ).studyId,
    null,
    "Deletion unlinks consultation",
  );
  id = null;
  assert.equal(
    (await req(`/api/consultations/${consultationId}`, { method: "DELETE" }))
      .status,
    200,
  );
  consultationId = null;
  console.log(
    "PASS: 19 route, persistence, consent, ownership, CSRF, private-photo, review, and deletion assertions.",
  );
} finally {
  if (consultationId)
    await req(`/api/consultations/${consultationId}`, { method: "DELETE" });
  if (id) await req(`/api/studies/${id}`, { method: "DELETE" });
}
