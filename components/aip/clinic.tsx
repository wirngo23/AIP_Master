"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ClipboardCheck,
  Code2,
  Copy,
  Download,
  FileText,
  Globe,
  Layers3,
  MessageSquare,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ARCHETYPES,
  type Consultation,
  type SavedStudy,
  type Settings,
} from "@/lib/aip/domain";
import { api, download } from "@/lib/aip/client";
import ClinicalSpatial from "./clinical-spatial";
import { ClinicLinks } from './clinic-booking';
import type { ClinicConfig } from '@/lib/aip/clinic-config';
import OutcomeComparison from './outcome-comparison';
import DosageDetails from "./dosage-details";
import WorkspaceExplorer from "./workspace-explorer";
import { appearanceIntent, MODE_LABELS } from "@/lib/aip/regions";

export function Clinical({
  settings,
  onChange,
  src,
  studies,
  consultations,
  onRefresh,
  onOpenStudy,
  onNewConsultation,
}: {
  settings: Settings;
  onChange: (s: Partial<Settings>) => void;
  src: string;
  studies: SavedStudy[];
  consultations: Consultation[];
  onRefresh: () => Promise<void>;
  onOpenStudy: (s: SavedStudy) => void;
  onNewConsultation: () => void;
}) {
  const [pathway, setPathway] = useState("neuromodulators");
  const [checks, setChecks] = useState<string[]>([]);
  const active = appearanceIntent(settings);
  return (
    <>
      <section className="workspace-intro">
        <div>
          <p className="eyebrow">
            AIP CLINICAL STUDIO / CONSULTATION WORKSPACE
          </p>
          <h1>
            Clarity in <span>every conversation.</span>
          </h1>
          <p>A shared visual language for considered aesthetic decisions.</p>
        </div>
        <button className="primary-button" onClick={onNewConsultation}>
          <FileText size={16} /> New consultation <ArrowUpRight size={16} />
        </button>
      </section>
      <div className="workspace-notice">
        <ShieldCheck size={16} />
        <span>
          <strong>Research preview.</strong> This workspace records preferences.
          Patient-specific predictions, muscle targeting, and dosing require a
          validated clinical system.
        </span>
      </div>
      <ClinicalSpatial settings={settings} src={src} onChange={onChange} />
      <DosageDetails />
      <OutcomeComparison src={src} uploaded={settings.sample==='upload'&&!src.startsWith('/images/')}/>
      <div className="clinical-grid">
        <aside className="panel clinical-checklist">
          <p className="eyebrow">CONSULTATION PREPARATION</p>
          <h2>Start with the person.</h2>
          <p className="muted">
            A conversation checklist. Completion does not establish clinical
            eligibility.
          </p>
          {[
            "Understand the person’s goals",
            "Discuss uncertainty and alternatives",
            "Review the no-treatment option",
            "Arrange an in-person assessment",
          ].map((item, i) => (
            <label className="checklist-item" key={item}>
              <Checkbox
                checked={checks.includes(item)}
                onCheckedChange={(v) =>
                  setChecks((c) =>
                    v ? [...c, item] : c.filter((x) => x !== item),
                  )
                }
              />
              <span>
                <small>0{i + 1}</small>
                {item}
              </span>
            </label>
          ))}
          <p className="micro-copy">
            This checklist is temporary. Document clinical assessment in the
            appropriate clinical record.
          </p>
        </aside>
        <div className="panel clinical-study-summary">
          <div>
            <span className="tiny-label">CURRENT APPEARANCE DIRECTION</span>
            <h2>{active?.name??MODE_LABELS[settings.editMode??"full"]+" / custom mix"}</h2>
            <p>
              Photo-study source ·{" "}
              {settings.sample === "upload"
                ? "Your portrait"
                : "Fictional sample portrait"}
            </p>
            <p className="muted">
              The rotatable model above is a separate reference scan. It is not
              reconstructed from this person's photo.
            </p>
            {src && (
              <details>
                <summary>View the original photo</summary>
                <img
                  src={src}
                  alt="Original photo study, separate from the 3D reference scan"
                />
              </details>
            )}
          </div>
        </div>
        <section className="panel pathway-panel">
          <p className="eyebrow">TREATMENT CONTEXT</p>
          <h2>Understand the mechanism.</h2>
          <Tabs value={pathway} onValueChange={setPathway}>
            <TabsList className="family-tabs">
              <TabsTrigger value="neuromodulators">Neuromodulators</TabsTrigger>
              <TabsTrigger value="fillers">Dermal fillers</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mechanism-orbit">
            <Layers3 size={38} />
            <span>
              {pathway === "neuromodulators"
                ? "MUSCLE ACTIVITY"
                : "SOFT-TISSUE VOLUME"}
            </span>
          </div>
          <h3>
            {pathway === "neuromodulators"
              ? "Movement changes expression."
              : "Volume changes contour."}
          </h3>
          <p className="muted">
            {pathway === "neuromodulators"
              ? "Toxin treatments act on muscle activity. A surface photograph cannot establish a person’s muscle function or a safe treatment plan."
              : "Fillers interact with soft tissue. A photograph cannot establish the vascular anatomy, tissue plane, or product response required for planning."}
          </p>
          <div className="evidence-note">
            <ShieldCheck size={16} />
            <p>
              <strong>Clinical model: not activated</strong>
              <br />
              No dose, injection site, depth, or expected duration is calculated
              in this version.
            </p>
          </div>
          <a className="text-link" href="/development">
            View clinical development gates <ArrowUpRight size={14} />
          </a>
        </section>
      </div>
      <section className="record-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">YOUR PRIVATE WORKSPACE</p>
            <h2>Consultation drafts</h2>
          </div>
          <span className="status-pill">{consultations.length} records</span>
        </div>
        <LeadTable
          consultations={consultations}
          studies={studies}
          onRefresh={onRefresh}
          onOpenStudy={onOpenStudy}
        />
      </section>
    </>
  );
}

