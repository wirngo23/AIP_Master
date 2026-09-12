import { z } from "zod";
export type Family = "feminine" | "masculine";
export type Archetype = {
  id: string;
  family: Family;
  name: string;
  description: string;
  values: [number, number, number, number];
  motion: { cheek: number; jaw: number; brow: number; smile: number };
};
const motions: Record<string, Archetype["motion"]> = {
  F01: { cheek: -1, jaw: -1, brow: 0.3, smile: 0 },
  F02: { cheek: 1, jaw: -1, brow: 1, smile: 0 },
  F03: { cheek: 1, jaw: -1, brow: 1, smile: 0.7 },
  F04: { cheek: -1, jaw: -1, brow: -0.6, smile: 0 },
  F05: { cheek: 1, jaw: 1, brow: 0.5, smile: 0 },
  F06: { cheek: 1, jaw: 1, brow: 0.4, smile: 0 },
  F07: { cheek: 1, jaw: 1, brow: -0.3, smile: 0 },
  F08: { cheek: 1, jaw: -1, brow: 0.5, smile: 0.1 },
  F09: { cheek: 1, jaw: 1, brow: 1, smile: 0.4 },
  F10: { cheek: 1, jaw: 1, brow: 0.5, smile: 0 },
  M01: { cheek: 1, jaw: 1, brow: -0.3, smile: 0 },
  M02: { cheek: 1, jaw: 1, brow: -0.5, smile: 0 },
  M03: { cheek: 1, jaw: 1, brow: -0.3, smile: 0 },
  M04: { cheek: 1, jaw: 1, brow: 1, smile: 0 },
  M05: { cheek: 1, jaw: -1, brow: 0.7, smile: 0.2 },
  M06: { cheek: -1, jaw: -1, brow: -0.6, smile: 0 },
  M07: { cheek: -1, jaw: -1, brow: 0.6, smile: 0.5 },
  M08: { cheek: 1, jaw: 1, brow: 0.2, smile: 0 },
  M09: { cheek: 1, jaw: 1, brow: 0.3, smile: 0 },
  M10: { cheek: 1, jaw: -1, brow: 0.3, smile: 0.1 },
};
const descriptions: Record<string, string> = {
  F01: "Gently narrow the cheeks and jaw, add modest lip fullness, and make a small brow lift.",
  F02: "Emphasize the cheeks, narrow the jaw, add lip fullness, and lift the brows.",
  F03: "Lift the mouth corners and brows, emphasize the cheeks, and soften the jaw width.",
  F04: "Gently lower the brows, narrow the cheeks and jaw, and keep lip changes small. Mouth corners stay unchanged.",
  F05: "Add moderate cheek and jaw width with restrained lip fullness and a small brow lift.",
  F06: "Add pronounced cheek and jaw width, with modest lip fullness and a small brow lift.",
  F07: "Emphasize jaw width and cheek structure, with gently lowered brows and restrained lip fullness.",
  F08: "Add small cheek and lip changes, subtly narrow the jaw, and make a slight brow and mouth-corner lift.",
  F09: "Lift the brows and mouth corners, with added cheek and jaw width and lip fullness.",
  F10: "Add moderate cheek and jaw width, modest lip fullness, and a small brow lift. Mouth corners stay unchanged.",
  M01: "Emphasize a wider jaw and cheek structure, gently lower the brows, and keep lip changes small.",
  M02: "Add strong jaw and cheek width, with lowered brows and restrained lip fullness.",
  M03: "Add moderate jaw and cheek width, gently lower the brows, and keep lip changes small.",
  M04: "Add modest jaw and cheek width and a little lip fullness. Brow height and mouth corners stay unchanged.",
  M05: "Narrow the jaw, emphasize cheeks and lips, and make a gentle brow and mouth-corner lift.",
  M06: "Gently lower the brows, narrow the cheeks and jaw, and keep lip changes small. Mouth corners stay unchanged.",
  M07: "Narrow the cheeks and jaw and lift the mouth corners, with a gentle brow lift and modest lip fullness.",
  M08: "Add pronounced jaw and cheek width, with minimal lip fullness and a small brow lift.",
  M09: "Add moderate jaw and cheek width, with restrained lip fullness and a small brow lift.",
  M10: "Make small cheek and lip changes, subtly narrow the jaw, and add a slight brow and mouth-corner lift.",
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
  ["Mature", "Subtle structure that retains your character.", [30, 40, 10, 0]],
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
    description:
      descriptions[`F${String(i + 1).padStart(2, "0")}`] ?? description,
    motion: motions[`F${String(i + 1).padStart(2, "0")}`],
    values,
  })),
  ...male.map(([name, description, values], i) => ({
    id: `M${String(i + 1).padStart(2, "0")}`,
    family: "masculine" as const,
    name,
    description:
      descriptions[`M${String(i + 1).padStart(2, "0")}`] ?? description,
    motion: motions[`M${String(i + 1).padStart(2, "0")}`],
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
    editMode: z.enum(["full", "lips", "hair"]).optional(),
    previewOriginal: z.boolean().optional(),
    hairColor: z
      .enum(["original", "espresso", "chestnut", "copper", "blonde"])
      .optional(),
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
export function editSettings(s: Settings, patch: Partial<Settings>): Settings {
  const edits = [
    "cheek",
    "jaw",
    "lip",
    "brow",
    "intensity",
    "phase",
    "hair",
    "hairColor",
  ];
  return {
    ...s,
    ...patch,
    ...(edits.some((k) => k in patch) && !("previewOriginal" in patch)
      ? { previewOriginal: false }
      : {}),
    ...(patch.sample ? { viewer: "photo" as const } : {}),
  };
}
export function applyArchetype(s: Settings, id: string): Settings {
  const a = ARCHETYPES.find((a) => a.id === id);
  if (!a) throw Error("Unknown archetype");
  const sample =
    s.sample === "upload"
      ? "upload"
      : a.family === "masculine"
        ? "man"
        : "woman";
  return {
    ...s,
    archetype: id,
    previewOriginal: false,
    sample,
    viewer: s.sample === "upload" ? s.viewer : "photo",
    alignment: sample === s.sample ? s.alignment : { zoom: 1, x: 0, y: 0 },
    cheek: a.values[0],
    jaw: a.values[1],
    lip: a.values[2],
    brow: a.values[3],
  };
}
export function selectSample(s:Settings,sample:"man"|"woman"):Settings {
  return {...applyArchetype({...s,sample},sample==="man"?"M01":"F01"),alignment:s.sample===sample?s.alignment:{zoom:1,x:0,y:0},previewOriginal:true};
}
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
