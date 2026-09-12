"use client";
import { useState } from "react";
import {
  Activity,
  Download,
  Layers3,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MUSCLES, scenarioSchema } from "@/lib/aip/spatial";
import { type Settings } from "@/lib/aip/domain";
import { download } from "@/lib/aip/client";
import HeadViewer from "./head-viewer";
export default function ClinicalSpatial({ settings }: { settings: Settings }) {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState("frontalis");
  const [showAll, setShowAll] = useState(true);
  const [activity, setActivity] = useState(60);
  const [reduction, setReduction] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [kind, setKind] = useState<"toxin" | "filler">("toxin");
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const muscle = MUSCLES.find((m) => m.id === selected)!;
  function exportScenario() {
    const parsed = scenarioSchema.safeParse({
      kind,
      product,
      amount: amount === "" ? NaN : Number(amount),
      muscle: selected,
      activity,
      reduction: kind === "toxin" ? reduction : 0,
    });
    if (!parsed.success) {
      setError(
        "Enter a product name and a non-negative numeric amount. No dose is suggested.",
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
              amountUnit: kind === "toxin" ? "product-specific Units" : "mL",
              evidence:
                "Illustrative manual activity setting, not a predicted treatment response",
              doseResponseModel: null,
              patientSpecific: false,
              source: "AIP reference-head demonstration",
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      "aip-clinical-demonstration.json",
    );
  }
  return (
    <section className="clinical-spatial">
      <div className="panel clinical-3d-panel">
        <HeadViewer
          settings={settings}
          clinical={{
            visible,
            selected,
            showAll,
            activity,
            reduction: kind === "toxin" ? reduction : 0,
            playing,
          }}
        />
      </div>
      <aside className="panel anatomy-panel">
        <div className="panel-heading">
          <Layers3 size={17} />
          <h2>Under the surface</h2>
          <span className="clinical-exclusive">CLINICAL STUDIO</span>
        </div>
        <p className="muted">
          A reference for the conversation. Reveal a schematic muscle layer when
          you need it.
        </p>
        <label className="anatomy-toggle">
          <span>
            <strong>Muscle explorer</strong>
            <small>Off by default · clinical workspace only</small>
          </span>
          <Switch
            checked={visible}
            onCheckedChange={(v) => {
              setVisible(v);
              if (!v) setPlaying(false);
            }}
          />
        </label>
        {visible && (
          <div className="anatomy-content">
            <div className="workspace-notice">
              <ShieldCheck size={15} />
              <span>
                Schematic locations and animated shapes, not a dissected scan or
                injection map. Includes {MUSCLES.length} major muscle groups;
                not an exhaustive anatomical atlas.
              </span>
            </div>
            <label className="form-field">
              Explore a muscle group
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLES.map((m) => (
                    <SelectItem value={m.id} key={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="anatomy-row">
              <Switch checked={showAll} onCheckedChange={setShowAll} />
              <span>Show all groups / highlight selected</span>
            </label>
            <div className="muscle-description">
              <span className="tiny-label">{muscle.region.toUpperCase()}</span>
              <h3>{muscle.name}</h3>
              <p>{muscle.action}</p>
            </div>
            <div className="range-label">
              <label>Illustrative activity</label>
              <span>{activity}%</span>
            </div>
            <Slider
              value={[activity]}
              onValueChange={(v) => setActivity(v[0])}
              aria-label="Illustrative muscle activity"
            />
            <button
              className="secondary-button animate-muscle"
              onClick={() => setPlaying((v) => !v)}
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
              {playing
                ? "Pause muscle demonstration"
                : "Animate selected muscle"}
            </button>
            <details className="scenario-disclosure">
              <summary>Injection & response demonstration</summary>
              <p className="micro-copy">
                Amounts are entered by the user for a demonstration record. They
                do not drive the animation or imply a recommended dose.
              </p>
              <Tabs
                value={kind}
                onValueChange={(v) => {
                  setKind(v as "toxin" | "filler");
                  setProduct("");
                  setAmount("");
                  setReduction(0);
                }}
              >
                <TabsList className="family-tabs">
                  <TabsTrigger value="toxin">Neuromodulator</TabsTrigger>
                  <TabsTrigger value="filler">Filler</TabsTrigger>
                </TabsList>
              </Tabs>
              <label className="form-field">
                Product name
                <input
                  value={product}
                  maxLength={80}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Enter the exact product"
                />
              </label>
              <label className="form-field">
                Recorded amount ·{" "}
                {kind === "toxin" ? "product-specific Units" : "mL"}
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="No dose suggested"
                />
              </label>
              {kind === "toxin" ? (
                <>
                  <div className="range-label">
                    <label>Hypothetical activity reduction</label>
                    <span>{reduction}%</span>
                  </div>
                  <Slider
                    value={[reduction]}
                    onValueChange={(v) => setReduction(v[0])}
                    aria-label="Manually chosen hypothetical activity reduction"
                  />
                  <p className="micro-copy">
                    Manually chosen for illustration. An entered dose does not
                    predict this percentage. Units are product-specific and are
                    not interchangeable.
                  </p>
                </>
              ) : (
                <p className="micro-copy">
                  Filler volume is not modeled as reduced muscle activity.
                  Tissue-volume response is not implemented in this
                  demonstration.
                </p>
              )}
              <button className="secondary-button" onClick={exportScenario}>
                <Download size={15} /> Export demonstration record
              </button>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
            </details>
            <a className="text-link" href="/development#anatomy-evidence">
              Evidence & model boundaries <Activity size={13} />
            </a>
          </div>
        )}
        {!visible && (
          <div className="anatomy-off">
            <Layers3 size={35} />
            <h3>The person comes first.</h3>
            <p>
              The default view shows the skin surface. Muscle and demonstration
              controls stay tucked away until you select them.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}