export function LeadTable({
  consultations,
  studies,
  onRefresh,
  onOpenStudy,
}: {
  consultations: Consultation[];
  studies: SavedStudy[];
  onRefresh: () => Promise<void>;
  onOpenStudy: (s: SavedStudy) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Consultation["status"]>("draft");
  const [busy, setBusy] = useState(false);
  const filtered = consultations.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      `${c.name} ${c.email} ${c.goal}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const open = (c: Consultation) => {
    setSelected(c);
    setNote(c.note);
    setStatus(c.status);
  };
  async function save() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await api(`/api/consultations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      await onRefresh();
      toast.success("Consultation review saved.");
      setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await api(`/api/consultations/${selected.id}`, { method: "DELETE" });
      await onRefresh();
      setSelected(null);
      toast.success("Draft permanently deleted.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="panel records-panel">
      <div className="records-toolbar">
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Search consultation drafts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your consultation drafts"
          />
        </label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger
            className="filter-select"
            aria-label="Filter consultations"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {consultations.length === 0 ? (
        <div className="empty-records">
          <MessageSquare size={30} />
          <h3>The next conversation starts here.</h3>
          <p>
            Save a consultation draft in Discover. It will appear here for
            private review.
          </p>
          <span className="micro-copy">
            No fabricated leads. No messages sent automatically.
          </span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Study</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Follow-up preference</TableHead>
              <TableHead>
                <span className="sr-only">Review</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <strong>{c.name}</strong>
                  <small>{c.email}</small>
                </TableCell>
                <TableCell>
                  {studies.find((s) => s.id === c.studyId)?.title ||
                    "No linked study"}
                </TableCell>
                <TableCell>
                  <span className={`status-pill ${c.status}`}>{c.status}</span>
                </TableCell>
                <TableCell>
                  {c.followup
                    ? "Opted in for future activation"
                    : "No follow-up"}
                </TableCell>
                <TableCell>
                  <button className="text-link" onClick={() => open(c)}>
                    Review <ArrowUpRight size={14} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No drafts match your search.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <Sheet
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <SheetContent className="review-sheet">
          <SheetHeader>
            <SheetTitle>Consultation review</SheetTitle>
            <SheetDescription>
              Private preparation record. No appointment is booked and no
              message is sent.
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="sheet-body">
              <span className="eyebrow">
                {new Date(selected.createdAt).toLocaleDateString()}
              </span>
              <h2>{selected.name}</h2>
              <p className="muted">{selected.email}</p>
              <div className="review-goal">
                <span className="tiny-label">PERSON’S GOAL</span>
                <p>{selected.goal}</p>
              </div>
              {selected.studyId &&
                studies.some((s) => s.id === selected.studyId) && (
                  <button
                    className="secondary-button"
                    onClick={() => {
                      onOpenStudy(
                        studies.find((s) => s.id === selected.studyId)!,
                      );
                      setSelected(null);
                    }}
                  >
                    Open linked appearance study <ArrowUpRight size={15} />
                  </button>
                )}
              <label className="form-field">
                Review status
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as Consultation["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="form-field">
                Consultation notes
                <textarea
                  maxLength={4000}
                  rows={6}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record preferences, questions, and the agreed next step."
                />
              </label>
              <button className="primary-button" onClick={save} disabled={busy}>
                <Check size={16} /> {busy ? "Saving…" : "Save review"}
              </button>
              <button
                className="secondary-button"
                onClick={() =>
                  download(
                    new Blob(
                      [JSON.stringify({ ...selected, note, status }, null, 2)],
                      { type: "application/json" },
                    ),
                    "aip-consultation.json",
                  )
                }
              >
                <Download size={16} /> Export private record
              </button>
              <details className="delete-disclosure">
                <summary>Delete this consultation draft</summary>
                <p>This permanently removes the contact details and notes.</p>
                <button
                  className="danger-button"
                  onClick={remove}
                  disabled={busy}
                >
                  <Trash2 size={14} /> Permanently delete
                </button>
              </details>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Connect({
  settings,
  src,
  onChange,
  consultations,
  studies,
  onRefresh,
  onOpenStudy,
}: {
  settings: Settings;
  src: string;
  onChange: (s: Partial<Settings>) => void;
  consultations: Consultation[];
  studies: SavedStudy[];
  onRefresh: () => Promise<void>;
  onOpenStudy: (s: SavedStudy) => void;
}) {
  const [clinic, setClinic] = useState<ClinicConfig>({
    name: "Your clinic",
    domain: "https://yourclinic.example",
    accent: "mint",bookingUrl:"",registryUrl:"",location:"",
  });
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    api<{ clinic: typeof clinic | null }>("/api/clinic")
      .then((d) => {
        if (d.clinic) setClinic({...d.clinic,bookingUrl:d.clinic.bookingUrl??"",registryUrl:d.clinic.registryUrl??"",location:d.clinic.location??""});
      })
      .catch(() => {});
  }, []);
  const embedUrl = `${origin}/embed?clinic=${encodeURIComponent(clinic.name)}&accent=${clinic.accent}`;
  const code = `<iframe src="${embedUrl.replaceAll("&", "&amp;")}" title="Explore your appearance with AIP" width="100%" height="920" style="border:0;border-radius:16px" loading="lazy" allow="fullscreen"></iframe>`;
  async function save() {
    setBusy(true);
    try {
      await api("/api/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinic),
      });
      toast.success("Clinic configuration saved.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="workspace-intro">
        <div>
          <p className="eyebrow">AIP CONNECT / PRACTICE GROWTH</p>
          <h1>
            A first impression.
            <br />
            <span>A meaningful conversation.</span>
          </h1>
          <p>
            Bring guided appearance exploration to your clinic’s digital front
            door.
          </p>
        </div>
        <div className="connect-mark">
          <Globe size={72} />
        </div>
      </section>
      <div className="workspace-notice">
        <ShieldCheck size={16} />
        <span>
          <strong>Private integration preview.</strong> The embed currently
          requires access to this private AIP site. Public onboarding, verified
          practitioners, live bookings, and referral payments are launch
          integrations.
        </span>
      </div>
      <div className="connect-grid">
        <section className="panel embed-config">
          <p className="eyebrow">01 / MAKE IT YOURS</p>
          <h2>Your brand. AIP intelligence.</h2>
          <label className="form-field">
            Clinic name
            <input
              maxLength={80}
              value={clinic.name}
              onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
            />
          </label>
          <label className="form-field">
            Clinic website origin
            <input
              type="url"
              value={clinic.domain}
              onChange={(e) => setClinic({ ...clinic, domain: e.target.value })}
              placeholder="https://yourclinic.com"
            />
          </label>
          <p className="micro-copy">
            Saved for integration planning. Domain verification is required
            before public activation.
          </p>
          <label className="form-field">Country / state<input maxLength={120} value={clinic.location} onChange={e=>setClinic({...clinic,location:e.target.value})}/></label>
          <label className="form-field">Existing booking page<input type="url" maxLength={500} value={clinic.bookingUrl} onChange={e=>setClinic({...clinic,bookingUrl:e.target.value})} placeholder="https://yourclinic.com/book"/></label>
          <label className="form-field">Professional register link<input type="url" maxLength={500} value={clinic.registryUrl} onChange={e=>setClinic({...clinic,registryUrl:e.target.value})} placeholder="https://official-register.example/practitioner"/></label>
          <p className="micro-copy">These are clinic-supplied links. Adding a register link does not verify credentials. The booking service handles appointment confirmation.</p>
          <label className="form-field">
            Accent
            <Select
              value={clinic.accent}
              onValueChange={(accent) => {if(accent==='mint'||accent==='blue'||accent==='rose')setClinic({ ...clinic, accent });}}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mint">Signature mint</SelectItem>
                <SelectItem value="blue">Glacier blue</SelectItem>
                <SelectItem value="rose">Dusty rose</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <button className="primary-button" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save configuration"}
            <Check size={16} />
          </button>
        </section>
        <section className={`panel embed-showcase accent-${clinic.accent}`}>
          <div className="browser-mock-bar">
            <span>•••</span>
            <span>{clinic.domain.replace("https://", "")}</span>
            <ShieldCheck size={12} />
          </div>
          <div className="embed-mock">
            <span className="tiny-label">{clinic.name.toUpperCase()}</span>
            <h2>
              Your possibilities.
              <br />
              <span>Beautifully considered.</span>
            </h2>
            <p>
              Explore an appearance direction and prepare for a personal
              consultation.
            </p>
            <WorkspaceExplorer
              settings={settings}
              src={src}
              onChange={onChange}
              compact
            />
            <button
              className="primary-button"
              onClick={() => setPreview((v) => !v)}
            >
              {preview ? "Close live embed" : "Test the live embed"}
              <ArrowUpRight size={16} />
            </button>
            <ClinicLinks clinic={clinic}/>
            <span className="powered-by">
              POWERED BY AIP · ILLUSTRATIVE PREVIEW
            </span>
          </div>
        </section>
      </div>
      {preview && (
        <div className="live-embed">
          <iframe
            src={embedUrl}
            title="Live AIP clinic embed preview"
            width="100%"
            height="980"
          />
        </div>
      )}
      <section className="panel code-panel">
        <div>
          <Code2 size={24} />
          <h3>Ready for your website.</h3>
          <p className="muted">
            Preview the embedded experience now. Activate public access after
            the launch gates are met.
          </p>
        </div>
        <code>{code}</code>
        <button
          className="secondary-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              toast.success("Embed code copied.");
            } catch {
              download(
                new Blob([code], { type: "text/html" }),
                "aip-embed.html",
              );
              toast.info("Embed code downloaded.");
            }
          }}
        >
          <Copy size={15} /> Copy embed code
        </button>
      </section>
      <div className="connect-metrics">
        <div>
          <Users size={20} />
          <span>{consultations.length}</span>
          <p>Private consultation drafts</p>
        </div>
        <div>
          <ClipboardCheck size={20} />
          <span>
            {consultations.filter((c) => c.status === "reviewed").length}
          </span>
          <p>Reviews completed</p>
        </div>
        <div>
          <ArrowRight size={20} />
          <span>Pre-launch</span>
          <p>Bookings & referral revenue</p>
        </div>
      </div>
      <div className="section-title">
        <div>
          <p className="eyebrow">02 / CONTINUE THE CONVERSATION</p>
          <h2>Your consultation pipeline</h2>
        </div>
      </div>
      <LeadTable
        consultations={consultations}
        studies={studies}
        onRefresh={onRefresh}
        onOpenStudy={onOpenStudy}
      />
    </>
  );
}
