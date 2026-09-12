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
import { type Settings } from "@/lib/aip/domain";
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
      {mode === "full" && faceControls && (
        <div className="focused-controls">
          {(["cheek", "jaw", "lip", "brow", "intensity"] as const).map((k) => (
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
                  {["original", "espresso", "chestnut", "copper", "blonde"].map(
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
              : "Color preview follows the detected hair on your photo. Hair length and cut are preserved; use the 3D reference for style silhouettes."}
          </p>
        </div>
      )}
    </div>
  );
}
