import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { FileCheck2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/portal/request-coi")({
  head: () => ({
    meta: [
      { title: "Request COI — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestCOIPage,
});

function RequestCOIPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    projectAddress: "",
    holderName: "",
    holderAddress: "",
    additionalInsured: false,
    notes: "",
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const inputCls =
    "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="border border-obsidian/10 bg-white rounded-[3px] p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" strokeWidth={1.5} />
          <h1 className="display-serif mt-4 text-3xl text-obsidian">Request Received</h1>
          <p className="mt-3 text-sm text-obsidian/65 leading-relaxed">
            Your COI request has been submitted. Cleared will follow up within 1 business day.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setForm({ projectName: "", projectAddress: "", holderName: "", holderAddress: "", additionalInsured: false, notes: "" });
            }}
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
          <FileCheck2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Certificate of Insurance
        </div>
        <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Request COI</h1>
        <p className="mt-3 text-sm text-obsidian/60 max-w-xl">
          Submit a Certificate of Insurance request. Cleared will coordinate with your carrier and deliver the certificate to the holder.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
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
          <label className={labelCls}>Notes</label>
          <textarea rows={4} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
