import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Save, AlertTriangle, FileText, Check, X } from "lucide-react";
import { getPermit, updatePermit, deletePermit, missingRequiredDocs, type PermitRow, type PermitStatus } from "@/lib/permits-api";

export const Route = createFileRoute("/portal/permits/$id")({
  head: () => ({
    meta: [
      { title: "Permit — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PermitDetailPage,
});

const STATUSES: PermitStatus[] = [
  "submitted", "in_review", "corrections_required", "approved", "permit_issued", "on_hold", "outsourced_permitting", "cancelled",
];

function PermitDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<PermitRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<Partial<PermitRow>>({});

  useEffect(() => {
    getPermit(id)
      .then((r) => { if (!r) throw notFound(); setRow(r); setEdit(r); })
      .catch(() => toast.error("Could not load permit"))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!row) return;
    setSaving(true);
    try {
      const updated = await updatePermit(row.id, edit);
      setRow(updated);
      setEdit(updated);
      toast.success("Saved");
    } catch (e) {
      toast.error("Save failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!row) return;
    if (!confirm(`Delete permit "${row.project_name}"? This cannot be undone.`)) return;
    try {
      await deletePermit(row.id);
      toast.success("Deleted");
      navigate({ to: "/my-permits" });
    } catch (e) {
      toast.error("Delete failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-6 py-12 text-obsidian/60">Loading…</div>;
  if (!row) return <div className="mx-auto max-w-5xl px-6 py-12 text-obsidian/60">Permit not found.</div>;

  const missing = missingRequiredDocs(row);
  const inputCls = "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";

  function set<K extends keyof PermitRow>(k: K, v: PermitRow[K]) { setEdit((p) => ({ ...p, [k]: v })); }
  const e = edit as PermitRow;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/my-permits" className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Permits
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-6">
        <div>
          <div className="eyebrow text-obsidian/50">Permit</div>
          <h1 className="display-serif mt-2 text-4xl text-obsidian">{row.project_name}</h1>
          <div className="mt-2 text-sm text-obsidian/60">{row.job_address}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] disabled:opacity-60">
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={remove} className="inline-flex items-center gap-2 border border-red-600/30 text-red-700 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="mt-6 border border-amber-500/40 bg-amber-50 rounded-[3px] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />
            <div>
              <div className="text-sm text-obsidian font-medium">This permit is missing required documents.</div>
              <ul className="mt-2 text-[12px] text-obsidian/70 list-disc pl-5">
                {missing.map((d) => <li key={d.key}>{d.label} ({d.status})</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Project</div>
          <div><label className={labelCls}>Project Name</label><input className={inputCls} value={e.project_name ?? ""} onChange={(ev) => set("project_name", ev.target.value)} /></div>
          <div><label className={labelCls}>Address</label><input className={inputCls} value={e.job_address ?? ""} onChange={(ev) => set("job_address", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Municipality</label><input className={inputCls} value={e.municipality ?? ""} onChange={(ev) => set("municipality", ev.target.value)} /></div>
            <div><label className={labelCls}>County</label><input className={inputCls} value={e.county ?? ""} onChange={(ev) => set("county", ev.target.value)} /></div>
          </div>
          <div><label className={labelCls}>Permit Type</label><input className={inputCls} value={e.permit_type ?? ""} onChange={(ev) => set("permit_type", ev.target.value)} /></div>
          <div><label className={labelCls}>Permit #</label><input className={inputCls} value={e.permit_number ?? ""} onChange={(ev) => set("permit_number", ev.target.value)} /></div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={e.status ?? "submitted"} onChange={(ev) => set("status", ev.target.value as PermitStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Description</label><textarea rows={3} className={inputCls} value={e.description ?? ""} onChange={(ev) => set("description", ev.target.value)} /></div>
        </div>

        <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Contractor & Owner</div>
          <div><label className={labelCls}>Contractor Company</label><input className={inputCls} value={e.contractor_company ?? ""} onChange={(ev) => set("contractor_company", ev.target.value)} /></div>
          <div><label className={labelCls}>Qualifier</label><input className={inputCls} value={e.contractor_qualifier ?? ""} onChange={(ev) => set("contractor_qualifier", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>POC</label><input className={inputCls} value={e.poc ?? ""} onChange={(ev) => set("poc", ev.target.value)} /></div>
            <div><label className={labelCls}>POC Phone</label><input className={inputCls} value={e.poc_phone ?? ""} onChange={(ev) => set("poc_phone", ev.target.value)} /></div>
          </div>
          <div><label className={labelCls}>POC Email</label><input className={inputCls} value={e.poc_email ?? ""} onChange={(ev) => set("poc_email", ev.target.value)} /></div>
          <div><label className={labelCls}>License #</label><input className={inputCls} value={e.license_number ?? ""} onChange={(ev) => set("license_number", ev.target.value)} /></div>
          <div className="pt-2 border-t border-obsidian/10">
            <label className={labelCls}>Owner Name</label><input className={inputCls} value={e.owner_name ?? ""} onChange={(ev) => set("owner_name", ev.target.value)} />
          </div>
          <div><label className={labelCls}>Owner Entity</label><input className={inputCls} value={e.owner_entity ?? ""} onChange={(ev) => set("owner_entity", ev.target.value)} /></div>
        </div>
      </div>

      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75 mb-4">Documents</div>
        <ul className="divide-y divide-obsidian/10">
          {(row.documents ?? []).map((d) => (
            <li key={d.key} className="py-3 flex items-center gap-3">
              {d.status === "uploaded" ? <Check className="h-4 w-4 text-emerald-600" /> : d.status === "pending" ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : d.status === "missing" && d.required ? <X className="h-4 w-4 text-red-600" /> : <FileText className="h-4 w-4 text-obsidian/40" />}
              <div className="flex-1">
                <div className="text-sm text-obsidian">{d.label}{d.required && <span className="ml-2 text-[10px] font-mono uppercase text-red-700">Required</span>}</div>
                {d.filename && <div className="text-[11px] text-obsidian/55 font-mono">{d.filename}</div>}
              </div>
              <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${
                d.status === "uploaded" ? "bg-emerald-100 text-emerald-800" :
                d.status === "pending" ? "bg-amber-100 text-amber-800" :
                d.status === "not_applicable" ? "bg-obsidian/10 text-obsidian/60" :
                "bg-red-100 text-red-800"
              }`}>{d.status.replace("_", " ")}</span>
            </li>
          ))}
        </ul>
      </div>

      {row.subs && row.subs.length > 0 && (
        <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75 mb-4">Subcontractors on this Permit</div>
          <ul className="divide-y divide-obsidian/10">
            {row.subs.map((s, i) => (
              <li key={i} className="py-3 text-sm">
                <div className="text-obsidian font-medium">{s.companyName} <span className="text-obsidian/50 text-[12px] font-normal">— {s.trade}</span></div>
                <div className="text-[12px] text-obsidian/60">{s.qualifierName} · Lic {s.licenseNumber} · {s.contactEmail}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 text-[11px] font-mono text-obsidian/45">
        Created {new Date(row.created_at).toLocaleString()} · Updated {new Date(row.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
