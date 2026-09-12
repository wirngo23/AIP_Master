import { z } from "zod";
export type HairStyle = "default" | "crop" | "swept" | "bob";
export type Point = [number, number, number];
export type Muscle = {
  id: string;
  name: string;
  region: string;
  action: string;
  center: Point;
  scale: Point;
  angle: number;
  paired: boolean;
  back?: boolean;
};
// Approximate display anchors on the reference scan, not measured anatomy,
// dissection geometry, injection sites, or clinical targeting coordinates.
const rows: [
  string,
  string,
  string,
  string,
  Point,
  Point,
  number,
  boolean,
  boolean?,
][] = [
  [
    "frontalis",
    "Frontalis",
    "Upper face",
    "Elevates the brows and moves forehead skin.",
    [0.3, 1.02, 0.7],
    [0.2, 0.36, 0.04],
    0,
    true,
  ],
  [
    "corrugator",
    "Corrugator supercilii",
    "Upper face",
    "Draws the brows medially and downward.",
    [0.19, 0.63, 0.8],
    [0.15, 0.065, 0.04],
    -0.3,
    true,
  ],
  [
    "procerus",
    "Procerus",
    "Upper face",
    "Draws the medial brow region downward.",
    [0, 0.56, 0.9],
    [0.065, 0.16, 0.035],
    0,
    false,
  ],
  [
    "depressor-supercilii",
    "Depressor supercilii",
    "Upper face",
    "Contributes to lowering the medial brow.",
    [0.12, 0.58, 0.87],
    [0.055, 0.1, 0.03],
    -0.3,
    true,
  ],
  [
    "orbicularis-oculi",
    "Orbicularis oculi",
    "Upper face",
    "Closes the eyelids.",
    [0.34, 0.46, 0.75],
    [0.26, 0.17, 0.04],
    0,
    true,
  ],
  [
    "nasalis",
    "Nasalis",
    "Midface",
    "Contributes to movement of the nasal aperture.",
    [0.13, 0.18, 0.95],
    [0.1, 0.1, 0.04],
    -0.5,
    true,
  ],
  [
    "depressor-septi",
    "Depressor septi nasi",
    "Midface",
    "Moves the nasal septal region downward.",
    [0, 0.01, 0.94],
    [0.055, 0.09, 0.03],
    0,
    false,
  ],
  [
    "levator-labii-alae",
    "Levator labii superioris alaeque nasi",
    "Midface",
    "Elevates the upper lip and contributes to nostril movement.",
    [0.17, 0.12, 0.82],
    [0.045, 0.2, 0.035],
    -0.15,
    true,
  ],
  [
    "levator-labii",
    "Levator labii superioris",
    "Midface",
    "Elevates the upper lip.",
    [0.28, 0.07, 0.76],
    [0.065, 0.22, 0.035],
    -0.2,
    true,
  ],
  [
    "zygomaticus-minor",
    "Zygomaticus minor",
    "Midface",
    "Contributes to upper-lip elevation.",
    [0.38, 0.13, 0.71],
    [0.06, 0.23, 0.035],
    -0.45,
    true,
  ],
  [
    "zygomaticus-major",
    "Zygomaticus major",
    "Midface",
    "Draws the mouth corner upward and laterally.",
    [0.46, 0.04, 0.65],
    [0.08, 0.29, 0.04],
    -0.7,
    true,
  ],
  [
    "levator-anguli",
    "Levator anguli oris",
    "Midface",
    "Elevates the mouth corner.",
    [0.27, -0.03, 0.75],
    [0.075, 0.17, 0.035],
    -0.2,
    true,
  ],
  [
    "risorius",
    "Risorius",
    "Lower face",
    "Retracts the mouth corner laterally.",
    [0.46, -0.14, 0.64],
    [0.26, 0.055, 0.04],
    0.1,
    true,
  ],
  [
    "buccinator",
    "Buccinator",
    "Lower face",
    "Compresses the cheek against the teeth.",
    [0.48, -0.04, 0.57],
    [0.19, 0.19, 0.045],
    0,
    true,
  ],
  [
    "orbicularis-oris",
    "Orbicularis oris",
    "Lower face",
    "Closes and purses the lips.",
    [0, -0.14, 0.86],
    [0.3, 0.15, 0.04],
    0,
    false,
  ],
  [
    "depressor-anguli",
    "Depressor anguli oris",
    "Lower face",
    "Draws the mouth corner downward.",
    [0.3, -0.39, 0.67],
    [0.11, 0.23, 0.04],
    0.32,
    true,
  ],
  [
    "depressor-labii",
    "Depressor labii inferioris",
    "Lower face",
    "Depresses the lower lip.",
    [0.14, -0.37, 0.78],
    [0.085, 0.16, 0.04],
    0.2,
    true,
  ],
  [
    "mentalis",
    "Mentalis",
    "Lower face",
    "Elevates and protrudes the lower lip and chin skin.",
    [0.065, -0.46, 0.85],
    [0.07, 0.13, 0.04],
    0,
    true,
  ],
  [
    "platysma",
    "Platysma",
    "Neck & scalp",
    "Tenses the superficial neck skin.",
    [0.48, -1.06, 0.44],
    [0.24, 0.43, 0.035],
    -0.22,
    true,
  ],
  [
    "masseter",
    "Masseter",
    "Mastication",
    "Elevates the mandible during jaw closure.",
    [0.65, -0.25, 0.25],
    [0.14, 0.34, 0.06],
    -0.12,
    true,
  ],
  [
    "temporalis",
    "Temporalis",
    "Mastication",
    "Elevates and retracts the mandible.",
    [0.68, 0.66, 0.13],
    [0.15, 0.35, 0.055],
    0.2,
    true,
  ],
  [
    "occipitalis",
    "Occipitalis",
    "Neck & scalp",
    "Retracts the scalp.",
    [0.32, 0.92, -0.7],
    [0.23, 0.23, 0.045],
    0,
    true,
    true,
  ],
  [
    "auricularis-anterior",
    "Auricularis anterior",
    "Neck & scalp",
    "Contributes to small movements of the external ear.",
    [0.77, 0.41, 0.07],
    [0.095, 0.1, 0.035],
    0,
    true,
  ],
  [
    "auricularis-superior",
    "Auricularis superior",
    "Neck & scalp",
    "Contributes to elevation of the external ear.",
    [0.74, 0.72, -0.03],
    [0.1, 0.17, 0.035],
    0,
    true,
  ],
  [
    "auricularis-posterior",
    "Auricularis posterior",
    "Neck & scalp",
    "Contributes to retraction of the external ear.",
    [0.74, 0.4, -0.35],
    [0.09, 0.12, 0.035],
    0,
    true,
    true,
  ],
];
export const MUSCLES: Muscle[] = rows.map(
  ([id, name, region, action, center, scale, angle, paired, back]) => ({
    id,
    name,
    region,
    action,
    center,
    scale,
    angle,
    paired,
    back,
  }),
);
export function muscleRay(
  group: Muscle,
  side: number,
): { origin: Point; direction: Point } {
  if (group.region === "Mastication" || group.id.startsWith("auricularis")) {
    return {
      origin: [side * 4, group.center[1], group.center[2]],
      direction: [-side, 0, 0],
    };
  }
  return {
    origin: [group.center[0] * side, group.center[1], group.back ? -4 : 4],
    direction: [0, 0, group.back ? 1 : -1],
  };
}
export const scenarioSchema = z
  .object({
    kind: z.enum(["toxin", "filler"]),
    product: z.string().trim().min(1).max(80),
    amount: z.number().finite().nonnegative().max(10000),
    muscle: z.string().refine((id) => MUSCLES.some((m) => m.id === id)),
    activity: z.number().min(0).max(100),
    reduction: z.number().min(0).max(100),
  })
  .strict();
export function viewPreset(view: string) {
  return (
    (
      {
        front: 0,
        left: -Math.PI / 2,
        right: Math.PI / 2,
        back: Math.PI,
      } as Record<string, number>
    )[view] ?? 0
  );
}
export function deformPoint(
  p: Point,
  a: [number, number, number, number],
  strength: number,
): Point {
  const [x, y, z] = p;
  if (z <= 0 || strength === 0) return [...p];
  const g = (cx: number, cy: number, sx: number, sy: number) =>
    Math.exp(-2 * (((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
  const side = x < 0 ? -1 : 1,
    front = Math.min(1, z / 0.65),
    s = Math.max(0, Math.min(1, strength)) * front;
  return [
    x +
      side *
        s *
        (0.035 * a[0] * g(side * 0.43, 0.08, 0.3, 0.3) +
          0.03 * a[1] * g(side * 0.39, -0.4, 0.3, 0.35)),
    y +
      s *
        (0.018 * a[3] * g(side * 0.3, 0.6, 0.2, 0.15) +
          (y + 0.14) * 0.1 * a[2] * g(0, -0.14, 0.3, 0.2)),
    z + s * 0.035 * a[2] * g(0, -0.14, 0.3, 0.17),
  ];
}
