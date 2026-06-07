import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Search, Upload, FileText, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/building-dept-logins/submit")({
  head: () => ({
    meta: [
      { title: "Submit Login — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubmitLoginPage,
});

const MUNICIPALITIES = [
  "Palm Beach County", "Town of Palm Beach", "Town of Manalapan", "Town of Gulf Stream",
  "Town of Ocean Ridge", "Town of Highland Beach", "Town of Jupiter", "Town of Jupiter Island",
  "City of West Palm Beach", "City of Boca Raton", "City of Delray Beach", "City of Boynton Beach",
  "City of Wellington", "Village of Tequesta", "Village of North Palm Beach",
  "Martin County", "City of Stuart", "Town of Sewall's Point",
  "St. Lucie County", "City of Port St. Lucie", "City of Fort Pierce",
  "Indian River County", "City of Vero Beach", "Town of Indian River Shores", "Town of Orchid",
];

const REGISTRATIONS = [
  "Existing County Contractor Registration",
  "New County Contractor Registration",
  "Local Municipal Registration",
  "Reciprocity from Adjacent County",
  "Specialty Trade Registration",
];

type DocSlot = { key: string; label: string; required: boolean; file?: File | null };

const DEFAULT_DOCS: DocSlot[] = [
  { key: "coi", label: "COI — Certificate of Insurance", required: true },
  { key: "wc", label: "WC — Workers Compensation", required: true },
  { key: "occ", label: "Occupational License", required: true },
  { key: "btr", label: "BTR — Business Tax Receipt", required: true },
  { key: "qdl", label: "Qualifier Driver's License", required: true },
];

function SubmitLoginPage() {
  const navigate = useNavigate();
  const [company] = useState("Coastline Builders Group");
  const [muniQuery, setMuniQuery] = useState("");
  const [muni, setMuni] = useState("");
  const [muniOpen, setMuniOpen] = useState(false);
  const [registration, setRegistration] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [ePlan, setEPlan] = useState(false);
  const [derm, setDerm] = useState(false);
  const [docs, setDocs] = useState<DocSlot[]>(DEFAULT_DOCS);
  const [extras, setExtras] = useState<DocSlot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const muniFiltered = useMemo(() => {
    const q = muniQuery.toLowerCase().trim();
    if (!q) return MUNICIPALITIES.slice(0, 12);
    return MUNICIPALITIES.filter((m) => m.toLowerCase().includes(q)).slice(0, 12);
  }, [muniQuery]);

  function setDocFile(key: string, list: DocSlot[], setList: (n: DocSlot[]) => void, file: File | null) {
    setList(list.map((d) => (d.key === key ? { ...d, file } : d)));
  }
  function addExtra() {
    setExtras((e) => [...e, { key: `extra-${e.length}-${Math.random().toString(36).slice(2, 6)}`, label: "Additional document", required: false }]);
  }

  const requiredOk = docs.every((d) => !d.required || !!d.file);
  const canSubmit =
    muni.trim().length > 0 &&
    registration.trim().length > 0 &&
    username.trim().length > 0 &&
    password.trim().length > 0 &&
    requiredOk;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please complete all required fields and upload required documents.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(`Login submitted for ${muni}.`);
      navigate({ to: "/building-dept-logins" });
    }, 800);
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Link
          to="/building-dept-logins"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian"
        >
          <ArrowLeft className="h-3 w-3" /> Back to vault
        </Link>

        <div className="mt-4 border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50">Credentials Vault</div>
          <h1 className="display-serif mt-3 text-4xl text-obsidian">Submit New Login</h1>
          <p className="mt-2 text-sm text-obsidian/60">
            Cleared encrypts credentials at rest. Required documents are scanned for expiration dates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Company / muni / reg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="eyebrow text-obsidian/55">Company Name</Label>
              <Input value={company} readOnly className="mt-2 rounded-[3px] bg-paper-warm/60" />
            </div>
            <div className="relative">
              <Label className="eyebrow text-obsidian/55">Municipality <span className="text-oxblood">*</span></Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-obsidian/40" />
                <input
                  value={muniOpen || !muni ? muniQuery : muni}
                  onFocus={() => { setMuniOpen(true); setMuniQuery(""); }}
                  onChange={(e) => { setMuniQuery(e.target.value); setMuniOpen(true); }}
                  onBlur={() => setTimeout(() => setMuniOpen(false), 120)}
                  placeholder="Search counties or cities…"
                  className="block w-full border border-obsidian/15 bg-white pl-9 pr-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]"
                />
                {muniOpen && muniFiltered.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto border border-obsidian/15 bg-white shadow-lg rounded-[3px]">
                    {muniFiltered.map((m) => (
                      <li key={m}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setMuni(m); setMuniQuery(""); setMuniOpen(false); }}
                          className="block w-full text-left px-3 py-2 text-sm text-obsidian hover:bg-paper-warm"
                        >
                          {m}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label className="eyebrow text-obsidian/55">Registration Type <span className="text-oxblood">*</span></Label>
              <select
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                className="mt-2 block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian focus:border-obsidian/40 focus:outline-none rounded-[3px]"
              >
                <option value="">Select registration type…</option>
                {REGISTRATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <Label className="eyebrow text-obsidian/55">Username <span className="text-oxblood">*</span></Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="portal username or email"
                className="mt-2 rounded-[3px] font-mono"
              />
            </div>
            <div>
              <Label className="eyebrow text-obsidian/55">Password <span className="text-oxblood">*</span></Label>
              <div className="mt-2 flex items-center gap-1 border border-obsidian/15 bg-white rounded-[3px] focus-within:border-obsidian/40">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-obsidian focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="p-2 text-obsidian/45 hover:text-obsidian"
                  aria-label={showPw ? "Hide" : "Show"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <Label className="eyebrow text-obsidian/55">Portal Features</Label>
            <div className="mt-3 flex flex-wrap gap-3">
              <Toggle on={ePlan} onChange={setEPlan} label="ePlan portal access" />
              <Toggle on={derm} onChange={setDerm} label="DERM (Environmental) access" />
            </div>
          </div>

          {/* Required Documents */}
          <div>
            <div className="eyebrow text-obsidian/55 mb-3">Required Documents</div>
            <div className="border border-obsidian/15 bg-white divide-y divide-obsidian/5">
              {docs.map((d) => (
                <DocRow key={d.key} doc={d} onFile={(f) => setDocFile(d.key, docs, setDocs, f)} />
              ))}
            </div>
          </div>

          {/* Additional */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow text-obsidian/55">Additional Documents</div>
              <button
                type="button"
                onClick={addExtra}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky hover:opacity-70"
              >
                + Add document
              </button>
            </div>
            {extras.length === 0 ? (
              <div className="border border-dashed border-obsidian/15 bg-paper-warm/40 px-4 py-6 text-center text-xs text-obsidian/45 rounded-[3px]">
                No additional documents.
              </div>
            ) : (
              <div className="border border-obsidian/15 bg-white divide-y divide-obsidian/5">
                {extras.map((d) => (
                  <DocRow
                    key={d.key}
                    doc={d}
                    editable
                    onLabel={(label) => setExtras((e) => e.map((x) => (x.key === d.key ? { ...x, label } : x)))}
                    onFile={(f) => setDocFile(d.key, extras, setExtras, f)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-obsidian/10">
            <Button asChild variant="outline" className="rounded-[3px]">
              <Link to="/building-dept-logins">Cancel</Link>
            </Button>
            <Button type="submit" variant="dark" disabled={!canSubmit || submitting} className="rounded-[3px]">
              {submitting ? "Submitting…" : "Submit Login"}
            </Button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2 border px-3 py-2 text-sm rounded-[3px] transition-colors"
      style={{
        backgroundColor: on ? "color-mix(in oklab, var(--sky) 10%, transparent)" : "white",
        borderColor: on ? "color-mix(in oklab, var(--sky) 40%, transparent)" : "color-mix(in oklab, var(--obsidian) 15%, transparent)",
        color: on ? "var(--sky)" : "var(--obsidian)",
      }}
    >
      <span
        className="h-4 w-4 grid place-items-center border rounded-[2px]"
        style={{
          borderColor: on ? "var(--sky)" : "color-mix(in oklab, var(--obsidian) 25%, transparent)",
          backgroundColor: on ? "var(--sky)" : "transparent",
        }}
      >
        {on && <Check className="h-3 w-3 text-paper" />}
      </span>
      {label}
    </button>
  );
}

function DocRow({
  doc, editable, onFile, onLabel,
}: {
  doc: DocSlot;
  editable?: boolean;
  onFile: (file: File | null) => void;
  onLabel?: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <FileText className="h-4 w-4 text-obsidian/40 shrink-0" />
      <div className="flex-1 min-w-0">
        {editable && onLabel ? (
          <input
            value={doc.label}
            onChange={(e) => onLabel(e.target.value)}
            className="w-full bg-transparent text-sm text-obsidian border-b border-transparent focus:border-obsidian/30 focus:outline-none"
          />
        ) : (
          <div className="text-sm text-obsidian truncate">
            {doc.label}
            {doc.required && <span className="ml-1.5 text-oxblood">*</span>}
          </div>
        )}
        {doc.file && (
          <div className="mt-0.5 font-mono text-[10px] text-obsidian/50 truncate">
            {doc.file.name} · {(doc.file.size / 1024).toFixed(0)} KB
          </div>
        )}
      </div>
      <label className="cursor-pointer inline-flex items-center gap-1.5 border border-obsidian/20 bg-paper-warm px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:text-obsidian rounded-[3px]">
        <Upload className="h-3 w-3" />
        {doc.file ? "Replace" : "Upload"}
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
