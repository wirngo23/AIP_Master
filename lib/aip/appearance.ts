import { progression, type Settings } from "./domain.ts";
export type XY = { x: number; y: number };
export type FaceGeometry = {
  cheeks: [XY, XY];
  jaw: [XY, XY];
  brows: [XY, XY];
  lips: XY;
  width: number;
  height: number;
  lipWidth: number;
  lipHeight: number;
};
const softerJaw = new Set(["F01", "F02", "F03", "F04", "M05", "M06", "M07"]);
export function appearanceAmounts(
  s: Settings,
): [number, number, number, number] {
  return [
    s.cheek / 100,
    (s.jaw / 100) * (softerJaw.has(s.archetype) ? -1 : 1),
    s.lip / 100,
    s.brow / 100,
  ];
}
export function geometryFromLandmarks(
  points: XY[],
  aspect: number,
): FaceGeometry {
  const ids = [
    234, 454, 205, 425, 132, 361, 105, 334, 10, 152, 13, 14, 61, 291, 1,
  ];
  if (
    !Number.isFinite(aspect) ||
    aspect <= 0 ||
    ids.some(
      (i) =>
        !points[i] ||
        !Number.isFinite(points[i].x) ||
        !Number.isFinite(points[i].y) ||
        points[i].x < 0.01 ||
        points[i].x > 0.99 ||
        points[i].y < 0.01 ||
        points[i].y > 0.99,
    )
  )
    throw Error("Use one fully visible face in a front-facing photo.");
  const width = Math.abs(points[454].x - points[234].x),
    height = points[152].y - points[10].y;
  const roll =
    Math.abs(points[105].y - points[334].y) /
    (Math.abs(points[105].x - points[334].x) * aspect);
  const noseOffset =
    Math.abs(points[1].x - (points[234].x + points[454].x) / 2) / width;
  if (width < 0.12 || height < 0.18 || roll > 0.28 || noseOffset > 0.2)
    throw Error(
      "Use a larger, level, front-facing portrait. This angle cannot support the preview.",
    );
  const p = (i: number): XY => ({ x: points[i].x, y: 1 - points[i].y });
  const pair = (a: number, b: number): [XY, XY] =>
    [p(a), p(b)].sort((a, b) => a.x - b.x) as [XY, XY];
  return {
    cheeks: pair(205, 425),
    jaw: pair(132, 361),
    brows: pair(105, 334),
    lips: {
      x: (points[13].x + points[14].x) / 2,
      y: 1 - (points[13].y + points[14].y) / 2,
    },
    width,
    height,
    lipWidth: Math.abs(points[291].x - points[61].x),
    lipHeight: Math.max(0.018, Math.abs(points[14].y - points[13].y)),
  };
}
// Artistic displacement, measured relative to the detected face. No dose or clinical outcome model.
export function createWarp(s: Settings, face: FaceGeometry) {
  const [cheek, jaw, lip, brow] = appearanceAmounts(s);
  const strength = (s.intensity / 100) * progression(s.phase);
  const regions: number[] = [],
    moves: number[] = [];
  for (const [pair, value, radiusX, radiusY, vertical] of [
    [face.cheeks, cheek, 0.3, 0.2, false],
    [face.jaw, jaw, 0.28, 0.24, false],
    [face.brows, brow, 0.23, 0.12, true],
  ] as const)
    for (let i = 0; i < 2; i++) {
      regions.push(
        pair[i].x,
        pair[i].y,
        face.width * radiusX,
        face.height * radiusY,
      );
      moves.push(
        vertical
          ? 0
          : (i === 0 ? -1 : 1) * face.width * 0.13 * value * strength,
        vertical ? face.height * 0.08 * value * strength : 0,
      );
    }
  return {
    regions,
    moves,
    lip: [
      face.lips.x,
      face.lips.y,
      face.lipWidth * 0.7,
      Math.max(face.lipHeight * 1.5, 0.035),
    ],
    lipScale: lip * strength * 0.7,
  };
}
