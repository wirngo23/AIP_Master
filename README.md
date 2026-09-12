# AIP — Aesthetics Intelligence Platform

A working first release of AIP Discover, AIP Clinical Studio, and AIP Connect. AIP replaces the former Presthetics–Precision Esthetics name.

## What works

- Full face, Lips, and Hair editing modes in Discover, Clinical Studio, Connect and the embed. New sessions start with the original photo; a shared Original/Simulated toggle preserves edits. Photo hair color uses local segmentation; 3D hair styles remain illustrative silhouettes. Both sample portals and uploaded portraits use the same editing controls.

- Cinematic, responsive dark studio with two original, AI-generated fictional adult sample portraits.
- Rotatable 360° licensed reference head across Discover, Clinical Studio, and Connect, with drag/zoom, view presets, and labelled export. This is a separate reference person, not a reconstruction of the sample portraits or uploaded user.
- Clinical-only schematic explorer for 25 muscle groups, manual activity/reduction animation, and product/amount demonstration records. Amounts do not drive response predictions. Hair silhouettes are optional and off by default.
- Twenty optional appearance directions: ten in each of the feminine and masculine collections. Every direction is available to everyone.
- Local JPG/PNG/WebP upload, browser image normalization, manual framing, WebGL image deformation, before/after comparison, conceptual progression, and labelled JPEG export.
- Local MediaPipe facial landmark analysis aligns photo edits to detected cheeks, jaw, lips and brows, with framing checks and visible original/compare/full-preview modes.
- Clinical dosage discussion records include exact product, region, laterality, total and notes, with selected US BOTOX Cosmetic/Dysport label references. Records export locally; they are not prescriptions or dose-driven predictions.
- Account-scoped saved studies in D1. Uploaded photos are kept in browser memory unless the user separately opts into R2 storage.
- Private consultation drafts, linked saved studies, review status, notes, export, and permanent deletion.
- Clinic branding configuration, a functional iframe route, embed-code export, and a private consultation pipeline.
- Optional WebMCP appearance read/configure tools for supporting browsers.

## Evidence level and intended use

**This release is an illustrative appearance editor and consultation preparation prototype.** The renderer detects visible facial landmarks for editing; it does not measure clinical anatomy, predict Botox/filler outcomes, infer treatment need, recommend injection sites, calculate prescribed doses, or predict duration. The progression slider is an artistic envelope, not a drug-response curve. Overlay points identify the detected editing anchors on the original photo.

The clinical workspace describes the boundary of the future clinical engine. Names such as “Leader” and “Happy” are user-selected style labels; they do not infer personality, competence, or emotional state. Sample portraits do not depict clinical before/after results.

Consultations are private drafts. No actual practitioners, availability, bookings, automatic outreach, referral earnings, billing, or clinic-to-patient sharing are represented as live integrations. The private iframe requires access to the same private Site; public multi-tenant onboarding is a subsequent release.

## Run locally

Node.js 24 is used for this build. The locked starter supports Node.js >=22.13.

```sh
npm run install:ci
npm run dev
```

Open the URL printed by the server. For local saving, visit `/signin-with-chatgpt?return_to=%2F` once to establish the starter's simulated development session. This is a local simulation; the hosted version uses the Sites dispatcher identity.

Generate and build the database configuration, then apply the initial migration **once**:

```sh
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_friendly_blindfold.sql
```

The migration already exists in this repository. Generating it again is only necessary after schema changes. Preserve applied migrations and append new ones.

On Windows, if a shell's npm launcher resolves its own path incorrectly, invoke the installed `npm-cli.js` through `node` using its absolute path.

## Validate

```sh
npm test
npm run typecheck
npm run build
```

For API integration tests, run the compiled local Worker in a separate terminal:

```sh
npm run start -- --port 8787
```

Then set `AIP_TEST_ORIGIN=http://127.0.0.1:8787` in your shell and run:

```sh
node tests/api.integration.mjs
```

The integration test is restricted to localhost. It simulates trusted dispatcher headers against the standalone local Worker, creates synthetic records, checks ownership and consent, and deletes those fixtures afterward. The Vite development server deliberately strips forged identity headers, so use the compiled Worker for these tests.

## Architecture

- Vinext / React 19 / TypeScript on Cloudflare Workers.
- Bundled Shadcn/Radix primitives, Tailwind 4, and Lucide icons.
- Browser-side WebGL appearance rendering; no external image-processing service.
- D1 for structured private records; R2 for explicitly stored original portraits.
- Sites dispatcher for hosted identity and private site access.

**Do not expose the Worker directly as a public origin.** Authorization trusts identity headers supplied by the Sites dispatcher. Another hosting provider requires an authenticated gateway that strips incoming identity headers and supplies verified identity, or a replacement server-side authentication integration.

See [architecture](docs/ARCHITECTURE.md), [release validation](docs/VALIDATION.md), [3D release scope](docs/SPATIAL_RELEASE.md), [asset attribution](docs/ASSET_ATTRIBUTION.md), and [next milestones](docs/NEXT_MILESTONES.md).

## Source and hosting

Primary source repository: https://github.com/wirngo23/AIP_Master

The repository contains application source, assets, migrations, tests, and deployment configuration. Credentials, local database contents, user uploads, and private planning-source attachments are excluded. The GitHub source repository's visibility is independent of the private hosted Site's access policy.
