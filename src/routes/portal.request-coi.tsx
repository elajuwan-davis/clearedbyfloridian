import { PlanGate } from "@/components/feature-lock";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileCheck2, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listSubs, type SubRow } from "@/lib/subs-api";
import { useSession } from "@/lib/use-session";
import { createCoiRequest, createSubUpdateRequest } from "@/lib/insurance-requests-api";
import { createInsuranceRequestUploadUrlFn } from "@/lib/insurance-requests.functions";
import { CloudUploadButtons } from "@/components/cloud-upload-buttons";

type Tab = "coi" | "sub";

export const Route = createFileRoute("/portal/request-coi")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => ({
    tab: search.tab === "sub" ? "sub" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Insurance Requests — Cleard" },
      { name: "description", content: "Request a Certificate of Insurance or flag a subcontractor insurance update." },
      { property: "og:title", content: "Insurance Requests — Cleard" },
      { property: "og:description", content: "Request a Certificate of Insurance or flag a subcontractor insurance update." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PlanGate feature="coi_requests">
      <InsuranceRequestsPage />
    </PlanGate>
  ),
});

const inputCls =
  "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]";
const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function Submitted({ copy, onReset }: { copy: string; onReset: () => void }) {
  return (
    <div className="mt-8 border border-obsidian/10 bg-white rounded-[3px] p-10 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" strokeWidth={1.5} />
      <h2 className="display-serif mt-4 text-3xl text-obsidian">Request Received</h2>
      <p className="mt-3 text-sm text-obsidian/65 leading-relaxed">{copy}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]"
      >
        Submit another
      </button>
    </div>
  );
}

function useRealSubs() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void listSubs()
      .then((rows) => {
        if (!cancelled) setSubs(rows);
      })
      .catch(() => {
        if (!cancelled) setSubs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { subs, loading };
}

function InsuranceRequestsPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const active: Tab = tab === "sub" ? "sub" : "coi";

  const TABS: Array<{ key: Tab; label: string; icon: typeof FileCheck2 }> = [
    { key: "coi", label: "Request COI", icon: FileCheck2 },
    { key: "sub", label: "Sub Insurance Update", icon: ShieldAlert },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="border-b border-obsidian/10 pb-8">
        <div className="eyebrow text-obsidian/50 flex items-center gap-2">
          <FileCheck2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Insurance
        </div>
        <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Insurance Requests</h1>
        <p className="mt-3 text-sm text-obsidian/60 max-w-xl">
          Two request types, one place: pull a fresh Certificate of Insurance, or flag a subcontractor whose
          coverage needs updating.
        </p>
      </div>

      <div className="mt-6 flex gap-1 border-b border-obsidian/10" role="tablist">
        {TABS.map((t) => {
          const on = active === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => navigate({ search: { tab: t.key === "sub" ? "sub" : undefined } as never })}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                on
                  ? "border-obsidian text-obsidian"
                  : "border-transparent text-obsidian/50 hover:text-obsidian/80"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {t.label}
            </button>
          );
        })}
      </div>

      {active === "coi" ? <CoiForm /> : <SubInsuranceForm />}
    </div>
  );
}

