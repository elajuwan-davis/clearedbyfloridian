import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { submitIntegrationRequestFn } from "@/lib/integration-requests.functions";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Cleard" },
      {
        name: "description",
        content:
          "Cleard is building direct integrations with the project management and CRM platforms contractors already run — JobTread, ServiceTitan, Procore and more.",
      },
      { property: "og:title", content: "Cleard plugs into the tools you already run." },
      {
        property: "og:description",
        content:
          "Direct integrations with the project management and CRM platforms contractors use every day. Here's what's coming.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegrationsPage,
});

const INK = "#000000";
const OAT = "#FFFFFF";
const GRAY = "rgba(0,0,0,0.55)";
const PLUM = "#9C6B3F";
const BORDER = "rgba(0,0,0,0.12)";
const SERIF = "'Instrument Sans', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

import logoJobtread from "@/assets/logo-jobtread.png.asset.json";
import logoServiceTitan from "@/assets/logo-servicetitan.png.asset.json";
import logoProcore from "@/assets/logo-procore.png.asset.json";
import logoNetic from "@/assets/logo-netic.png.asset.json";
import logoAvoca from "@/assets/logo-avoca.webp.asset.json";
import logoPodium from "@/assets/logo-podium.jpg.asset.json";
import logoCraftflow from "@/assets/logo-craftflow.png.asset.json";

const PLATFORMS: Array<{ name: string; blurb: string; logo?: string }> = [
  { name: "JobTread", logo: logoJobtread.url, blurb: "See your permit status right inside JobTread." },
  { name: "ServiceTitan", logo: logoServiceTitan.url, blurb: "Push a new job to Cleard and get the permit started automatically." },
  { name: "Procore", logo: logoProcore.url, blurb: "Keep drawings, submittals, and permit records on one timeline." },
  { name: "Netic.ai", logo: logoNetic.url, blurb: "Route inbound jobs into permit intake without retyping the address." },
  { name: "Avoca.ai", logo: logoAvoca.url, blurb: "Let your call intake hand a permit-ready project straight to Cleard." },
  { name: "Podium.com", logo: logoPodium.url, blurb: "Trigger homeowner updates the moment a permit is issued." },
  { name: "Craftflow", logo: logoCraftflow.url, blurb: "Sync scopes and subs so intake is filled in before you open it." },
];

function Monogram({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return (
      <div
        className="flex h-11 w-28 shrink-0 items-center justify-start"
        style={{ borderRadius: 0 }}
      >
        <img
          src={logo}
          alt={`${name} logo`}
          loading="lazy"
          className="max-h-11 w-auto max-w-full object-contain"
        />
      </div>
    );
  }
  const initials = name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center"
      style={{
        background: `color-mix(in oklab, ${PLUM} 10%, transparent)`,
        border: `1px solid ${BORDER}`,
        color: PLUM,
        fontFamily: MONO,
        fontSize: 13,
        letterSpacing: "0.06em",
        borderRadius: 0,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}


function IntegrationsPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Integrations"
        title="Cleard plugs into the tools you already run."
        intro="We're building direct integrations with the project management and CRM platforms contractors use every day. Here's what's coming."
      />

      <section style={{ background: OAT }}>
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-24 lg:px-8">
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: BORDER }}>
            {PLATFORMS.map((p) => (
              <div key={p.name} className="p-7" style={{ background: OAT }}>
                <div className="flex items-start justify-between gap-4">
                  <Monogram name={p.name} logo={p.logo} />
                  <span
                    className="px-2.5 py-1 text-[9.5px] uppercase"
                    style={{
                      fontFamily: MONO,
                      letterSpacing: "0.2em",
                      color: PLUM,
                      border: `1px solid color-mix(in oklab, ${PLUM} 30%, transparent)`,
                      borderRadius: 0,
                    }}
                  >
                    Coming Soon
                  </span>
                </div>
                <h3
                  className="mt-5 text-[21px]"
                  style={{ fontFamily: SERIF, color: INK, fontWeight: 600 }}
                >
                  {p.name}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: GRAY }}>
                  {p.blurb}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[12.5px]" style={{ color: GRAY }}>
            None of these integrations are live yet. Every platform above is in development.
          </p>
        </div>
      </section>

      <PlatformRequestForm />
    </MarketingShell>
  );
}

function PlatformRequestForm() {
  const submit = useServerFn(submitIntegrationRequestFn);
  const [form, setForm] = useState({ name: "", email: "", platform: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      await submit({
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          platform: form.platform.trim(),
        },
      });
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not send that just now.");
    }
  }

  const field = (
    label: string,
    key: keyof typeof form,
    type = "text",
  ) => (
    <div key={key}>
      <label
        className="mb-2 block font-mono text-[10px] uppercase"
        style={{ color: "rgba(0,0,0,0.6)", letterSpacing: "0.2em" }}
      >
        {label}
      </label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-transparent px-0 py-3 text-base outline-none"
        style={{
          color: OAT,
          borderBottom: "1px solid rgba(255,255,255,0.28)",
          borderRadius: 0,
        }}
      />
    </div>
  );

  return (
    <section style={{ background: OAT, borderTop: `1px solid ${BORDER}` }}>
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 md:py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <div
            className="text-[10.5px] font-bold uppercase"
            style={{ fontFamily: MONO, letterSpacing: "0.22em", color: "rgba(0,0,0,0.6)" }}
          >
            Tell us what you run
          </div>
          <h2
            className="mt-5 max-w-lg"
            style={{
              fontFamily: SERIF,
              color: OAT,
              fontWeight: 500,
              fontSize: "clamp(1.9rem, 4vw, 3rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
            }}
          >
            Don't see your platform listed?
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: "rgba(0,0,0,0.65)" }}>
            Tell us the tool your team lives in and we'll factor it into the integration roadmap.
          </p>
        </div>

        {state === "sent" ? (
          <div className="self-center">
            <p className="text-[17px]" style={{ fontFamily: SERIF, color: OAT }}>
              Thanks — we've logged {form.platform.trim() || "your platform"}.
            </p>
            <p className="mt-3 text-[13.5px]" style={{ color: "rgba(0,0,0,0.6)" }}>
              We'll reach out if we need detail about how your team uses it.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6 self-center">
            {field("Full Name", "name")}
            {field("Email", "email", "email")}
            {field("Which platform do you use?", "platform")}
            {state === "error" && (
              <div className="text-[12.5px]" style={{ color: "#e9b0b0" }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={state === "sending"}
              className="inline-flex h-14 w-full items-center justify-center gap-2 font-mono text-[11px] uppercase transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-copper)", color: "#FFFFFF", letterSpacing: "0.24em", borderRadius: 0 }}
            >
              {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send it over"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
