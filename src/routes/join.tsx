import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Request Access — Cleared by Flōridian" },
      { name: "description", content: "The permit management platform built exclusively for Florida's top general contractors. Invite-only." },
      { property: "og:title", content: "Cleared by Flōridian — Request Access" },
      { property: "og:description", content: "Permitting, handled. Invite-only access for Florida's top general contractors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const [form, setForm] = useState({ name: "", company: "", license_number: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const resp = await fetch("/api/public/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error(await resp.text());
      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen text-paper" style={{ backgroundColor: "var(--obsidian)" }}>
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="leading-[1]">
          <div className="wordmark text-3xl text-paper">Cleared</div>
          <div className="wordmark-subline mt-1" style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}>
            by Flōridian
          </div>
        </div>
        <a href="/" className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/60 hover:text-paper">
          ← Back
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper/50 mb-6">
          Invitation Only
        </div>
        <h1 className="display-serif text-5xl md:text-7xl leading-[1.05] mb-6">
          Permitting, <em>handled.</em>
        </h1>
        <p className="text-paper/70 text-lg max-w-xl mx-auto mb-12">
          The permit management platform built exclusively for Florida's top general contractors.
        </p>

        {submitted ? (
          <div className="max-w-md mx-auto border border-paper/15 bg-paper/[0.04] p-8 rounded-[3px]">
            <div className="display-serif text-2xl mb-2">Request received.</div>
            <p className="text-paper/70 text-sm">
              A member of the Flōridian team will be in touch shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="max-w-md mx-auto text-left space-y-3">
            <FormRow label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <FormRow label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <FormRow label="License Number" value={form.license_number} onChange={(v) => setForm({ ...form, license_number: v })} />
            <FormRow label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <FormRow label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 font-mono text-[11px] uppercase tracking-[0.24em] rounded-[3px] transition-colors disabled:opacity-60"
              style={{ backgroundColor: "var(--sky)", color: "var(--obsidian)" }}
            >
              {submitting ? "Submitting…" : "Request Access"}
            </button>
          </form>
        )}

        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <Stat n="400+" label="Florida jurisdictions" />
          <Stat n="One" label="Bundled permit submission" />
          <Stat n="Invite" label="Only" />
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-paper/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-paper/50 font-mono text-[10px] uppercase tracking-[0.2em]">
        <div>Cleared by Flōridian</div>
        <div>© 2026</div>
        <a href="https://floridianinc.com" className="hover:text-paper">floridianinc.com</a>
      </footer>
    </div>
  );
}

function FormRow({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-paper/50 mb-1.5">
        {label}{required && " *"}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-paper/[0.04] border border-paper/15 focus:border-paper/40 outline-none px-3 py-2.5 rounded-[3px] text-paper text-sm"
      />
    </label>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="border-l border-paper/15 pl-4">
      <div className="display-serif text-3xl mb-1">{n}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">{label}</div>
    </div>
  );
}
