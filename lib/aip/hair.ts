export const HAIR_COLORS = {
  original: [0, 0, 0],
  espresso: [0.1, 0.065, 0.045],
  chestnut: [0.29, 0.13, 0.065],
  copper: [0.65, 0.23, 0.085],
  blonde: [0.72, 0.56, 0.29],
  silver: [0.58, 0.61, 0.64],
} as const;
export function maskBytes(
  confidence: Float32Array,
  width: number,
  height: number,
) {
  if (confidence.length !== width * height)
    throw Error("Invalid hair mask dimensions");
  const output = new Uint8Array(confidence.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const v = confidence[y * width + x];
      output[(height - y - 1) * width + x] = Math.round(
        (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0) * 255,
      );
    }
  return output;
}
