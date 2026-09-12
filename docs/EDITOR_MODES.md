# Shared editing modes

- The direction panel heading is exactly **Choose your archetype**.
- Discover, Clinical Studio, Connect and embedded Discover expose the same three editing modes: Full face, Lips, Hair. Modes focus the visible controls and preserve existing edits, allowing a combined appearance.
- A new session starts with the original photo. Original / Simulated preview controls retain edits for comparison. Region, intensity, phase or hair edits switch to preview; entering a mode by itself does not modify the face.
- Full face provides the existing regional controls and archetype-driven exploration. Lips focuses the fullness slider. Hair offers original/espresso/chestnut/copper/blonde for photos, or the existing crop/swept/bob reference silhouettes in 3D. Cut and length are not generated on photographs.
- A shared settings object follows the person across workspaces. Clinical and Connect provide male/female sample selection and photo/360° selection. Uploaded photos remain selectable in Discover. The 360° scan is still a separate reference person.
- Muscle controls stay exclusive to Clinical Studio. Activating them selects the reference view; returning to a photo disables the overlay. Connect and its embed do not receive clinical controls.
- Optional settings fields retain editing mode, original-preview state and hair color in saved studies without requiring migration. Older saved studies remain valid.

## Hair processing

Google's Apache-licensed Hair Segmenter model is bundled beside the existing MediaPipe runtime. It is loaded only when a non-original photo hair color is selected for simulated preview. Images stay on device. The model's `hair` label is resolved from metadata, confidence is copied before releasing the inference result, and the mask is uploaded in the correct texture orientation. Recoloring preserves luminance variation and uses a confidence-feathered blend; no mask means no recoloring. Low-confidence edges, elaborate backgrounds and unusual lighting can produce imperfect boundaries.

The [official Image Segmenter guide](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter/web_js) documents the API. [The model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20-%20Hair%20Segmentation.pdf) documents its selfie-oriented use. Native CPU validation found confident hair pixels on both existing fictional sample portraits. This validates the model inputs and class mapping; it is not browser GPU or visual QA.

## Limits

This remains appearance exploration. Lip changes are not computed from filler volume. Hair color is an illustration, not a dye-result guarantee. 3D hairstyles are reference silhouettes, not personalized reconstruction. Clinical prediction and hair-cut generation are not introduced by this update.
