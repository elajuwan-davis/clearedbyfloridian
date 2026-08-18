import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileStack, Map, Users } from "lucide-react";
import { MarketingShell } from "@/components/marketing-shell";


export const Route = createFileRoute("/join")({
  component: JoinPage,
  head: () => ({
    meta: [
      { title: "Cleard — Permit management for licensed contractors" },
      { name: "description", content: "Cleard handles jurisdiction requirements, sub coordination, document collection, and submission so your projects don't stall." },
      { property: "og:title", content: "Stop losing weeks to the permit process." },
      { property: "og:description", content: "One platform. Every permit. Every trade. Built for licensed contractors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const OBSIDIAN = "#153157";
const MUTED = `color-mix(in oklab, ${OBSIDIAN} 55%, transparent)`;
const HAIRLINE = `color-mix(in oklab, ${OBSIDIAN} 12%, transparent)`;

function JoinPage() {
  const [state, setState] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    company: "",
    license_number: "",
    email: "",
    phone: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/public/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("sent");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <MarketingShell>
    <div style={{ color: OBSIDIAN, fontFamily: "'DM Sans', sans-serif" }}>


      {/* HERO */}
      <section className="px-6 lg:px-10 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div
              className="font-mono text-[10px] uppercase mb-8"
              style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
            >
              Permit Management for Licensed Contractors
            </div>
            <h1
              className="display-serif font-bold leading-[1.02] mb-8"
              style={{
                color: OBSIDIAN,
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Stop losing weeks to the permit process.
            </h1>
            <p
              className="text-lg mb-10 max-w-xl"
              style={{ color: MUTED, lineHeight: 1.55 }}
            >
              Cleard is the permit management platform that handles jurisdiction requirements, sub coordination, document collection, and submission — so your projects don't stall.
            </p>
            <div className="flex items-center gap-8">
              <a
                href="#request"
                className="inline-flex items-center px-8 h-14 text-[12px] font-mono uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
                style={{ backgroundColor: OBSIDIAN, color: "#fff", borderRadius: 0 }}
              >
                Get Started
              </a>
              <a
                href="#problem"
                className="text-[13px] hover:underline"
                style={{ color: MUTED }}
              >
                See how it works ↓
              </a>
            </div>
          </div>

          {/* Product mockup card */}
          <div className="relative">
            <div
              className="relative bg-white p-6 lg:p-8"
              style={{
                border: `1px solid ${HAIRLINE}`,
                boxShadow: "0 30px 80px -30px rgba(21,49,87,0.25)",
              }}
            >
              <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                <div className="font-mono text-[9px] uppercase" style={{ color: MUTED, letterSpacing: "0.24em" }}>
                  Active Permits
                </div>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OBSIDIAN, opacity: 0.15 }} />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OBSIDIAN, opacity: 0.15 }} />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OBSIDIAN, opacity: 0.15 }} />
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Lighthouse Point Residence", muni: "Palm Beach", status: "Issued", tone: "#0a7a3f" },
                  { name: "Wellington Estate", muni: "Wellington", status: "In Review", tone: "#a86a00" },
                  { name: "Jupiter Waterfront", muni: "Jupiter", status: "Submitted", tone: "#1e40af" },
                  { name: "Vero Beach Custom", muni: "Indian River", status: "Corrections", tone: "#b91c1c" },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: OBSIDIAN }}>
                        {row.name}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                        {row.muni} County
                      </div>
                    </div>
                    <div
                      className="text-[10px] font-mono uppercase px-2.5 py-1"
                      style={{ color: row.tone, letterSpacing: "0.16em", backgroundColor: `color-mix(in oklab, ${row.tone} 10%, transparent)` }}
                    >
                      {row.status}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="font-mono text-[9px] uppercase" style={{ color: MUTED, letterSpacing: "0.24em" }}>
                  Bundled Submission
                </div>
                <div className="text-[11px]" style={{ color: OBSIDIAN }}>
                  6 trades · 1 package
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="px-6 lg:px-10 py-24" style={{ backgroundColor: "#FAF3E6" }}>
        <div className="max-w-7xl mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-6"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            The Problem
          </div>
          <h2
            className="display-serif font-bold leading-[1.05] mb-16 max-w-3xl"
            style={{ color: OBSIDIAN, fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            The way permitting works today is broken.
          </h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                label: "Delays kill timelines",
                body: "Every missed document, wrong jurisdiction requirement, or slow sub signature pushes your project back weeks. And that cost falls on you.",
              },
              {
                label: "Thousands of jurisdictions. Zero consistency.",
                body: "Every city has different checklists, different portals, different requirements. Tracking them manually is a full-time job nobody signed up for.",
              },
              {
                label: "Multiple trades, multiple failure points.",
                body: "Pulling separate permits per trade multiplies your cost and your exposure. One missed sub doc can hold up the whole job.",
              },
            ].map((c, i) => (
              <div key={c.label} className="bg-white p-8" style={{ border: `1px solid ${HAIRLINE}` }}>
                <div
                  className="font-mono text-[10px] uppercase mb-6"
                  style={{ color: MUTED, letterSpacing: "0.24em" }}
                >
                  0{i + 1}
                </div>
                <h3
                  className="display-serif font-bold mb-4 leading-tight"
                  style={{ color: OBSIDIAN, fontSize: "1.5rem", letterSpacing: "-0.01em" }}
                >
                  {c.label}
                </h3>
                <p className="text-[15px]" style={{ color: MUTED, lineHeight: 1.6 }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="px-6 lg:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-6"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            The Solution
          </div>
          <h2
            className="display-serif font-bold leading-[1.05] mb-4 max-w-3xl"
            style={{ color: OBSIDIAN, fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            Cleard fixes all of it.
          </h2>
          <p className="text-lg mb-16 max-w-2xl" style={{ color: MUTED }}>
            One platform. Every permit. Every trade.
          </p>
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {[
              {
                Icon: FileStack,
                label: "Bundled Submissions",
                body: "Submit all trades under one GC package. One submission, one point of contact, one fee.",
              },
              {
                Icon: Map,
                label: "Jurisdiction Intelligence",
                body: "Every municipality mapped with its exact checklist. The right documents, pre-loaded, every time.",
              },
              {
                Icon: Users,
                label: "Sub Coordination Built In",
                body: "Send signature requests to subs, track COIs, verify licenses — all from inside the platform.",
              },
            ].map((b) => (
              <div key={b.label}>
                <b.Icon size={28} strokeWidth={1.25} style={{ color: OBSIDIAN }} className="mb-6" />
                <h3
                  className="display-serif font-bold mb-4"
                  style={{ color: OBSIDIAN, fontSize: "1.5rem", letterSpacing: "-0.01em" }}
                >
                  {b.label}
                </h3>
                <p className="text-[15px]" style={{ color: MUTED, lineHeight: 1.6 }}>
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STAT ROW */}
      <section className="px-6 lg:px-10 py-24" style={{ backgroundColor: OBSIDIAN }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
          {[
            { n: "400+", l: "Jurisdictions mapped" },
            { n: "All trades", l: "Bundled in one submission" },
            { n: "Real-time", l: "Permit status tracking" },
          ].map((s) => (
            <div key={s.l}>
              <div
                className="display-serif font-bold leading-none mb-4"
                style={{ color: "#fff", fontSize: "clamp(2.25rem, 5vw, 3.75rem)", letterSpacing: "-0.02em" }}
              >
                {s.n}
              </div>
              <div
                className="text-[13px] font-light"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REQUEST FORM */}
      <section id="request" className="py-28 px-6" style={{ backgroundColor: "#FAF3E6" }}>
        <div className="max-w-lg mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-4 text-center"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            Get Started
          </div>
          <h2
            className="display-serif font-bold text-center mb-4"
            style={{ color: OBSIDIAN, fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.01em" }}
          >
            Ready to clear the backlog?
          </h2>
          <p className="text-center mb-12 text-[15px]" style={{ color: MUTED }}>
            Tell us about your operation and we'll get you set up.
          </p>

          {state === "sent" ? (
            <div className="text-center py-12">
              <div
                className="font-mono text-[10px] uppercase mb-4"
                style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
              >
                Received
              </div>
              <p style={{ color: OBSIDIAN }} className="text-lg">
                We'll be in touch within one business day.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              {[
                { k: "name", label: "Full Name", type: "text", required: true },
                { k: "company", label: "Company Name", type: "text", required: true },
                { k: "license_number", label: "Contractor License Number", type: "text", required: true },
                { k: "email", label: "Email", type: "email", required: true },
                { k: "phone", label: "Phone", type: "tel", required: true },
              ].map((f) => (
                <div key={f.k}>
                  <label
                    className="block font-mono text-[10px] uppercase mb-2"
                    style={{ color: MUTED, letterSpacing: "0.2em" }}
                  >
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={form[f.k as keyof typeof form]}
                    onChange={(e) => set(f.k as keyof typeof form, e.target.value)}
                    className="w-full bg-transparent px-0 py-3 text-base outline-none transition-colors"
                    style={{
                      color: OBSIDIAN,
                      borderBottom: `1px solid color-mix(in oklab, ${OBSIDIAN} 20%, transparent)`,
                      borderRadius: 0,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = OBSIDIAN)}
                    onBlur={(e) =>
                      (e.currentTarget.style.borderBottomColor = `color-mix(in oklab, ${OBSIDIAN} 20%, transparent)`)
                    }
                  />
                </div>
              ))}

              {state === "error" && (
                <div className="text-[12px]" style={{ color: "#b91c1c" }}>
                  {errorMsg || "Submission failed. Please try again."}
                </div>
              )}

              <button
                type="submit"
                disabled={state === "submitting"}
                className="w-full h-14 text-[12px] font-mono uppercase tracking-[0.24em] transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ backgroundColor: OBSIDIAN, color: "#fff", borderRadius: 0 }}
              >
                {state === "submitting" ? "Sending…" : "Get Started"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer handled by MarketingShell */}
    </div>
    </MarketingShell>
  );
}

