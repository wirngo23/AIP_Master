# Regional appearance studio — implementation and evidence plan

## Design
Extend the existing editor with five synchronized modes: Full face, Lips, Hair, Beards, Jawline. A shared archetype component shows the active region's catalog in every workspace. Region presets modify only their own settings, preserve uploaded identity, and activate the preview. Original restores appearance without deleting edits. Existing saved settings remain valid.

Photos retain texture through landmark-aligned deformations. Lips gain independent upper/lower fullness and width. Jawline gains signed width and chin length. Beard previews add local textured cosmetic overlays, not inferred hair growth or beard removal. Hair presets are accurately named color previews. All options are available for either sample and uploads.

The anatomical sculpture is exclusive to Clinical Studio, on the left. The person's photo stays on the right. A local turn-video viewer shows actual recorded angles, with seek and play controls; no hallucinated 360-degree reconstruction. Video is original footage, explicitly separate from frontal photo simulation. No video upload to the server or silent camera activation.

Clinical educational cards explain tissue support versus neuromuscular activity and region-specific limitations. Manual product/dose records do not drive facial shape: no validated model converts units or mL into patient-specific displacement. No injection coordinates, depths, or personalized prescription. Existing schematic muscle exploration remains labeled as such, with region-driven selection.

## Implementation sequence
1. Test five-mode schema, preset isolation, male/female identity preservation, invalid presets, original suppression and signed regional motion in `tests/regions.test.ts`; run failing tests.
2. Add `lib/aip/regions.ts`, optional schema fields, independent lip/jaw deformation and textured beard shader; run regression tests and shader parser.
3. Add shared regional archetypes and extend editing controls; replace Discover's fixed catalog. Remove sculpture from Discover and Connect.
4. Add local turn-video viewer with size/duration bounds, explicit adult/permission consent, URL cleanup, seek/play/error states. Pair anatomy and real portrait in Clinical Studio.
5. Add cited regional clinical education with product-label links, limits, and pathways requiring clinical evaluation. Document research and unresolved validation requirements.
6. Run tests, TypeScript and production build; independent source review; fix actionable findings. Publish the exact validated source to existing GitHub/Sites destinations and preserve access.

## Research and limits
Reviewed 2026-09-12: FDA dermal filler overview and VOLUX XC approval, BOTOX Cosmetic manufacturer prescribing information, Canfield VECTRA H2 and Crisalix face capture documentation, Google MediaPipe face landmark documentation. These support capabilities/mechanisms, not a claim of superiority or a calibrated dose-to-shape algorithm.

Reliable personal 3D simulation requires calibrated multi-view capture/scan ingestion, correspondence and reconstruction validation. Dose-based simulation additionally requires consented longitudinal outcome data, exact products and clinical assessments, uncertainty calibration, subgroup validation and appropriate regulatory review. Neither generic facial landmarks nor a static photo reveals the individual's vascular anatomy or injectable response. We do not label conceptual image edits as clinically validated outcomes.
