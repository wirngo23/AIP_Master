"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  PRODUCTS,
  REGIONS,
  doseRecordSchema,
  doseReference,
  totalAmount,
} from "@/lib/aip/dosage";
import { download } from "@/lib/aip/client";
export default function DosageDetails() {
  const [product, setProduct] = useState("botox"),
    [region, setRegion] = useState("glabella");
  const [exact, setExact] = useState("BOTOX Cosmetic"),
    [notes, setNotes] = useState("");
  const [amounts, setAmounts] = useState({ left: "", right: "", central: "" });
  const [error, setError] = useState("");
  const kind = product === "filler" ? "filler" : "toxin",
    unit = kind === "filler" ? "mL" : "Units";
  const reference = doseReference(product, region);
  const parsed = doseRecordSchema.safeParse({
    product,
    exactProduct: exact,
    region,
    left: Number(amounts.left),
    right: Number(amounts.right),
    central: Number(amounts.central),
    notes,
  });
  const hasAmount = Object.values(amounts).some((v) => v !== "");
  const total = parsed.success && hasAmount ? totalAmount(parsed.data) : null;
  function exportRecord() {
    if (!parsed.success || !hasAmount) {
      setError(
        "Enter the exact product and valid non-negative amounts before exporting.",
      );
      return;
    }
    setError("");
    download(
      new Blob(
        [
          JSON.stringify(
            {
              ...parsed.data,
              total: totalAmount(parsed.data),
              unit,
              recordType: "consultation discussion draft",
              labelReference: reference ?? null,
              amountsEnteredByUser: true,
              doseResponseModel: null,
              patientSpecificPrediction: false,
              createdAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      "aip-dosage-discussion.json",
    );
  }
  return (
    <section className="panel dosage-panel">
      <div className="panel-heading">
        <h2>Dosage details</h2>
        <span className="clinical-exclusive">CLINICAL STUDIO</span>
      </div>
      <p className="muted">
        Product-specific references and a discussion record. Session only ·
        export before leaving.
      </p>
      <div className="dosage-grid">
        <div>
          <label className="form-field">
            Product
            <Select
              value={product}
              onValueChange={(v) => {
                setProduct(v);
                setExact(v==="filler"||v==="other-toxin"?"":PRODUCTS.find((p) => p.id === v)!.name);
                setRegion(v === "filler" ? "lips" : "glabella");
                setAmounts({ left: "", right: "", central: "" });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {(product === "filler" || product === "other-toxin") && (
            <label className="form-field">
              Exact formulation
              <input
                value={exact}
                maxLength={80}
                onChange={(e) => setExact(e.target.value)}
              />
            </label>
          )}
          <label className="form-field">
            Region
            <Select
              value={region}
              onValueChange={(v) => {
                setRegion(v);
                setAmounts({ left: "", right: "", central: "" });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.filter((r) => r.kind === kind).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="dose-reference">
            <span className="tiny-label">
              US LABEL REFERENCE · NOT AN INDIVIDUAL PRESCRIPTION
            </span>
            {reference ? (
              <>
                <strong className="dose-total">
                  {reference.total} {unit}
                  <small>published regional total</small>
                </strong>
                <p>{reference.scope}</p>
                <p>{reference.mechanism}</p>
                <a
                  className="text-link"
                  href={reference.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Full prescribing information ↗
                </a>
                <small>
                  Source checked {reference.checked}. Read the complete
                  indication, contraindications and warnings; a clinician must
                  assess suitability.
                </small>
              </>
            ) : (
              <>
                <h3>No dose reference supplied</h3>
                <p>
                  {kind === "filler"
                    ? "Filler response depends on the exact formulation, tissue, placement and individual anatomy. There is no universal mL-to-shape conversion here."
                    : "This product–region combination has no label reference in AIP. No dose is inferred."}
                </p>
                {kind === "filler" && (
                  <a
                    className="text-link"
                    href="https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers"
                    target="_blank"
                    rel="noreferrer"
                  >
                    FDA filler information & risks ↗
                  </a>
                )}
              </>
            )}
          </div>
        </div>
        <div>
          <h3>Amounts entered for discussion</h3>
          <p className="micro-copy">
            Optional laterality breakdown; each field begins empty. These
            entries never prescribe or calculate an image result.
          </p>
          <div className="dose-inputs">
            {(["left", "right", "central"] as const).map((side) => (
              <label className="form-field" key={side}>
                {side === "central"
                  ? "Central / unallocated"
                  : side === "left"
                    ? "Left"
                    : "Right"}{" "}
                · {unit}
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="10000"
                  step="any"
                  placeholder="—"
                  value={amounts[side]}
                  onChange={(e) =>
                    setAmounts({ ...amounts, [side]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <div className="record-total" aria-live="polite">
            <span>Recorded total</span>
            <strong>
              {total ?? "—"} {unit}
            </strong>
          </div>
          {reference && total !== null && (
            <p className="micro-copy">
              {total === reference.total
                ? "The recorded total matches this label reference. Matching does not establish suitability or safety."
                : "The recorded total differs from the cited label total. AIP does not determine whether this amount is appropriate."}
            </p>
          )}
          <label className="form-field">
            Practitioner rationale / considerations
            <textarea
              value={notes}
              maxLength={2000}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Assessment, previous response, asymmetry, formulation and review questions"
            />
          </label>
          <p className="micro-copy">
            Toxin Units are product-specific and cannot be converted between
            brands here. No injection-site, depth or needle guidance is
            provided.
          </p>
          <button className="secondary-button" onClick={exportRecord}>
            <Download size={15} /> Export dosage discussion
          </button>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
