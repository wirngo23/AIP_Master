# Validation record — foundation release

## Rendering clarity update — September 12, 2026

- Reproduced the reported beard problem in the deployed Clinical Studio: the boxed style used the same faint, regular grain as other styles. Replaced it with cached, deterministic hair strands and distinct coverage for stubble, boxed beard, goatee, mustache and jawline frame. Facial outline and outer lip landmarks constrain the overlay.
- Corrected lower-jaw anchors and outer-lip thickness measurements. Increased canvas resolution, added regional close-up and temporary original inspection, preserved hair shadows/highlights, and widened Connect's preview below 1050px.
- With explicit user authorization, browser-tested the local WebGL application in Discover, Clinical Studio and Connect. Exercised all five modes in each portal; checked both fictional samples across the session, distinct beard silhouettes, zero/maximum density, hair color, upper/lower lip emphasis, opposing jaw directions, chin length, original/preview comparison, close-up framing and retained selections between portals. These are representative interaction and visual checks, not an exhaustive preset-by-device matrix.
- Captured original and boxed-beard screenshots in the local working/render-qa directory. The browser error log contained the model runtime's informational CPU-delegate message; no renderer failure was observed during these checks. Local authenticated records were outside this rendering test.
- All 36 tests, TypeScript checking and the production build passed. Independent source review identified a missing landmark-validation check; the fix now rejects every newly consumed nonfinite landmark and has a regression test.
- Rendering remains procedural appearance editing. Hair length/cut, hair removal, personal 360-degree reconstruction, clinically validated dose response and photorealism across arbitrary uploads are not established by this release. Full mobile, assistive-technology, performance and hosted identity testing remain outstanding. The historical entries below describe their earlier validation scope.

## Shared Full face / Lips / Hair update — September 12, 2026

- All 26 tests and TypeScript checks passed. Added coverage for preserved edits across modes, original-view geometry, sample framing reset and hair mask orientation.
- Native CPU hair segmentation detected confident hair on both fictional sample portraits; model metadata confirms the hair category used by the renderer.
- Source review caught and corrected comparison/original-state disagreement and inherited framing when switching samples.
- [Editing modes](EDITOR_MODES.md) documents the shared workspace behavior, original defaults and photo-versus-3D hair capabilities. Browser GPU/visual QA remains unperformed.

## Archetype consistency update — September 12, 2026

- Collection selection previously changed only the displayed option list. It now selects a matching sample portrait and preset together. Uploaded portraits are preserved, direct sample controls synchronize the collection, and Reset keeps the selected collection.
- All 20 presets have explicit motion directions and matching concrete descriptions. Happy/Expressive/Approachable include mouth-corner lift; Relaxed uses gentle brow lowering. Photo and 3D renderers share the motion metadata.
- 22 tests and TypeScript checks passed. Regression coverage includes masculine/feminine switching, upload preservation and directional motion differences. Source review caught and corrected an inert Mature brow slider; it now begins neutral and remains editable. No browser interaction testing was performed.

## Landmark and dosage update — September 12, 2026

- All 18 tests and TypeScript checks passed, including shader syntax, detected-coordinate warp geometry and strict dosage record validation.
- Native inference using the bundled MediaPipe model detected both fictional sample faces and produced geometry accepted by the application.
- See [landmark and dosage release](LANDMARK_AND_DOSAGE_RELEASE.md) for the measured preset displacement, honest model boundaries and source references. Browser interaction/GPU appearance remain unverified.

## 360° update — September 12, 2026

- All 11 domain and spatial tests passed, including actual GLB surface coverage for every selectable muscle group and paired side, and saved-setting backward compatibility.
- TypeScript checking and the production build passed. The build reports a large JavaScript chunk warning for the graphics dependency; performance across target devices remains unmeasured.
- Independent source review identified missing side-face patches and a transparency shader update defect. Both were fixed and the reviewer confirmed the corrections.
- No browser interaction or visual QA was performed for this update. This does not verify photorealism, anatomical fidelity, or clinical dose response. See [spatial scope](SPATIAL_RELEASE.md).

## Earlier foundation checks

- Domain tests passed: 20 unique archetypes; bounded settings; invalid directions and non-finite inputs rejected; conceptual progression endpoints and bounds; contact consent/email validation; same-origin write checks.
- TypeScript type checking passed.
- Production Worker build passed, including the frontend, API routes, D1/R2 manifest, and generated schema migration.
- Local API integration checks passed against the compiled Worker: application routes, unauthenticated rejection, explicit photo-storage consent, cross-origin write rejection, durable study creation, private photo read, account isolation, consented draft creation, owned-study linking, consultation review, photo deletion, and consultation unlinking/deletion.
- Test records used synthetic names and a generated fictional sample portrait. The integration flow deleted its study and consultation fixtures.
- A focused independent source review found two study-state defects; both were corrected and re-reviewed: settings-only studies retain framing on re-upload, and deleting a photo clears dependent preview state even after controls have been adjusted.

## Validation limits

The rendering clarity update above adds representative browser and visual checks. Cross-device WebGL, comprehensive mobile/keyboard/screen-reader behavior, and end-to-end hosted identity remain unverified. The local development preview was rendered successfully over HTTP.

The optional WebMCP tools were implemented with schemas, shared validation, state updates, and lifecycle cleanup. No supporting live WebMCP validation context was available, so registration and execution are **not verified**.

No clinical accuracy, dose-response accuracy, complication reduction, conversion improvement, or competitor superiority has been established. No security/compliance certification is claimed. This record describes a private application foundation, not clinical deployment readiness.

## Regional studio update — 12 September 2026

- 33 automated checks pass, including six presets per focused region, unchanged uploaded identity, actual sample-update merging, preserved unrelated edits, signed jaw movement, bounded inverse lip scaling, original suppression, shader parsing, schema compatibility, and existing domain/clinical record behavior.
- TypeScript passes. Local root route returns HTTP 200.
- Independent source review identified and verified fixes for extreme lip texture inversion, inconsistent jaw-direction labels, missing Discover intensity control, upload collection access and inherited regional state after sample switching. No outstanding review findings.
- No browser interaction, visual realism, video decoding, mobile rendering or clinical accuracy claims are verified by these source-level checks. Local turn-video controls show original footage only. Dose-to-shape simulation and personal 360-degree reconstruction remain absent.
