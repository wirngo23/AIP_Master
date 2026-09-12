# Shared editing modes

- The direction panel heading is exactly **Choose your archetype**.
- Discover, Clinical Studio, Connect and embedded Discover expose the same five editing modes: Full face, Lips, Hair, Beards, Jawline. Modes focus the visible controls and preserve existing edits, allowing a combined appearance.
- A new session starts with the original photo. Original / Simulated preview controls retain edits for comparison. Region, intensity, phase or hair edits switch to preview; entering a mode by itself does not modify the face.
- Full face provides the existing regional controls and archetype-driven exploration. Lips provides upper/lower emphasis, fullness, width and Cupid’s-bow controls. Jawline provides signed width and chin length. Hair offers original/espresso/chestnut/copper/blonde/silver photo color. Beards offers original/stubble/boxed/goatee/mustache/chinstrap cosmetic overlays, density and tone. Clinical Studio retains optional crop/swept/bob reference silhouettes. Cut and length are not generated on photographs.
- A shared settings object follows the person across workspaces. All workspaces provide male/female samples and region-specific archetype catalogs. Uploads retain access to either full-face style collection without changing identity. The 360° reference scan appears exclusively in Clinical Studio on the left, while the real portrait remains on the right.
- Muscle controls stay exclusive to Clinical Studio. The reference remains beside the photo when the muscle overlay is enabled. Connect and its embed do not receive clinical controls.
- Optional settings fields retain editing mode, original-preview state and hair color in saved studies without requiring migration. Older saved studies remain valid.

## Hair processing

Google's Apache-licensed Hair Segmenter model is bundled beside the existing MediaPipe runtime. It is loaded only when a non-original photo hair color is selected for simulated preview. Images stay on device. The model's `hair` label is resolved from metadata, confidence is copied before releasing the inference result, and the mask is uploaded in the correct texture orientation. Recoloring preserves luminance variation and uses a confidence-feathered blend; no mask means no recoloring. Low-confidence edges, elaborate backgrounds and unusual lighting can produce imperfect boundaries.

The [official Image Segmenter guide](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter/web_js) documents the API. [The model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20-%20Hair%20Segmentation.pdf) documents its selfie-oriented use. Native CPU validation found confident hair pixels on both existing fictional sample portraits. This validates the model inputs and class mapping; it is not browser GPU or visual QA.

## Limits

This remains appearance exploration. Lip changes are not computed from filler volume. Hair color is an illustration, not a dye-result guarantee. 3D hairstyles are reference silhouettes, not personalized reconstruction. Clinical prediction and hair-cut generation are not introduced by this update.

## Real face angles
Each workspace supports explicit, consented local video selection (up to 80 MB / 60 seconds), playback, scrubbing and removal. Clips show original recorded angles, never simulated geometry. Object URLs are revoked on replacement/unmount; source changes reset the clip. Clips are not stored with studies or sent to the server. Single-photo 360-degree reconstruction is not provided.

## Regional behavior
Six presets per focused region change only that region. Catalog selection clears visually when manual controls no longer match the preset. New sessions and new sample selections start with zero geometric edits; selecting lips alone does not activate an unchosen full-face preset. Lip inverse scaling is bounded below one to avoid central texture foldover at maximum allowed values. Beard overlays follow detected front-face geometry and preserve the original mouth; this is a procedural cosmetic effect, not photoreal generative replacement or a hair-growth prediction.
