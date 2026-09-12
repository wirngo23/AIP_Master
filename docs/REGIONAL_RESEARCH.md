# Regional visualization research — 12 September 2026

## Capabilities reviewed and integrated

| Need | Current implementation | Evidence boundary |
|---|---|---|
| Region-aware personalization | 20 full-face preferences, 6 lip shapes, 6 hair colors, 6 beard overlays, 6 jaw contours | Optional aesthetic preferences; no attractiveness or treatment-need scoring |
| Responsive, identity-preserving face edits | Local landmark alignment, bounded lip warps, signed jaw width, chin adjustment | Front-facing 2D image editing, not biomechanical outcome simulation |
| Real face from different angles | Consent-based local turn-video playback and frame scrubbing | Captured original views only; no modified turn video or complete reconstruction |
| Clinical explanation | Separate reference anatomy and real portrait; major muscle groups; qualitative tissue cross-section; three mechanism categories | No individual vascular map, exhaustive atlas, injection site or dose recommendation |
| Product/amount discussion | Existing exact-product, regional, laterality and amount records | Manually entered amounts remain independent of image displacement |
| Clinical and consumer continuity | Shared settings and focused catalogs across Discover, Clinical and Connect | Clinical workspace navigation is not verified practitioner authorization |

## Primary sources

- [Google Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker): facial landmarks and expression geometry for image/video effects. It does not supply individual treatment-response data or unseen anatomy.
- [FDA dermal filler overview](https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers): result depends on tissue structure, material and volume; indications and risks require product-specific review.
- [FDA JUVÉDERM VOLUX XC approval](https://www.fda.gov/medical-devices/recently-approved-devices/juvederm-volux-xc-p110033s065): supports the specific jawline indication, not a universal jawline dose or photographic response curve.
- [BOTOX Cosmetic prescribing information](https://www.rxabbvie.com/pdf/botox-cosmetic_pi.pdf): neuromuscular mechanism, labeled regions, product-specific units, contraindications and risks. Lip flip and masseter contouring are outside the cited U.S. Cosmetic indications.
- [OpenStax head and neck muscles](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back): educational muscle actions underlying the existing schematic.
- [Canfield VECTRA H2](https://www.canfieldsci.com/imaging-systems/vectra-h2-body/): an established dedicated 3D capture/consultation benchmark. Not integrated; procurement, supported export/API access and evaluation would be required.
- [Crisalix face photo capture](https://help.crisalix.com/face-photos-creating-a-face-3d-model): an established multi-photo facial reconstruction workflow. Not integrated; commercial access and consent-aware data processing would be required.

These are targeted technical/product checks, not an exhaustive market review. No competitor was tested head-to-head and no superiority claim is established.

## Development gates for the requested clinical realism

1. **Capture/reconstruction:** standardized frontal and oblique capture with expression/pose guidance; scan or reconstruction integration using an agreed license; calibrated scale, landmark correspondence, texture seams, coverage and repeatability tests. Refuse missing or inadequate views rather than inventing measured geometry.
2. **Clinical dataset:** consented baseline and follow-up records, exact formulation, total and regional amounts, assessment, prior procedures, pose/expression, adverse events and follow-up intervals. Split by patient and clinic to avoid leakage.
3. **Response model:** distinguish volume support from neuromuscular and gradual tissue effects. Calibrate product- and region-specific response with uncertainty and abstention. A monotonic visual-intensity knob is not proof of a dose-response relationship.
4. **Validation:** prospective clinician review; compare error and uncertainty to observed outcomes and clinical judgment; subgroup analysis for age, skin appearance, anatomy and capture device. Test expectation accuracy, trust and decision quality, alongside consultation conversion and retention.
5. **Clinical deployment:** professional verification, consent and sharing controls, clinical oversight, audit trail, incident handling, versioned evidence, security evaluation and jurisdiction-specific regulatory assessment before clinical claims.

Haircuts, beard removal, personal 360-degree generative reconstruction and dose-calibrated simulation remain unimplemented. The current editor deliberately identifies color/texture overlays, original footage and schematic explanations so these are not mistaken for validated treatment outcomes.
