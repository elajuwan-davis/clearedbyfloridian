import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { loadSubLibrary, type SubRecord } from "@/lib/subcontractor-library";

export const Route = createFileRoute("/portal/request-sub-insurance")({
  head: () => ({
    meta: [
      { title: "Sub Insurance Request — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestSubInsurancePage,
});

function RequestSubInsurancePage() {
  const [submitted, setSubmitted] = useState(false);
  const [library, setLibrary] = useState<SubRecord[]>([]);
  const [subIdx, setSubIdx] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    setLibrary(loadSubLibrary());
  }, []);

  const selected = useMemo(
    () => (subIdx === "" ? null : library[Number(subIdx)] ?? null),
    [library, subIdx],
  );

  const inputCls =
    "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="border border-obsidian/10 bg-white rounded-[3px] p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" strokeWidth={1.5} />
          <h1 className="display-serif mt-4 text-3xl text-obsidian">Request Received</h1>
          <p className="mt-3 text-sm text-obsidian/65 leading-relaxed">
            Your request has been submitted. Cleard will follow up within 1 business day.
          </p>
          <button
            type="button"
            onClick={() => { setSubmitted(false); setSubIdx(""); setDetails(""); }}
            className="mt-6 inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="border-b border-obsidian/10 pb-8">
        <div className="eyebrow text-obsidian/50 flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.5} /> Insurance
        </div>
        <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Sub Insurance Request</h1>
        <p className="mt-3 text-sm text-obsidian/60 max-w-xl">
          Flag a subcontractor whose insurance needs to be updated. Cleard will contact their carrier directly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
        <div>
          <label className={labelCls}>Subcontractor</label>
          {library.length === 0 ? (
            <div className="text-[12px] text-obsidian/55 border border-dashed border-obsidian/20 rounded-[3px] p-3">
              No saved subcontractors yet. Add subs on a Permit Intake to populate this list.
            </div>
          ) : (
            <select className={inputCls} value={subIdx} onChange={(e) => setSubIdx(e.target.value)} required>
              <option value="">Select a subcontractor</option>
              {library.map((s, i) => (
                <option key={i} value={String(i)}>
                  {s.companyName}{s.trade ? ` — ${s.trade}` : ""}
                </option>
              ))}
            </select>
          )}
          {selected && (
            <div className="mt-2 text-[12px] text-obsidian/70 bg-obsidian/5 rounded-[3px] px-3 py-2 space-y-0.5">
              <div><span className="font-mono uppercase tracking-[0.14em] text-[10px] text-obsidian/55">Qualifier:</span> {selected.qualifierName || "—"}</div>
              <div><span className="font-mono uppercase tracking-[0.14em] text-[10px] text-obsidian/55">Carrier Email:</span> {selected.insuranceCarrierEmail || "—"}</div>
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
          <button type="submit" className="inline-flex items-center gap-2 bg-obsidian px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
