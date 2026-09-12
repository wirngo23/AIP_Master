import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { geometryFromLandmarks, type FaceGeometry } from "./appearance";
let detector: Promise<FaceLandmarker> | undefined;
function getDetector() {
  detector ??= import("@mediapipe/tasks-vision")
    .then(async ({ FilesetResolver, FaceLandmarker }) => {
      const files = await FilesetResolver.forVisionTasks(
        "/models/face-landmarker",
      );
      return FaceLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: "/models/face-landmarker/face_landmarker.task",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numFaces: 2,
        minFaceDetectionConfidence: 0.65,
        minFacePresenceConfidence: 0.65,
      });
    })
    .catch((e) => {
      detector = undefined;
      throw e;
    });
  return detector;
}
// One shared model, image-only inference. Images and landmarks are never sent to a server.
export async function analyzeFace(
  image: HTMLImageElement,
): Promise<FaceGeometry> {
  const model = await getDetector();
  const result = model.detect(image);
  if (result.faceLandmarks.length !== 1)
    throw Error(
      result.faceLandmarks.length
        ? "Use a photo containing one person only."
        : "No face found. Use a clear, front-facing portrait.",
    );
  return geometryFromLandmarks(
    result.faceLandmarks[0],
    image.naturalWidth / image.naturalHeight,
  );
}
