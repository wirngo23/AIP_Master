# 360° exploration release

## Implemented

- Shared Three.js viewer loads the bundled licensed GLB and textures on demand. It supports unrestricted horizontal orbit, bounded vertical orbit/zoom, front/left/right/back presets, auto-rotation, original geometry comparison and labelled image export.
- Discover and embeds default to the reference scan. Choosing a photo or uploading a portrait switches to the existing photo renderer. There is no invented rear view of a user's photograph.
- Appearance controls deform the reference mesh artistically; progression remains the existing conceptual envelope. Study settings retain viewer choice and optional hair selection. Legacy saved settings remain valid and open in photo mode.
- Clinical Studio alone mounts the schematic anatomy controls. Embedded discovery ignores clinical/connect query selections and never renders those workspaces. This is UI separation, not verified practitioner authorization.
- The schematic atlas represents 25 major muscle groups, paired where appropriate. Surface projection is tested against the actual bundled mesh. Geometry and contractions are illustrative, not dissection-quality anatomy or patient-specific mechanical modelling.
- A manual product/amount record is separate from manual activation/reduction controls. Toxin units and filler mL are distinguished; no amounts are suggested and amount changes never drive an effect. JSON exports identify the illustrative nature of the record.
- Optional crop, swept and bob silhouettes are created only after selection. Hair controls begin collapsed and the original scan is the default.

## Sources and future gates

[OpenStax head and neck anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back) informs the terse muscle-action descriptions. [BOTOX Cosmetic prescribing information](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=485d9b71-6881-42c5-a620-a4360c7192ab) establishes the product-specific nature of toxin units. These sources do not validate this rendering model.

Personal 3D reconstruction, high-fidelity segmented anatomy, product-specific dose response, filler-tissue biomechanics, time course, injection targeting, and predictive clinical use require separately validated data, models, clinician governance and access controls. The current animation must not be used to plan injections. No superiority claim is made.

## Verification

Domain and spatial tests cover saved-setting compatibility, conceptual deformation, view presets, scenario validation and surface coverage for every paired muscle group against the bundled GLB. TypeScript and production build are release checks. No browser interaction or screenshot QA has been performed for this change; live GPU appearance, touch ergonomics, transparency ordering and clinical usability need that separate evaluation before a clinical pilot.

## Performance and privacy

3D runs locally with bundled assets; no uploaded portrait is sent to a reconstruction service. Pixel ratio is capped at 2, offscreen/hidden viewers skip rendering, and unmount releases GPU resources. The reference model and maps total approximately 1.4 MB including an unused licensed specular map. Hair meshes are disposed when the selected style changes. WebGL failure shows an explicit unavailable state; the photo study remains selectable.
