"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ARCHETYPES, type Settings } from "@/lib/aip/domain";
export default function EditingModes({
  settings,
  onChange,
  faceControls = false,
}: {
  settings: Settings;
  onChange: (s: Partial<Settings>) => void;
  faceControls?: boolean;
}) {
  const mode = settings.editMode ?? "full";
  const jawDirection=settings.jawDirection??ARCHETYPES.find(a=>a.id===settings.archetype)!.motion.jaw;
  return (
    <div className="editing-modes">
      <Tabs
        value={mode}
        onValueChange={(v) => onChange({ editMode: v as Settings["editMode"] })}
      >
        <TabsList className="editing-mode-tabs">
          <TabsTrigger value="full">Full face</TabsTrigger>
          <TabsTrigger value="lips">Lips</TabsTrigger>
          <TabsTrigger value="hair">Hair</TabsTrigger>
          <TabsTrigger value="beard">Beards</TabsTrigger>
          <TabsTrigger value="jawline">Jawline</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="original-mode">
        <button
          className={settings.previewOriginal ? "active" : ""}
          onClick={() => onChange({ previewOriginal: true })}
        >
          Original · as is
        </button>
        <button
          className={!settings.previewOriginal ? "active" : ""}
          onClick={() => onChange({ previewOriginal: false })}
        >
          Simulated preview
        </button>
      </div>
      {(mode==='full'||mode==='lips'||mode==='jawline')&&<div className="focused-controls shared-strength"><label>Exploration intensity <span>{settings.intensity}%</span><Slider value={[settings.intensity]} onValueChange={v=>onChange({intensity:v[0]})} aria-label="Exploration intensity"/></label><details><summary>Illustrative progression</summary><Slider value={[settings.phase]} onValueChange={v=>onChange({phase:v[0]})} aria-label="Regional preview progression"/><p>Baseline → emerging → full expression → softening → return. Both endpoints show baseline; the middle shows the full edit. This is not a clinical time or dose scale.</p></details></div>}
      {mode === "full" && faceControls && (
        <div className="focused-controls">
          {(["cheek", "jaw", "lip", "brow"] as const).map((k) => (
            <label key={k}>
              {
                {
                  cheek: "Cheek contour",
                  jaw: "Jaw contour",
                  lip: "Lip fullness",
                  brow: "Brow expression",
                  intensity: "Exploration intensity",
                }[k]
              }{" "}
              <span>{settings[k]}%</span>
              <Slider
                value={[settings[k]]}
                onValueChange={(v) => onChange({ [k]: v[0] })}
                aria-label={k + " adjustment"}
              />
            </label>
          ))}
        </div>
      )}
      {mode === "lips" && (
        <div className="focused-controls">
          <label>
            Lip fullness <span>{settings.lip}%</span>
            <Slider
              value={[settings.lip]}
              onValueChange={(v) => onChange({ lip: v[0] })}
              aria-label="Focused lip fullness"
            />
          </label>
          <p>
            Refine lip fullness while keeping your other selections. This is an
            appearance edit, not a filler-volume prediction.
          </p>
          {([['lipUpper','Upper-lip emphasis',0,100,50],['lipLower','Lower-lip emphasis',0,100,50],['lipWidth','Lip width',-100,100,0],['lipCupid','Cupid’s bow',0,100,0]] as const).map(([key,label,min,max,fallback])=><label key={key}>{label} <span>{settings[key]??fallback}%</span><Slider min={min} max={max} value={[settings[key]??fallback]} onValueChange={v=>onChange({[key]:v[0]})} aria-label={label}/></label>)}
        </div>
      )}
      {mode === "hair" && (
        <div className="focused-controls">
          {settings.viewer === "3d" ? (
            <label>
              Reference hairstyle
              <Select
                value={settings.hair ?? "default"}
                onValueChange={(v) => onChange({ hair: v as Settings["hair"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Original hair</SelectItem>
                  <SelectItem value="crop">Short crop silhouette</SelectItem>
                  <SelectItem value="swept">Swept volume silhouette</SelectItem>
                  <SelectItem value="bob">Bob silhouette</SelectItem>
                </SelectContent>
              </Select>
            </label>
          ) : (
            <label>
              Hair color
              <Select
                value={settings.hairColor ?? "original"}
                onValueChange={(v) =>
                  onChange({ hairColor: v as Settings["hairColor"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["original", "espresso", "chestnut", "copper", "blonde", "silver"].map(
                    (c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </label>
          )}
          <p>
            {settings.viewer === "3d"
              ? "Optional silhouettes on the reference scan."
              : "Color follows detected hair. Length and cut stay unchanged. Color choices do not represent injectable treatments."}
          </p>
          <label>Color blend <span>{settings.hairStrength??90}%</span><Slider value={[settings.hairStrength??90]} onValueChange={v=>onChange({hairStrength:v[0]})} aria-label="Hair color blend"/></label>
        </div>
      )}
      {mode==='beard'&&<div className="focused-controls"><label>Facial hair density <span>{settings.beardDensity??50}%</span><Slider value={[settings.beardDensity??50]} onValueChange={v=>onChange({beardDensity:v[0]})} aria-label="Beard preview density"/></label><label>Facial hair tone<Select value={settings.beardColor??'espresso'} onValueChange={v=>onChange({beardColor:v as Settings['beardColor']})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['espresso','chestnut','copper','silver'].map(c=><SelectItem value={c} key={c}>{c}</SelectItem>)}</SelectContent></Select></label><p>A textured cosmetic overlay. It adds facial hair; it cannot remove existing hair or predict growth from treatment.</p></div>}
      {mode==='jawline'&&<div className="focused-controls"><label>Jaw width direction<Select value={jawDirection<0?'narrow':'wide'} onValueChange={v=>onChange({jawDirection:v==='narrow'?-1:1})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="wide">Widen contour</SelectItem><SelectItem value="narrow">Narrow contour</SelectItem></SelectContent></Select></label><label>Jaw contour <span>{settings.jaw}%</span><Slider value={[settings.jaw]} onValueChange={v=>onChange({jaw:v[0]})} aria-label="Focused jaw contour"/></label><label>Chin length <span>{settings.chin??0}%</span><Slider min={-100} max={100} value={[settings.chin??0]} onValueChange={v=>onChange({chin:v[0]})} aria-label="Chin length"/></label><p>Explore lower-face proportions. Narrowing and shortening are appearance edits; filler adds volume and cannot remove bone or tissue.</p></div>}
    </div>
  );
}