function CoiForm() {
  const session = useSession();
  const createUpload = useServerFn(createInsuranceRequestUploadUrlFn);
  const { subs, loading: subsLoading } = useRealSubs();
  const [submitted, setSubmitted] = useState(false);
  const [subId, setSubId] = useState<string>("");
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    projectAddress: "",
    holderName: "",
    holderAddress: "",
    additionalInsured: false,
    notes: "",
  });

  const selectedSub = useMemo(
    () => (subId ? subs.find((s) => s.id === subId) ?? null : null),
    [subs, subId],
  );

  function reset() {
    setSubmitted(false);
    setSubId("");
    setCoiFile(null);
    setForm({ projectName: "", projectAddress: "", holderName: "", holderAddress: "", additionalInsured: false, notes: "" });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const tenantId = session.effectiveTenantId;
    if (!tenantId) {
      toast.error("No tenant assigned to this account yet.");
      return;
    }
    if (!subId) {
      toast.error("Select a subcontractor");
      return;
    }
    setSaving(true);
    try {
      const requestId = newId();
      let attachedFilePath: string | null = null;
      let attachedFileName: string | null = null;

      if (coiFile) {
        const signed = await createUpload({
          data: { tenantId, requestId, filename: coiFile.name },
        });
        const put = await fetch(signed.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": coiFile.type || "application/pdf" },
          body: coiFile,
        });
        if (!put.ok) throw new Error(`COI upload failed (${put.status})`);
        attachedFilePath = signed.path;
        attachedFileName = coiFile.name;
      }

      await createCoiRequest({
        id: requestId,
        tenantId,
        subcontractorId: subId,
        projectName: form.projectName.trim(),
        projectAddress: form.projectAddress.trim(),
        holderName: form.holderName.trim(),
        holderAddress: form.holderAddress.trim(),
        additionalInsured: form.additionalInsured,
        notes: form.notes.trim() || undefined,
        attachedFilePath,
        attachedFileName,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <Submitted
        copy="Your COI request has been submitted. Cleard will follow up within 1 business day."
        onReset={reset}
      />
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
      <p className="text-sm text-obsidian/60">
        Select the subcontractor needing an updated certificate. Cleard will coordinate with their carrier and
        deliver the certificate to the holder.
      </p>

      <div>
        <label className={labelCls}>Subcontractor</label>
        {subsLoading ? (
          <div className="text-[12px] text-obsidian/55 border border-dashed border-obsidian/20 rounded-[3px] p-3 inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading subcontractors…
          </div>
        ) : subs.length === 0 ? (
          <div className="text-[12px] text-obsidian/55 border border-dashed border-obsidian/20 rounded-[3px] p-3">
            No saved subcontractors yet. Add subs on a Permit Intake to populate this list.
          </div>
        ) : (
          <select className={inputCls} value={subId} onChange={(e) => setSubId(e.target.value)} required>
            <option value="">Select a subcontractor</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.company_name}{s.trade ? ` — ${s.trade}` : ""}
                {s.insurance_carrier_email ? ` · ${s.insurance_carrier_email}` : ""}
              </option>
            ))}
          </select>
        )}
        {selectedSub && (
          <div className="mt-2 text-[12px] text-obsidian/70 bg-obsidian/5 rounded-[3px] px-3 py-2">
            <div><span className="font-mono uppercase tracking-[0.14em] text-[10px] text-obsidian/55">Carrier Email:</span> {selectedSub.insurance_carrier_email || "—"}</div>
          </div>
        )}
      </div>

      <div
        className="rounded-[3px] p-5 border"
        style={{ backgroundColor: "#E6E6FA", borderColor: "#000000", color: "#000000" }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">Reference</div>
        <div className="mt-1 font-display text-lg">COI Requirements — Cleard</div>
        <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed">
          <li>· General Liability: $1,000,000 per occurrence / $2,000,000 aggregate</li>
          <li>· Workers' Compensation: Statutory limits (Florida)</li>
          <li>· Auto Liability: $1,000,000 combined single limit</li>
          <li>· Certificate Holder: Cleard, 1000 S Pine Island Rd, Suite 155, Plantation, FL 33324</li>
          <li>· Additional Insured endorsement required on GL policy</li>
          <li>· 30-day notice of cancellation required</li>
          <li>· Policy must be active for the full duration of the project</li>
        </ul>
      </div>

      <div>
        <label className={labelCls}>Project Name</label>
        <input required className={inputCls} value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>Project Address</label>
        <input required className={inputCls} value={form.projectAddress} onChange={(e) => setForm({ ...form, projectAddress: e.target.value })} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Certificate Holder Name</label>
          <input required className={inputCls} value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Certificate Holder Address</label>
          <input required className={inputCls} value={form.holderAddress} onChange={(e) => setForm({ ...form, holderAddress: e.target.value })} />
        </div>
      </div>

      <div className="flex items-center justify-between border border-obsidian/10 rounded-[3px] px-4 py-3">
        <div>
          <div className="text-sm font-medium text-obsidian">Additional Insured</div>
          <div className="text-xs text-obsidian/55">Add the certificate holder as an additional insured.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.additionalInsured}
          onClick={() => setForm({ ...form, additionalInsured: !form.additionalInsured })}
          className={`relative h-6 w-11 rounded-full transition-colors ${form.additionalInsured ? "bg-obsidian" : "bg-obsidian/20"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.additionalInsured ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      <div>
        <label className={labelCls}>Attach Current COI (PDF)</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setCoiFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-obsidian file:mr-3 file:rounded-[3px] file:border-0 file:bg-obsidian file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-paper hover:file:bg-obsidian/90"
        />
        {coiFile && <div className="mt-1.5 text-[11px] text-obsidian/60 font-mono">{coiFile.name}</div>}
        <CloudUploadButtons />
        <p className="mt-1.5 text-[11px] text-obsidian/50">
          Optional. Upload a COI example provided by the HOA, GC, or certificate holder if available.
        </p>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={4} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={saving || subsLoading || !session.effectiveTenantId}
          className="inline-flex items-center gap-2 bg-obsidian px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Submit Request
        </button>
      </div>
    </form>
  );
}

function SubInsuranceForm() {
  const session = useSession();
  const { subs, loading: subsLoading } = useRealSubs();
  const [submitted, setSubmitted] = useState(false);
  const [subId, setSubId] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => (subId ? subs.find((s) => s.id === subId) ?? null : null),
    [subs, subId],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const tenantId = session.effectiveTenantId;
    if (!tenantId) {
      toast.error("No tenant assigned to this account yet.");
      return;
    }
    if (!subId) {
      toast.error("Select a subcontractor");
      return;
    }
    if (!details.trim()) {
      toast.error("Describe what needs to be updated");
      return;
    }
    setSaving(true);
    try {
      await createSubUpdateRequest({
        tenantId,
        subcontractorId: subId,
        details: details.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <Submitted
        copy="Your request has been submitted. Cleard will follow up within 1 business day."
        onReset={() => {
          setSubmitted(false);
          setSubId("");
          setDetails("");
        }}
      />
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
      <p className="text-sm text-obsidian/60">
        Flag a subcontractor whose insurance needs to be updated. Cleard will contact their carrier directly.
      </p>

      <div>
        <label className={labelCls}>Subcontractor</label>
        {subsLoading ? (
          <div className="text-[12px] text-obsidian/55 border border-dashed border-obsidian/20 rounded-[3px] p-3 inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading subcontractors…
          </div>
        ) : subs.length === 0 ? (
          <div className="text-[12px] text-obsidian/55 border border-dashed border-obsidian/20 rounded-[3px] p-3">
            No saved subcontractors yet. Add subs on a Permit Intake to populate this list.
          </div>
        ) : (
          <select className={inputCls} value={subId} onChange={(e) => setSubId(e.target.value)} required>
            <option value="">Select a subcontractor</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.company_name}{s.trade ? ` — ${s.trade}` : ""}
              </option>
            ))}
          </select>
        )}
        {selected && (
          <div className="mt-2 text-[12px] text-obsidian/70 bg-obsidian/5 rounded-[3px] px-3 py-2 space-y-0.5">
            <div><span className="font-mono uppercase tracking-[0.14em] text-[10px] text-obsidian/55">Qualifier:</span> {selected.qualifier_name || "—"}</div>
            <div><span className="font-mono uppercase tracking-[0.14em] text-[10px] text-obsidian/55">Carrier Email:</span> {selected.insurance_carrier_email || "—"}</div>
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>What needs to be updated?</label>
        <textarea
          required
          rows={5}
          className={inputCls}
          placeholder="e.g. Workers' comp expired 10/15; need renewed certificate with Coastline Builders Group listed as additional insured."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={saving || subsLoading || !session.effectiveTenantId}
          className="inline-flex items-center gap-2 bg-obsidian px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Submit Request
        </button>
      </div>
    </form>
  );
}
