import { z } from "zod";
export type Family = "feminine" | "masculine";
export type Archetype = {
  id: string;
  family: Family;
  name: string;
  description: string;
  values: [number, number, number, number];
};
const female: [string, string, Archetype["values"]][] = [
  [
    "Soft",
    "Gentle contours. A softer presence. Your individuality, preserved.",
    [35, 24, 20, 30],
  ],
  [
    "Feminine",
    "Explore curved contours and delicate definition.",
    [45, 18, 42, 32],
  ],
  [
    "Happy",
    "An open, bright expression, interpreted as a visual preference.",
    [30, 18, 20, 58],
  ],
  [
    "Relaxed",
    "Quiet definition and an easy, rested expression.",
    [22, 16, 14, 35],
  ],
  ["Elegant", "Balanced contour with restrained emphasis.", [42, 35, 22, 28]],
  [
    "Defined contour",
    "Explore stronger cheek and jaw definition.",
    [64, 58, 20, 24],
  ],
  [
    "Executive presence",
    "A composed look with purposeful definition.",
    [42, 48, 18, 38],
  ],
  [
    "Natural refreshed",
    "Minimal changes with familiar proportions.",
    [18, 14, 12, 22],
  ],
  [
    "Expressive",
    "Explore distinct contours and a more open expression.",
    [42, 32, 34, 50],
  ],
  [
    "Classic balanced",
    "A measured balance of contour and expression.",
    [35, 32, 26, 30],
  ],
];
const male: [string, string, Archetype["values"]][] = [
  [
    "Masculine",
    "Explore pronounced contours and a structured jaw.",
    [38, 70, 12, 22],
  ],
  [
    "Leader",
    "A bold visual direction with confident definition.",
    [45, 62, 14, 32],
  ],
  ["Executive", "Composed contours and considered emphasis.", [36, 50, 12, 28]],
  ["Mature", "Subtle structure that retains your character.", [30, 40, 10, 20]],
  [
    "Pretty boy",
    "A softer adult style with smooth visual contours.",
    [40, 22, 32, 38],
  ],
  ["Relaxed", "Easy definition and a relaxed appearance.", [20, 25, 12, 30]],
  [
    "Approachable",
    "Softened structure with an open expression.",
    [28, 28, 20, 42],
  ],
  [
    "Athletic contour",
    "A more defined cheek and jaw silhouette.",
    [58, 65, 10, 24],
  ],
  [
    "Classic balanced",
    "Measured contour, proportion, and expression.",
    [35, 40, 18, 28],
  ],
  [
    "Natural refreshed",
    "Small visual changes with a familiar identity.",
    [16, 18, 10, 20],
  ],
];
export const ARCHETYPES: Archetype[] = [
  ...female.map(([name, description, values], i) => ({
    id: `F${String(i + 1).padStart(2, "0")}`,
    family: "feminine" as const,
    name,
    description,
    values,
  })),
  ...male.map(([name, description, values], i) => ({
    id: `M${String(i + 1).padStart(2, "0")}`,
    family: "masculine" as const,
    name,
    description,
    values,
  })),
];
const percent = z.number().finite().min(0).max(100);
export const settingsSchema = z
  .object({
    archetype: z.string().refine((id) => ARCHETYPES.some((a) => a.id === id)),
    intensity: percent,
    cheek: percent,
    jaw: percent,
    lip: percent,
    brow: percent,
    phase: percent,
    sample: z.enum(["woman", "man", "upload"]),
    viewer: z.enum(["photo", "3d"]).optional(),
    hair: z.enum(["default", "crop", "swept", "bob"]).optional(),
    alignment: z.object({
      zoom: z.number().min(1).max(2),
      x: z.number().min(-0.3).max(0.3),
      y: z.number().min(-0.3).max(0.3),
    }),
  })
  .strict();
export const studySchema = z.object({
  title: z.string().trim().min(1).max(80),
  settings: settingsSchema,
});
export const consultationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(200),
  studyId: z.string().uuid().nullable(),
  goal: z.string().trim().min(3).max(1500),
  contactConsent: z.literal(true),
  followup: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;
export const DEFAULT_SETTINGS: Settings = {
  archetype: "F01",
  intensity: 45,
  cheek: 35,
  jaw: 24,
  lip: 20,
  brow: 30,
  phase: 50,
  sample: "woman",
  viewer: "3d",
  hair: "default",
  alignment: { zoom: 1, x: 0, y: 0 },
};
export function progression(phase: number) {
  return phase === 0 || phase === 100
    ? 0
    : Math.pow(
        Math.sin((Math.PI * Math.max(0, Math.min(100, phase))) / 100),
        1.25,
      );
}
export function assertSameOrigin(origin: string | null, url: string) {
  if (!origin || origin !== new URL(url).origin)
    throw new Error("Cross-origin write rejected");
}
export type SavedStudy = {
  id: string;
  title: string;
  settings: Settings;
  hasPhoto: boolean;
  createdAt: string;
};
export type Consultation = {
  id: string;
  name: string;
  email: string;
  studyId: string | null;
  goal: string;
  followup: boolean;
  status: "draft" | "reviewed" | "archived";
  note: string;
  createdAt: string;
};
