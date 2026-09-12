"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  Aperture,
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  FolderOpen,
  ImagePlus,
  Layers3,
  Maximize2,
  RotateCcw,
  Rotate3D,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  ARCHETYPES,
  DEFAULT_SETTINGS,
  settingsSchema,
  type Settings,
  type Family,
  type SavedStudy,
  type Consultation,
} from "@/lib/aip/domain";
import { api, download, normalizePhoto } from "@/lib/aip/client";
import { Portrait, type PortraitHandle } from "./portrait";
import { Clinical, Connect } from "./clinic";
import HeadViewer from "./head-viewer";

type Modal = "upload" | "save" | "library" | "consultation" | "privacy" | null;
export default function Studio({ embedded = false }: { embedded?: boolean }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const current = useRef(settings);
  current.current = settings;
  const [family, setFamily] = useState<Family>("feminine");
  const [view, setView] = useState("discover");
  const [split, setSplit] = useState(50);
  const [overlay, setOverlay] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [ready, setReady] = useState(false);
  const [adultConsent, setAdultConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [title, setTitle] = useState("My appearance study");
  const [formError, setFormError] = useState("");
  const [studies, setStudies] = useState<SavedStudy[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dataError, setDataError] = useState("");
  const [activeStudy, setActiveStudy] = useState<string | null>(null);
  const [contact, setContact] = useState({
    name: "",
    email: "",
    goal: "",
    contactConsent: false,
    followup: false,
  });
  const [linkStudy, setLinkStudy] = useState("none");
  const [clinicName, setClinicName] = useState("Your clinic");
  const portrait = useRef<PortraitHandle>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const restoreAlignment = useRef<Settings["alignment"] | null>(null);
  const selected = ARCHETYPES.find((a) => a.id === settings.archetype)!;
  const src =
    settings.sample === "upload" && photo
      ? photo
      : `/images/${settings.sample === "man" ? "man" : "woman"}-portrait.png`;
  const update = (patch: Partial<Settings>) => {
    setSettings((s) => ({
      ...s,
      ...patch,
      ...(patch.sample ? { viewer: "photo" as const } : {}),
    }));
    setActiveStudy(null);
  };
  const refresh = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        api<{ studies: SavedStudy[] }>("/api/studies"),
        api<{ consultations: Consultation[] }>("/api/consultations"),
      ]);
      setStudies(s.studies);
      setConsultations(c.consultations);
      setDataError("");
    } catch (e) {
      setDataError((e as Error).message);
      throw e;
    }
  }, []);
  useEffect(() => {
    void refresh().catch(() => {});
    const q = new URLSearchParams(window.location.search);
    const v = q.get("view");
    if (!embedded && (v === "clinical" || v === "connect")) setView(v);
    if (embedded) {
      setClinicName((q.get("clinic") || "Your clinic").slice(0, 80));
      const accent = q.get("accent");
      if (["mint", "blue", "rose"].includes(accent || ""))
        document.documentElement.dataset.accent = accent!;
    }
  }, [refresh, embedded]);
  useEffect(
    () => () => {
      if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo);
    },
    [photo],
  );
  useEffect(() => {
    setFormError("");
    if (modal === "save") setPhotoConsent(false);
  }, [modal]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const life = new AbortController();
    const tools = [
      {
        name: "read_appearance_settings",
        description:
          "Read the current illustrative appearance settings. Contains no photo, contact data, diagnosis, dose, or treatment prediction.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => ({ ...current.current }),
      },
      {
        name: "configure_appearance",
        description:
          "Configure the visible appearance exploration only. Does not save a study or recommend treatment.",
        inputSchema: {
          type: "object",
          properties: {
            archetype: { type: "string", enum: ARCHETYPES.map((a) => a.id) },
            intensity: { type: "number", minimum: 0, maximum: 100 },
          },
          required: ["archetype", "intensity"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input: unknown) => {
          if (!input || typeof input !== "object")
            throw new Error("Expected appearance settings.");
          const value = input as { archetype: string; intensity: number };
          if (
            Object.keys(value).some(
              (k) => !["archetype", "intensity"].includes(k),
            )
          )
            throw new Error("Unexpected setting.");
          const a = ARCHETYPES.find((a) => a.id === value.archetype);
          if (!a) throw new Error("Unknown direction.");
          const next = settingsSchema.parse({
            ...current.current,
            archetype: a.id,
            intensity: value.intensity,
            cheek: a.values[0],
            jaw: a.values[1],
            lip: a.values[2],
            brow: a.values[3],
          });
          flushSync(() => {
            setSettings(next);
            setFamily(a.family);
            setView("discover");
            setActiveStudy(null);
          });
          return {
            archetype: next.archetype,
            intensity: next.intensity,
            evidence: "illustrative appearance editing",
          };
        },
      },
    ];
    for (const tool of tools) {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: life.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability. */
      }
    }
    return () => life.abort();
  }, []);
  const switchView = (v: string) => {
    setView(v);
    if (!embedded)
      window.history.replaceState(
        null,
        "",
        v === "discover" ? "/" : `/?view=${v}`,
      );
  };
  const choose = (id: string) => {
    const a = ARCHETYPES.find((a) => a.id === id)!;
    update({
      archetype: id,
      cheek: a.values[0],
      jaw: a.values[1],
      lip: a.values[2],
      brow: a.values[3],
    });
  };
  async function upload(file?: File) {
    if (!file || !adultConsent) return;
    setBusy(true);
    setFormError("");
    try {
      const blob = await normalizePhoto(file);
      setOriginalBlob(blob);
      setPhoto(URL.createObjectURL(blob));
      update({
        sample: "upload",
        alignment: restoreAlignment.current ?? { zoom: 1, x: 0, y: 0 },
      });
      restoreAlignment.current = null;
      setSplit(50);
      setModal(null);
      toast.success(
        "Photo loaded privately. Align your face using the framing controls.",
      );
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function saveStudy() {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      const form = new FormData();
      form.append("data", JSON.stringify({ title, settings }));
      if (photoConsent && settings.sample === "upload") {
        const blob =
          originalBlob ||
          (await fetch(src).then((r) => {
            if (!r.ok) throw new Error("Photo unavailable.");
            return r.blob();
          }));
        if (!blob) throw new Error("Photo unavailable.");
        form.append("photo", blob, "portrait.jpg");
        form.append("photoConsent", "true");
      }
      const result = await api<{ study: SavedStudy }>("/api/studies", {
        method: "POST",
        body: form,
      });
      setStudies((s) => [result.study, ...s]);
      setActiveStudy(result.study.id);
      setModal(null);
      toast.success(
        photoConsent
          ? "Study and photo saved privately."
          : "Study settings saved privately.",
      );
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function openStudy(s: SavedStudy) {
    restoreAlignment.current = null;
    setSettings(s.settings);
    setFamily(ARCHETYPES.find((a) => a.id === s.settings.archetype)!.family);
    setActiveStudy(s.id);
    setTitle(s.title);
    if (s.settings.sample === "upload") {
      setOriginalBlob(null);
      setPhoto(s.hasPhoto ? `/api/studies/${s.id}/photo` : null);
      if (!s.hasPhoto) {
        restoreAlignment.current = s.settings.alignment;
        setModal("upload");
        toast.info(
          "This study contains settings only. Re-upload the original portrait to continue.",
        );
      } else setModal(null);
    } else setModal(null);
    switchView("discover");
  }
  async function removeStudy(id: string) {
    try {
      await api(`/api/studies/${id}`, { method: "DELETE" });
      setStudies((s) => s.filter((s) => s.id !== id));
      setConsultations((c) =>
        c.map((c) => (c.studyId === id ? { ...c, studyId: null } : c)),
      );
      if (activeStudy === id) {
        setActiveStudy(null);
      }
      if (photo === `/api/studies/${id}/photo`) {
        setPhoto(null);
        setOriginalBlob(null);
        setSettings((s) => ({
          ...s,
          sample: "woman",
          alignment: { zoom: 1, x: 0, y: 0 },
        }));
      }
      toast.success("Study and any stored photo permanently deleted.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function saveConsultation() {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      const result = await api<{ consultation: Consultation }>(
        "/api/consultations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...contact,
            studyId: linkStudy === "none" ? null : linkStudy,
          }),
        },
      );
      setConsultations((c) => [result.consultation, ...c]);
      setModal(null);
      setContact({
        name: "",
        email: "",
        goal: "",
        contactConsent: false,
        followup: false,
      });
      toast.success(
        "Private consultation draft saved. No appointment has been booked.",
      );
      if (!embedded) switchView("clinical");
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const newConsultation = () => {
    setLinkStudy(activeStudy || "none");
    setModal("consultation");
  };
  const setRenderReady = useCallback((v: boolean) => setReady(v), []);
  async function exportImage() {
    const blob = await portrait.current?.exportImage();
    if (blob) {
      download(blob, "aip-illustrative-study.jpg");
      toast.success("Illustrative preview downloaded with its evidence label.");
    } else toast.error("Wait for the portrait preview to finish loading.");
  }
  return (
    <Tabs
      value={view}
      onValueChange={switchView}
      className={`aip-shell ${embedded ? "embedded-shell" : ""}`}
    >
      <header className="topbar">
        <a href="/" target={embedded ? "_top" : undefined} className="brand">
          <Aperture />
          <span>
            AIP<span className="brand-dot">.</span>
          </span>
          <small>
            AESTHETICS
            <br />
            INTELLIGENCE PLATFORM
          </small>
        </a>
        {!embedded && (
          <TabsList className="product-nav">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="clinical">Clinical Studio</TabsTrigger>
            <TabsTrigger value="connect">Connect</TabsTrigger>
          </TabsList>
        )}
        <button className="account" onClick={() => setModal("privacy")}>
          <span className="live-dot" />
          {embedded ? clinicName.toUpperCase() : "PRIVATE WORKSPACE"}
          <span className="avatar">
            <UserRound size={14} />
          </span>
        </button>
      </header>
      <main>
        {dataError && (
          <div className="workspace-notice" role="status">
            <ShieldCheck size={16} />
            <span>
              {dataError}{" "}
              <a
                className="text-link"
                href="/signin-with-chatgpt?return_to=%2F"
                target="_top"
              >
                Sign in to your workspace
              </a>{" "}
              ·{" "}
              <button
                className="text-link"
                onClick={() => void refresh().catch(() => {})}
              >
                Retry loading
              </button>
            </span>
          </div>
        )}
        <TabsContent value="discover">
          <section className="workspace-intro">
            <div>
              <p className="eyebrow">
                {embedded ? clinicName.toUpperCase() : "AIP DISCOVER"}{" "}
                <ChevronRight size={12} /> YOUR APPEARANCE STUDIO
              </p>
              <h1>
                Possibilities. <span>Still you.</span>
              </h1>
              <p>Explore a new perspective, before making a decision.</p>
            </div>
            <div className="intro-actions">
              <button
                className="secondary-button library-button"
                onClick={() => setModal("library")}
              >
                <FolderOpen size={16} />
                <span>My studies</span>
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  restoreAlignment.current = null;
                  setModal("upload");
                }}
              >
                <Upload size={16} /> Upload your photo{" "}
                <ArrowUpRight size={17} />
              </button>
            </div>
          </section>
          <div className="studio-grid">
            <aside className="direction-panel panel">
              <div className="panel-heading">
                <span className="section-index">01</span>
                <h2>Choose your direction</h2>
                <Sparkles size={16} />
              </div>
              <p className="muted">
                A feeling to explore. Always on your terms.
              </p>
              <Tabs
                value={family}
                onValueChange={(v) => setFamily(v as Family)}
              >
                <TabsList className="family-tabs">
                  <TabsTrigger value="feminine">
                    Feminine collection
                  </TabsTrigger>
                  <TabsTrigger value="masculine">Masculine</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="archetype-grid">
                {ARCHETYPES.filter((a) => a.family === family).map((a, i) => (
                  <button
                    onClick={() => choose(a.id)}
                    aria-pressed={a.id === settings.archetype}
                    key={a.id}
                    className={`archetype ${a.id === settings.archetype ? "selected" : ""}`}
                  >
                    <span className="shape-icon" aria-hidden="true">
                      {["◌", "◇", "⌒", "∿", "✧"][i % 5]}
                    </span>
                    <span>{a.name}</span>
                    {a.id === settings.archetype && (
                      <Check className="selection-check" size={12} />
                    )}
                  </button>
                ))}
              </div>
              <div className="direction-note">
                <span className="tiny-label">YOUR DIRECTION</span>
                <h3>{selected.name}</h3>
                <p>{selected.description}</p>
              </div>
              <div className="range-label">
                <label>Exploration intensity</label>
                <span>{settings.intensity}%</span>
              </div>
              <Slider
                value={[settings.intensity]}
                onValueChange={(v) => update({ intensity: v[0] })}
                aria-label="Exploration intensity"
              />
              <div className="range-endpoints">
                <span>Subtle</span>
                <span>Expressive</span>
              </div>
              <p className="micro-copy">
                All 20 preferences are open to everyone. Labels do not describe
                your personality or worth.
              </p>
            </aside>
            <section
              className={`visual-panel ${expanded ? "expanded-portrait" : ""}`}
            >
              <div className="viewport-top">
                <span>
                  <span className="live-dot" /> APPEARANCE EXPLORATION
                </span>
                <span className="sample-label">
                  {settings.viewer === "3d"
                    ? "3D REFERENCE"
                    : settings.sample === "upload"
                      ? "YOUR PORTRAIT"
                      : "FICTIONAL SAMPLE"}
                </span>
              </div>
              <Tabs
                value={settings.viewer ?? "photo"}
                onValueChange={(v) => update({ viewer: v as "photo" | "3d" })}
              >
                <TabsList className="viewer-mode">
                  <TabsTrigger value="3d">360° reference head</TabsTrigger>
                  <TabsTrigger value="photo">Photo study</TabsTrigger>
                </TabsList>
              </Tabs>
              <div
                className={`portrait-stage ${settings.viewer === "3d" ? "spatial-stage" : ""}`}
                ref={stage}
              >
                {settings.viewer === "3d" ? (
                  <HeadViewer
                    settings={settings}
                    hair={settings.hair ?? "default"}
                    onHairChange={(hair) => update({ hair })}
                  />
                ) : settings.sample === "upload" && !photo ? (
                  <div className="missing-portrait">
                    <ImagePlus size={40} />
                    <h3>Your original portrait is needed.</h3>
                    <p>
                      This study saved settings only. Re-upload the original
                      image to continue.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => setModal("upload")}
                    >
                      Choose the original photo
                    </button>
                  </div>
                ) : (
                  <Portrait
                    ref={portrait}
                    src={src}
                    settings={settings}
                    split={split}
                    overlay={overlay}
                    onStatus={setRenderReady}
                  />
                )}
              </div>
              {settings.viewer !== "3d" && (
                <div className="comparison-control">
                  <Slider
                    min={0}
                    max={100}
                    value={[split]}
                    onValueChange={(v) => setSplit(v[0])}
                    aria-label="Before and after comparison position"
                  />
                  <div className="range-endpoints">
                    <span>Drag to compare</span>
                    <span>
                      {split === 0
                        ? "Full preview"
                        : split === 100
                          ? "Original only"
                          : "Original ↔ Preview"}
                    </span>
                  </div>
                </div>
              )}
              <div className="viewport-bottom">
                <button
                  className="privacy-link"
                  onClick={() => setModal("privacy")}
                >
                  <ShieldCheck size={14} /> Private by design
                </button>
                <div>
                  <button
                    className={`icon-button ${overlay ? "active" : ""}`}
                    hidden={settings.viewer === "3d"}
                    aria-label="Toggle illustrative facial overlay"
                    aria-pressed={overlay}
                    onClick={() => setOverlay((v) => !v)}
                  >
                    <Layers3 size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={
                      expanded ? "Close expanded portrait" : "Expand portrait"
                    }
                    aria-pressed={expanded}
                    onClick={() => setExpanded((v) => !v)}
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Download illustrative comparison"
                    hidden={settings.viewer === "3d"}
                    disabled={
                      !ready || (settings.sample === "upload" && !photo)
                    }
                    onClick={exportImage}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </section>
            <aside className="insights-column">
              <div className="panel insight-panel">
                <div className="panel-heading">
                  <span className="section-index">02</span>
                  <h2>Refine your vision</h2>
                  <SlidersHorizontal size={16} />
                </div>
                <p className="muted">Small shifts. Considered possibilities.</p>
                {(
                  [
                    ["cheek", "Cheek contour", "Soft definition"],
                    ["jaw", "Jawline", "Contour emphasis"],
                    ["lip", "Lip fullness", "Subtle emphasis"],
                    ["brow", "Brow expression", "Open & relaxed"],
                  ] as const
                ).map(([key, label, sub]) => (
                  <div className="feature-control" key={key}>
                    <div className="range-label">
                      <label>{label}</label>
                      <span>{settings[key]}%</span>
                    </div>
                    <Slider
                      value={[settings[key]]}
                      onValueChange={(v) => update({ [key]: v[0] })}
                      aria-label={label}
                    />
                    <small>{sub}</small>
                  </div>
                ))}
                <div className="evidence-note">
                  <ShieldCheck size={17} />
                  <p>
                    <strong>An exploration, not a prediction.</strong>
                    <br />
                    These are image-editing controls, not Botox units or filler
                    volumes. A clinician assesses what is appropriate.
                  </p>
                </div>
              </div>
              <div className="consultation-card">
                <span className="tiny-label">YOUR NEXT CHAPTER</span>
                <h2>
                  From possibility
                  <br />
                  to a conversation.
                </h2>
                <p>Prepare your preferences for a practitioner consultation.</p>
                <button className="primary-button" onClick={newConsultation}>
                  Prepare a consultation <ArrowUpRight size={17} />
                </button>
                <span className="micro-copy">
                  Private draft · live bookings coming later
                </span>
              </div>
            </aside>
          </div>
          <div className="study-toolbar">
            <div className="sample-picker">
              <span className="tiny-label">PORTRAIT</span>
              <button
                className={settings.sample === "woman" ? "active" : ""}
                onClick={() => {
                  update({
                    sample: "woman",
                    alignment: { zoom: 1, x: 0, y: 0 },
                  });
                }}
              >
                <img src="/images/woman-portrait.png" alt="" />
                Sample 01
              </button>
              <button
                className={settings.sample === "man" ? "active" : ""}
                onClick={() => {
                  update({ sample: "man", alignment: { zoom: 1, x: 0, y: 0 } });
                }}
              >
                <img src="/images/man-portrait.png" alt="" />
                Sample 02
              </button>
              {photo && (
                <button
                  className={settings.sample === "upload" ? "active" : ""}
                  onClick={() => update({ sample: "upload" })}
                >
                  <UserRound size={14} />
                  Your photo
                </button>
              )}
            </div>
            <div className="study-actions">
              <button
                className="text-link"
                onClick={() => {
                  setSettings((s) => ({
                    ...DEFAULT_SETTINGS,
                    sample: s.sample,
                    viewer: s.viewer ?? "photo",
                    alignment: s.alignment,
                  }));
                  setFamily("feminine");
                  setSplit(50);
                  setActiveStudy(null);
                }}
              >
                <RotateCcw size={14} />
                Reset study
              </button>
              <button
                className="secondary-button"
                onClick={() => setModal("save")}
              >
                <Save size={14} />
                Save study
              </button>
            </div>
          </div>
          {settings.sample === "upload" && (
            <section className="panel alignment-panel">
              <div>
                <h3>Frame your portrait</h3>
                <p className="muted">
                  Use a front-facing, neutral photo. Align the eyes to the upper
                  dotted markers. The overlay is a fixed editing guide, not
                  detected anatomy.
                </p>
              </div>
              {(
                [
                  ["zoom", "Zoom", 1, 2, 0.01],
                  ["x", "Horizontal", -0.3, 0.3, 0.005],
                  ["y", "Vertical", -0.3, 0.3, 0.005],
                ] as const
              ).map(([key, label, min, max, step]) => (
                <label key={key}>
                  {label}
                  <Slider
                    min={min}
                    max={max}
                    step={step}
                    value={[settings.alignment[key]]}
                    onValueChange={(v) =>
                      update({
                        alignment: { ...settings.alignment, [key]: v[0] },
                      })
                    }
                    aria-label={`Photo ${label.toLowerCase()}`}
                  />
                </label>
              ))}
            </section>
          )}
          <section className="timeline-panel panel">
            <div>
              <p className="eyebrow">03 / THE BIGGER PICTURE</p>
              <h2>See beyond the first impression.</h2>
              <p className="muted">
                Explore an illustrative effect returning toward your baseline.
              </p>
            </div>
            <div className="timeline-track">
              <div className="timeline-points">
                {[
                  "Baseline",
                  "Emerging",
                  "Full expression",
                  "Softening",
                  "Return",
                ].map((x, i) => (
                  <button
                    key={x}
                    onClick={() => update({ phase: i * 25 })}
                    className={
                      Math.round(settings.phase / 25) === i ? "active" : ""
                    }
                  >
                    {x}
                  </button>
                ))}
              </div>
              <Slider
                value={[settings.phase]}
                onValueChange={(v) => update({ phase: v[0] })}
                aria-label="Illustrative effect progression"
              />
              <p className="micro-copy">
                Conceptual progression · no treatment duration or outcome is
                predicted
              </p>
            </div>
          </section>
        </TabsContent>
        {!embedded && (
          <TabsContent value="clinical">
            <Clinical
              settings={settings}
              src={settings.sample === "upload" && !photo ? "" : src}
              studies={studies}
              consultations={consultations}
              onRefresh={refresh}
              onOpenStudy={openStudy}
              onNewConsultation={newConsultation}
            />
          </TabsContent>
        )}
        {!embedded && (
          <TabsContent value="connect">
            <Connect
              studies={studies}
              consultations={consultations}
              onRefresh={refresh}
              onOpenStudy={openStudy}
            />
          </TabsContent>
        )}
        <footer>
          <span className="footer-brand">
            AIP <span>/</span> Aesthetics Intelligence Platform
          </span>
          <div className="footer-links">
            <button onClick={() => setModal("privacy")}>
              Privacy & control
            </button>
            <a href="/development" target={embedded ? "_top" : undefined}>
              Development roadmap
            </a>
            <span className="live-dot" />
          </div>
        </footer>
      </main>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setModal(null);
        }}
      >
        <DialogContent
          className={`aip-dialog ${modal === "library" ? "library-dialog" : ""}`}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {modal === "upload"
                ? "Start with your own perspective."
                : modal === "save"
                  ? "Keep this possibility."
                  : modal === "library"
                    ? "Your appearance studies."
                    : modal === "consultation"
                      ? "Prepare a thoughtful conversation."
                      : "Your face. Your control."}
            </DialogTitle>
            <DialogDescription>
              {modal === "upload"
                ? "Use one clear, front-facing photo with a relaxed expression and even lighting."
                : modal === "save"
                  ? "Your study is saved to your private AIP workspace."
                  : modal === "library"
                    ? "Open a saved direction, or permanently delete a study and its stored photo."
                    : modal === "consultation"
                      ? "Save a private consultation draft. No practitioner is contacted and no appointment is booked in this preview."
                      : "Exploration starts privately. You choose what to save."}
            </DialogDescription>
          </DialogHeader>
          {modal === "upload" && (
            <>
              <div className="upload-spec">
                <ImagePlus size={35} />
                <span>One face. Natural light. No filters.</span>
                <p>JPG, PNG, or WebP · up to 12 MB</p>
              </div>
              <label className="consent-row">
                <Checkbox
                  checked={adultConsent}
                  onCheckedChange={(v) => setAdultConsent(v === true)}
                />
                <span>
                  I am 18 or older and have permission to use this adult’s
                  photo.
                </span>
              </label>
              <input
                type="file"
                ref={fileInput}
                className="sr-only"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose portrait photo"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
              <button
                className="primary-button"
                disabled={!adultConsent || busy}
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={16} />
                {busy ? "Preparing your photo…" : "Choose a photo"}
              </button>
              <p className="micro-copy">
                Your photo is processed in this browser. It is uploaded to
                private storage only if you explicitly choose to save the photo.
                Use the original sample portraits to explore without uploading.
              </p>
            </>
          )}
          {modal === "save" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveStudy();
              }}
              className="modal-form"
            >
              <label className="form-field">
                Study name
                <input
                  value={title}
                  maxLength={80}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </label>
              <div className="save-summary">
                <Sparkles size={18} />
                <div>
                  <strong>{selected.name}</strong>
                  <p>
                    {settings.intensity}% exploration intensity · illustrative
                    {settings.viewer === "3d"
                      ? "3D reference scan"
                      : "appearance"}
                  </p>
                </div>
              </div>
              {settings.sample === "upload" && (
                <label className="consent-row">
                  <Checkbox
                    checked={photoConsent}
                    disabled={!photo}
                    onCheckedChange={(v) => setPhotoConsent(v === true)}
                  />
                  <span>
                    Also upload and store my original portrait privately with
                    this study. I can delete it from My studies.
                  </span>
                </label>
              )}
              <p className="micro-copy">
                {settings.sample === "upload" && !photoConsent
                  ? "Settings only: you will need to re-upload the same portrait when reopening this study."
                  : "This does not share your study with any clinic or authorize use for AI training."}
              </p>
              <button className="primary-button" disabled={busy}>
                {busy ? "Saving…" : "Save privately"}
                <Save size={16} />
              </button>
            </form>
          )}
          {modal === "library" && (
            <div className="study-library">
              {dataError && (
                <div className="form-error">
                  <p>{dataError}</p>
                  <button
                    className="text-link"
                    onClick={() => void refresh().catch(() => {})}
                  >
                    Try loading again
                  </button>
                </div>
              )}
              {studies.length === 0 && !dataError && (
                <div className="empty-records">
                  <FolderOpen size={30} />
                  <h3>A space for your possibilities.</h3>
                  <p>Save your first study from the appearance workspace.</p>
                </div>
              )}
              {studies.map((s) => (
                <div className="saved-study" key={s.id}>
                  {s.settings.viewer === "3d" ? (
                    <span className="saved-spatial-icon">
                      <Rotate3D size={30} aria-label="3D reference study" />
                    </span>
                  ) : (
                    <img
                      src={
                        s.hasPhoto
                          ? `/api/studies/${s.id}/photo`
                          : `/images/${s.settings.sample === "man" ? "man" : "woman"}-portrait.png`
                      }
                      alt={
                        s.hasPhoto
                          ? "Saved private portrait"
                          : "Sample portrait"
                      }
                    />
                  )}
                  <div>
                    <h3>{s.title}</h3>
                    <p>
                      {
                        ARCHETYPES.find((a) => a.id === s.settings.archetype)
                          ?.name
                      }{" "}
                      · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                    <span className="micro-copy">
                      {s.settings.viewer === "3d"
                        ? "3D reference scan · separate from your photo"
                        : s.hasPhoto
                          ? "Private photo included"
                          : s.settings.sample === "upload"
                            ? "Settings only · re-upload required"
                            : "Fictional sample portrait"}
                    </span>
                    <details className="delete-disclosure">
                      <summary>Delete study</summary>
                      <p>Permanently delete this study and its stored photo?</p>
                      <button
                        className="danger-button"
                        onClick={() => void removeStudy(s.id)}
                      >
                        <Trash2 size={13} /> Permanently delete
                      </button>
                    </details>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`Open ${s.title}`}
                    onClick={() => openStudy(s)}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {modal === "consultation" && (
            <form
              className="modal-form"
              onSubmit={(e) => {
                e.preventDefault();
                void saveConsultation();
              }}
            >
              <div className="form-columns">
                <label className="form-field">
                  Your name
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    value={contact.name}
                    onChange={(e) =>
                      setContact({ ...contact, name: e.target.value })
                    }
                  />
                </label>
                <label className="form-field">
                  Email
                  <input
                    required
                    type="email"
                    maxLength={200}
                    autoComplete="email"
                    value={contact.email}
                    onChange={(e) =>
                      setContact({ ...contact, email: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="form-field">
                Link a saved study
                <Select value={linkStudy} onValueChange={setLinkStudy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked study</SelectItem>
                    {studies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="form-field">
                What would you like to discuss?
                <textarea
                  required
                  minLength={3}
                  maxLength={1500}
                  rows={3}
                  value={contact.goal}
                  onChange={(e) =>
                    setContact({ ...contact, goal: e.target.value })
                  }
                  placeholder="My goals, questions, and things I would like to preserve…"
                />
              </label>
              <label className="consent-row">
                <Checkbox
                  checked={contact.contactConsent}
                  onCheckedChange={(v) =>
                    setContact({ ...contact, contactConsent: v === true })
                  }
                />
                <span>
                  I agree to store these contact details and goals in my private
                  consultation workspace.
                </span>
              </label>
              <label className="consent-row">
                <Checkbox
                  checked={contact.followup}
                  onCheckedChange={(v) =>
                    setContact({ ...contact, followup: v === true })
                  }
                />
                <span>
                  Record my preference for practitioner follow-up when that
                  service becomes available. No contact is authorized or sent
                  now.
                </span>
              </label>
              <button
                className="primary-button"
                disabled={!contact.contactConsent || busy}
              >
                {busy ? "Saving…" : "Save consultation draft"}
                <ArrowUpRight size={16} />
              </button>
            </form>
          )}
          {modal === "privacy" && (
            <div className="privacy-details">
              <div>
                <ShieldCheck size={20} />
                <h3>Explore without uploading to a server.</h3>
                <p>
                  Your chosen photo is used in browser memory. Closing or
                  reloading discards an unsaved photo.
                </p>
              </div>
              <div>
                <FolderOpen size={20} />
                <h3>Choose what your workspace remembers.</h3>
                <p>
                  Save settings alone, or opt in to private photo storage.
                  Stored studies and drafts are tied to your signed-in account.
                  Delete them from My studies or consultation review.
                </p>
              </div>
              <div>
                <UserRound size={20} />
                <h3>No automatic clinic sharing.</h3>
                <p>
                  This private prototype does not send messages, confirm
                  appointments, or transmit photos to an embedded website’s
                  parent page. It does not use your photos for model training.
                </p>
              </div>
              <div>
                <Sparkles size={20} />
                <h3>A visual conversation starter.</h3>
                <p>
                  These previews are general image edits. The fixed face overlay
                  is a framing guide, not a measurement, anatomical scan,
                  diagnosis, or injection map.
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={() => {
                  setPhoto(null);
                  setOriginalBlob(null);
                  setSettings({ ...DEFAULT_SETTINGS });
                  setActiveStudy(null);
                  setFamily("feminine");
                  setModal(null);
                  toast.success(
                    "Current portrait cleared from this session. Saved studies remain in your library.",
                  );
                }}
              >
                Clear my current session photo
              </button>
            </div>
          )}
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Toaster position="bottom-right" theme="dark" richColors />
    </Tabs>
  );
}
