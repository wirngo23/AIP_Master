import { z } from "zod";
export const PRODUCTS = [
  { id: "botox", name: "BOTOX Cosmetic", kind: "toxin" },
  { id: "dysport", name: "Dysport", kind: "toxin" },
  { id: "other-toxin", name: "Other neuromodulator", kind: "toxin" },
  { id: "filler", name: "Dermal filler", kind: "filler" },
] as const;
export const REGIONS = [
  { id: "glabella", name: "Glabellar complex", kind: "toxin" },
  {
    id: "lateral-canthal",
    name: "Lateral canthal lines · both sides",
    kind: "toxin",
  },
  {
    id: "forehead-glabella",
    name: "Forehead + glabellar complex",
    kind: "toxin",
  },
  {
    id: "other-muscle",
    name: "Other region · no reference supplied",
    kind: "toxin",
  },
  { id: "lips", name: "Lips", kind: "filler" },
  { id: "cheeks", name: "Cheeks", kind: "filler" },
  { id: "chin-jaw", name: "Chin / jaw contour", kind: "filler" },
  { id: "other-tissue", name: "Other tissue region", kind: "filler" },
] as const;
type Reference = {
  total: number;
  scope: string;
  mechanism: string;
  source: string;
  checked: string;
};
const botoxSource =
  "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=485d9b71-6881-42c5-a620-a4360c7192ab";
const refs: Record<string, Reference> = {
  "botox:glabella": {
    total: 20,
    scope: "Entire glabellar complex; not per muscle or per side.",
    mechanism:
      "Corrugator/procerus activity contributes to frown lines. Neuromodulation can reduce that activity.",
    source: botoxSource,
    checked: "2026-09-12",
  },
  "botox:lateral-canthal": {
    total: 24,
    scope: "Combined bilateral region; not 24 Units on each side.",
    mechanism:
      "Orbicularis oculi activity contributes to lateral canthal lines during expression.",
    source: botoxSource,
    checked: "2026-09-12",
  },
  "botox:forehead-glabella": {
    total: 40,
    scope:
      "20 Units forehead plus 20 Units glabella in the cited label. The combined total already includes glabella.",
    mechanism:
      "Frontalis elevates the brow; glabellar depressors act in the opposite direction. Their balance matters.",
    source: botoxSource,
    checked: "2026-09-12",
  },
  "dysport:glabella": {
    total: 50,
    scope:
      "Entire glabellar complex. Dysport-specific Units; no conversion to other products.",
    mechanism:
      "Reduced glabellar muscle activity can lessen expression-related frown lines.",
    source:
      "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=97513722-8426-4ce3-b85d-0e08e436a140&type=display",
    checked: "2026-09-12",
  },
};
export function doseReference(product: string, region: string) {
  return refs[`${product}:${region}`];
}
const amount = z.number().finite().min(0).max(10000);
export const doseRecordSchema = z
  .object({
    product: z.enum(["botox", "dysport", "other-toxin", "filler"]),
    exactProduct: z.string().trim().min(1).max(80),
    region: z.string(),
    left: amount,
    right: amount,
    central: amount,
    notes: z.string().max(2000),
  })
  .strict()
  .refine(r => {
    if (r.product === "botox") return r.exactProduct === "BOTOX Cosmetic";
    if (r.product === "dysport") return r.exactProduct === "Dysport";
    return !["dermal filler","other neuromodulator","filler","toxin"].includes(r.exactProduct.toLowerCase());
  }, {message:"Enter the exact product formulation."})
  .refine(
    (r) =>
      REGIONS.some(
        (a) =>
          a.id === r.region &&
          a.kind === (r.product === "filler" ? "filler" : "toxin"),
      ),
    { message: "Choose a region matching the product type." },
  );
export function totalAmount(r: {
  left: number;
  right: number;
  central: number;
}) {
  return Math.round((r.left + r.right + r.central) * 10000) / 10000;
}
