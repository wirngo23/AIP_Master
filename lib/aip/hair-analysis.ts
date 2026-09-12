import type { ImageSegmenter } from "@mediapipe/tasks-vision";
import { maskBytes } from "./hair";
let segmenter: Promise<ImageSegmenter> | undefined;
export async function analyzeHair(image: HTMLImageElement) {
  segmenter ??= import("@mediapipe/tasks-vision")
    .then(async ({ FilesetResolver, ImageSegmenter }) =>
      ImageSegmenter.createFromOptions(
        await FilesetResolver.forVisionTasks("/models/face-landmarker"),
        {
          baseOptions: {
            modelAssetPath: "/models/face-landmarker/hair_segmenter.tflite",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        },
      ),
    )
    .catch((e) => {
      segmenter = undefined;
      throw e;
    });
  const model = await segmenter;
  const result = model.segment(image);
  try {
    const index = model
      .getLabels()
      .findIndex((label) => label.toLowerCase() === "hair");
    const mask = result.confidenceMasks?.[index];
    if (!mask) throw Error("Hair mask unavailable for this photo.");
    const values = mask.getAsFloat32Array();
    if (!values.some((v) => v > 0.7))
      throw Error("No clear hair region detected. Try another portrait.");
    return {
      width: mask.width,
      height: mask.height,
      bytes: maskBytes(values, mask.width, mask.height),
    };
  } finally {
    result.close();
  }
}
