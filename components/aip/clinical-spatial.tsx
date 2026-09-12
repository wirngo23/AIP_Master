"use client";
import { useEffect, useState } from "react";
import { Activity, Layers3, Pause, Play, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MUSCLES } from "@/lib/aip/spatial";
import { type Settings } from "@/lib/aip/domain";
import WorkspaceExplorer from "./workspace-explorer";
import HeadViewer from "./head-viewer";
import TreatmentExplainer from "./treatment-explainer";
export default function ClinicalSpatial({
  settings,
  src,
  onChange,
}: {
  settings: Settings;
  src: string;
  onChange: (s: Partial<Settings>) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState("frontalis");
  const [showAll, setShowAll] = useState(true);
  const [activity, setActivity] = useState(60);
  const [reduction, setReduction] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(()=>{setSelected(settings.editMode==="lips"?"orbicularis-oris":settings.editMode==="jawline"||settings.editMode==="beard"?"masseter":"frontalis");setReduction(0);setPlaying(false);},[settings.editMode]);
  const muscle = MUSCLES.find((m) => m.id === selected)!;
  return (
    <section className="clinical-spatial">
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
        <HeadViewer managed settings={settings} hair={settings.hair??"default"} clinical={{visible,selected,showAll,activity,reduction,playing}}/>
        {settings.editMode==="hair"&&<label className="form-field">Reference-only hairstyle<Select value={settings.hair??"default"} onValueChange={v=>onChange({hair:v as Settings["hair"]})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="default">Original reference</SelectItem><SelectItem value="crop">Short crop silhouette</SelectItem><SelectItem value="swept">Swept silhouette</SelectItem><SelectItem value="bob">Bob silhouette</SelectItem></SelectContent></Select></label>}
        <TreatmentExplainer mode={settings.editMode}/>
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
            <div className="scenario-disclosure">
              <h3>Illustrative neuromodulation</h3>
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
                This manually chosen reduction affects the highlighted muscle
                illustration. It is independent of the dosage record below.
                Fillers are not modeled as muscle paralysis.
              </p>
            </div>
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
      <div className="panel clinical-person-panel"><WorkspaceExplorer settings={settings} src={src} onChange={onChange}/></div>
    </section>
  );
}
