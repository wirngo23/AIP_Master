"use client";
import { type ComponentProps } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { selectSample, type Settings } from "@/lib/aip/domain";
import EditingModes from "./editing-modes";
import HeadViewer from "./head-viewer";
import { Portrait } from "./portrait";
export default function WorkspaceExplorer({
  settings,
  src,
  onChange,
  clinical,
  compact = false,
}: {
  settings: Settings;
  src: string;
  onChange: (s: Partial<Settings>) => void;
  clinical?: ComponentProps<typeof HeadViewer>["clinical"];
  compact?: boolean;
}) {
  return (
    <div className={`workspace-explorer ${compact ? "compact-explorer" : ""}`}>
      <div className="portal-switch">
        <button
          aria-pressed={settings.sample === "woman"}
          onClick={() =>
            onChange(selectSample(settings,"woman"))
          }
        >
          Woman sample
        </button>
        <button
          aria-pressed={settings.sample === "man"}
          onClick={() =>
            onChange(selectSample(settings,"man"))
          }
        >
          Man sample
        </button>
        {settings.sample === "upload" && <span>Your photo</span>}
      </div>
      <EditingModes settings={settings} onChange={onChange} faceControls />
      <Tabs
        value={settings.viewer ?? "photo"}
        onValueChange={(v) => onChange({ viewer: v as Settings["viewer"] })}
      >
        <TabsList className="viewer-mode">
          <TabsTrigger value="photo">Photo study</TabsTrigger>
          <TabsTrigger value="3d">360° reference</TabsTrigger>
        </TabsList>
      </Tabs>
      {settings.viewer === "3d" ? (
        <HeadViewer
          settings={settings}
          hair={settings.hair ?? "default"}
          onHairChange={(hair) => onChange({ hair })}
          clinical={clinical}
          compact={compact}
          managed
        />
      ) : src ? (
        <div className="portrait-stage workspace-portrait">
          <Portrait
            src={src}
            settings={settings}
            split={settings.previewOriginal ? 100 : 0}
            overlay={false}
          />
        </div>
      ) : (
        <div className="missing-portrait">
          Upload the original photo in Discover to continue this study.
        </div>
      )}
    </div>
  );
}
