# Landmark-aligned appearance and dosage discussion

## Reported problem and diagnosis

The user reported that changing directions did not visibly change the photograph. The prior GLSL syntax passes a real parser; an initial suspected syntax fault was ruled out. The presets used fixed image positions and small displacements, with many preset differences below one pixel at default intensity. A comparison mask could further conceal edits.

## Current algorithm

1. Decode the photo and detect landmarks locally using the bundled MediaPipe Face Landmarker. No image or landmark data goes to a third-party service.
2. Require exactly one detected face. Reject non-finite/cropped anchors, faces too small for the editing geometry, and heuristic excessive tilt or nose offset. These are framing checks, not clinical or demographic confidence measures.
3. Locate cheeks, jaw, lips and brows from the visible landmark surface. Express deformation extents relative to facial width/height. Apply image framing before sampling the detected-coordinate warp, keeping landmarks aligned after zoom or pan.
4. Apply bounded Gaussian displacement fields. The cheek/jaw maximum movement coefficient is 0.13 of facial width per side at full control and intensity; brow elevation is 0.08 of face height. Lip scaling is localized around detected lip coordinates. These are artistic constants, not evidence-based treatment-response coefficients. Soft directions use a narrowing jaw sign; defined directions use widening.
5. Preserve the source photo. Original/Compare/Full preview controls expose the change; choosing a direction selects Full preview. Zero intensity or progression endpoints preserve baseline and show a reminder. Reference 3D geometry uses the same direction signs and stronger artistic coefficients.

The runtime detects visible landmarks only. It neither evaluates attractiveness nor diagnoses treatment need, deep muscles, vascular anatomy or personality. [Google's Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js) describes the local inference API; [its model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf) describes AR use and input limitations. A single IMAGE inference runs on the main browser thread after asynchronous model loading; slower devices may briefly pause during analysis. Browser/WASM compatibility remains unverified by interaction testing in this release.

## Clinical dosage details

The clinical-only panel offers product/region references and session-only discussion records with exact formulation, optional laterality breakdown, computed recorded total, rationale and JSON export. Changing product or region clears entered amounts. Generic product categories require an actual formulation. No amount is prefilled; unsupported product-region combinations explicitly return no reference. Reference values cannot be converted between products and are not interpreted as individual safety thresholds.

Selected US label references: BOTOX Cosmetic glabellar complex 20 Units, bilateral lateral canthal region 24 Units, and combined forehead/glabella 40 Units; Dysport glabellar complex 50 Units. The forehead/glabella total already includes glabella. These summaries omit procedural site coordinates and require consulting the complete prescribing information for indications, contraindications and warnings. Sources: [BOTOX Cosmetic DailyMed](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=485d9b71-6881-42c5-a620-a4360c7192ab), [Dysport DailyMed](https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=97513722-8426-4ce3-b85d-0e08e436a140&type=display), checked September 12, 2026.

Filler records use mL and the exact formulation, with no universal shape conversion. [FDA filler information](https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers) discusses product/use differences and serious vascular risks. Filler amounts do not reduce the illustrative muscle activity. Clinical workspace selection still does not verify professional credentials.

## What clinical dose-to-image prediction still needs

The current warp is not calibrated from injection experience. A validated response system needs consented longitudinal cases with exact formulation, clinician-documented amounts and anatomical regions, standardized neutral and dynamic expression captures, prior treatments, elapsed time and outcomes. Separate toxin and filler models must account for baseline anatomy, muscle activity and tissue properties, learn nonlinear response without brand-unit substitution, quantify uncertainty, and abstain on unsupported cases. Validation must include held-out clinics, prospective follow-up, subgroup performance, adverse-outcome monitoring and clinical/regulatory oversight. Treatment-site guidance cannot be inferred from this surface landmark model.

## Verification performed

- Actual GLSL sources parse; domain, spatial, landmark-geometry and dosage-record tests cover identity, finite bounds, source-coordinate translation, product-region matching and placeholder-formulation rejection.
- Native CPU inference with the bundled model detected one face in each existing fictional sample. Both passed application framing checks. Computed Soft-to-Defined jaw displacement amplitudes were approximately 17.5 px (woman sample) and 15.9 px (man sample), at the 750-pixel working width before display scaling/cropping. This verifies model/data geometry, not perceptual realism.
- No browser interaction, GPU output comparison or clinical validation was performed. Source review caught a generic formulation export defect, corrected with a regression test.
