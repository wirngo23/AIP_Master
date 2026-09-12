# 3D reference asset attribution

**Infinite, 3D Head Scan**, Lee Perry-Smith / Infinite Realities. Licensed under [Creative Commons Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/). Original work: [Infinite Realities / Triplegangers](https://triplegangers.com/).

Distributed files in `public/models/reference-head` were obtained from the official [Three.js r180 example directory](https://github.com/mrdoob/three.js/tree/r180/examples/models/gltf/LeePerrySmith). The original `LeePerrySmith_License.txt` is included alongside the GLB and texture maps.

AIP centers and scales the scan, applies optional artistic vertex deformations, and adds schematic muscle overlays and procedural hair silhouettes. The original creator does not endorse AIP. This scan is not an AIP patient, a reconstruction of an uploaded person, or an example of treatment outcome. Attribution is displayed in the viewer and exported images.

Three.js is MIT licensed; its package retains its own license. Existing fictional photo assets are distinct from this reference scan.

## Local face landmark runtime

`public/models/face-landmarker` includes the WebAssembly runtime from `@mediapipe/tasks-vision` 0.10.32 (Apache 2.0) and Google's float16 Face Landmarker model bundle, version 1. The Apache license and package README are included. Source: [official model bundle](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task), [Google model overview](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker), and [Face Mesh V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf). The model card specifies Apache 2.0 and an AR use case; it does not establish suitability for clinical decisions.
