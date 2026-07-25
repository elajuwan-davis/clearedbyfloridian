import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/join")({
  component: JoinPage,
  head: () => ({
    meta: [
      { title: "Request Access — Cléared by Flōridian" },
      { name: "description", content: "The permit management platform built exclusively for Florida's top contractors. Invite only." },
      { property: "og:title", content: "Cléared — Permitting, handled." },
      { property: "og:description", content: "Invite-only permit management for Florida's top contractors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const OBSIDIAN = "#153157";

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
    <div style={{ backgroundColor: "#ffffff", color: OBSIDIAN, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* NAV */}
      <header
        className="sticky top-0 z-40 bg-white"
        style={{ borderBottom: `1px solid color-mix(in oklab, ${OBSIDIAN} 8%, transparent)` }}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="wordmark text-2xl leading-none" style={{ color: OBSIDIAN }}>
            Cleared
          </Link>
          <a
            href="#request"
            className="hidden sm:inline-flex items-center px-5 h-10 text-[11px] font-mono uppercase tracking-[0.2em] transition-opacity hover:opacity-85"
            style={{ backgroundColor: OBSIDIAN, color: "#fff", borderRadius: 0 }}
          >
            Request Access
          </a>
        </div>
      </header>

      {/* HERO */}
      <section
        className="flex items-center justify-center px-6 text-center"
        style={{ minHeight: "calc(100vh - 4rem)" }}
      >
        <div className="max-w-3xl mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-8"
            style={{ color: OBSIDIAN, letterSpacing: "0.35em" }}
          >
            Invite Only
          </div>
          <h1
            className="display-serif font-bold leading-[1.02] mb-6"
            style={{
              color: OBSIDIAN,
              fontSize: "clamp(3rem, 8vw, 6rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Permitting, handled.
          </h1>
          <p
            className="text-base sm:text-lg mb-12 max-w-xl mx-auto"
            style={{ color: "color-mix(in oklab, " + OBSIDIAN + " 55%, transparent)" }}
          >
            The permit management platform built exclusively for Florida's top contractors.
          </p>
          <a
            href="#request"
            className="inline-flex items-center px-10 h-14 text-[12px] font-mono uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
            style={{ backgroundColor: OBSIDIAN, color: "#fff", borderRadius: 0 }}
          >
            Request Access
          </a>
          <div
            className="mt-6 text-[12px]"
            style={{ color: "color-mix(in oklab, " + OBSIDIAN + " 40%, transparent)" }}
          >
            Currently accepting contractors by referral only.
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
          {[
            { n: "400+", l: "Florida jurisdictions" },
            { n: "1", l: "Submission. All trades." },
            { n: "Invite only", l: "No public signup" },
          ].map((s) => (
            <div key={s.l}>
              <div
                className="display-serif font-bold leading-none mb-4"
                style={{
                  color: OBSIDIAN,
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.n}
              </div>
              <div
                className="text-[13px] font-light"
                style={{ color: "color-mix(in oklab, " + OBSIDIAN + " 55%, transparent)" }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REQUEST FORM */}
      <section id="request" className="py-28 px-6" style={{ backgroundColor: "#fafafa" }}>
        <div className="max-w-lg mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-4 text-center"
            style={{ color: OBSIDIAN, letterSpacing: "0.35em" }}
          >
            Request Access
          </div>
          <h2
            className="display-serif font-bold text-center mb-12"
            style={{ color: OBSIDIAN, fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.01em" }}
          >
            Tell us who you are.
          </h2>

          {state === "sent" ? (
            <div className="text-center py-12">
              <div
                className="font-mono text-[10px] uppercase mb-4"
                style={{ color: OBSIDIAN, letterSpacing: "0.35em" }}
              >
                Received
              </div>
              <p style={{ color: OBSIDIAN }} className="text-lg">
                Your request has been received. We'll be in touch.
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
                    style={{ color: "color-mix(in oklab, " + OBSIDIAN + " 55%, transparent)", letterSpacing: "0.2em" }}
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
                {state === "submitting" ? "Sending…" : "Submit Request"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 text-center">
        <div
          className="text-[12px]"
          style={{ color: "color-mix(in oklab, " + OBSIDIAN + " 40%, transparent)" }}
        >
          Cléared by Flōridian · © 2026 ·{" "}
          <a href="https://floridianinc.com" className="hover:underline">
            floridianinc.com
          </a>
        </div>
      </footer>
    </div>
  );
}
