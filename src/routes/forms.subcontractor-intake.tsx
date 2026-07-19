import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { loadSubLibrary, upsertSub, type SubRecord as LibSub } from "@/lib/subcontractor-library";

export const Route = createFileRoute("/forms/subcontractor-intake")({
  head: () => ({ meta: [{ title: "Subcontractor Intake — Cleared" }, { name: "robots", content: "noindex" }] }),
  component: SubcontractorIntakePage,
});

const TRADES = ["Mechanical", "Electrical", "Plumbing", "Gas", "Roofing", "Aluminum", "General"] as const;
const PROJECTS_FALLBACK = [
  { id: "1", name: "Ocean Ridge Estate", permit_no: "CLR-2026-0142" },
  { id: "3", name: "Manalapan Bayfront", permit_no: "CLR-2026-0131" },
  { id: "7", name: "Palm Beach Landmark", permit_no: "CLR-2026-0104" },
];

type SubRecord = {
  companyName: string;
  trade: string;
  companyAddress: string;
  qualifierName: string;
  email: string;
  phone: string;
  licenseNumber: string;
};

function SubcontractorIntakePage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [savedId, setSavedId] = useState("");
  const [library, setLibrary] = useState<SubRecord[]>([]);
  const [form, setForm] = useState<SubRecord & { valuation: string }>({
    companyName: "",
    trade: "",
    companyAddress: "",
    qualifierName: "",
    email: "",
    phone: "",
    licenseNumber: "",
    valuation: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIB_KEY);
      if (raw) setLibrary(JSON.parse(raw) as SubRecord[]);
    } catch { /* ignore */ }
  }, []);

  function applySaved(idx: string) {
    setSavedId(idx);
    const sub = library[Number(idx)];
    if (sub) setForm((f) => ({ ...f, ...sub }));
  }

  function submit() {
    if (!projectId) return toast.error("Select a project");
    if (!form.companyName.trim()) return toast.error("Company name is required");
    if (!form.trade) return toast.error("Select a trade");
    if (!form.licenseNumber.trim()) return toast.error("License number is required");
    if (!form.valuation.trim()) return toast.error("Trade valuation is required");

    // Save to library if not already present
    const exists = library.some((s) => s.companyName === form.companyName && s.licenseNumber === form.licenseNumber);
    if (!exists) {
      const next = [...library, {
        companyName: form.companyName, trade: form.trade, companyAddress: form.companyAddress,
        qualifierName: form.qualifierName, email: form.email, phone: form.phone, licenseNumber: form.licenseNumber,
      }];
      localStorage.setItem(LIB_KEY, JSON.stringify(next));
    }
    toast.success("Subcontractor added to project");
    navigate({ to: "/forms" });
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <button onClick={() => navigate({ to: "/forms" })} className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian mb-6">
          <ArrowLeft className="h-3 w-3" /> All forms
        </button>

        <div className="border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Form / 02 — Subcontractor Intake</div>
          <h1 className="display-serif mt-3 text-4xl text-obsidian">Add a subcontractor</h1>
        </div>

        <div className="mt-10 space-y-6">
          <Field label="Select Project" required>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="rounded-[3px]"><SelectValue placeholder="Choose an active project" /></SelectTrigger>
              <SelectContent>
                {PROJECTS_FALLBACK.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.permit_no} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {library.length > 0 && (
            <Field label="Select Saved Subcontractor (optional)">
              <Select value={savedId} onValueChange={applySaved}>
                <SelectTrigger className="rounded-[3px]"><SelectValue placeholder="Pull from library" /></SelectTrigger>
                <SelectContent>
                  {library.map((s, i) => (
                    <SelectItem key={i} value={String(i)}>{s.companyName} — {s.trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Company Name" required>
              <Input className="rounded-[3px]" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </Field>
            <Field label="Specialty / Trade" required>
              <Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}>
                <SelectTrigger className="rounded-[3px]"><SelectValue placeholder="Select trade" /></SelectTrigger>
                <SelectContent>
                  {TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Company Address">
            <Input className="rounded-[3px]" value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Qualifier Name">
              <Input className="rounded-[3px]" value={form.qualifierName} onChange={(e) => setForm({ ...form, qualifierName: e.target.value })} />
            </Field>
            <Field label="License Number" required>
              <Input className="rounded-[3px] font-mono" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input className="rounded-[3px]" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input className="rounded-[3px]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Valuation of Trade ($)" required>
              <Input type="number" min={0} className="rounded-[3px] tabular-nums" value={form.valuation} onChange={(e) => setForm({ ...form, valuation: e.target.value })} />
            </Field>
          </div>

          <div className="pt-4 border-t border-obsidian/10">
            <Button variant="dark" className="rounded-[3px]" onClick={submit}>Submit Subcontractor</Button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
        {label}{required && <span className="text-oxblood ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
