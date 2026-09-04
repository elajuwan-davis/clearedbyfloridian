import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { createLead } from "@/lib/leads";
import {
  TIER_LABEL,
  TIMELINE_PERMIT_TYPES,
  computeEstimate,
  findTimelineCounty,
  findTimelinePermitType,
} from "@/lib/permit-timelines";

const OAT = "#FFFFFF";
const SLATE = "#000000";
const PLUM = "#000000";
const PLUM_DARK = "#4E2438";
const LAVENDER = "#E6E6FA";
const LINE = "#E4DACB";
const SERIF = '"Instrument Sans", sans-serif';

export const Route = createFileRoute("/coverage/$county/$permitType")({
  loader: ({ params }) => {
    const county = findTimelineCounty(params.county);
    const permitType = findTimelinePermitType(params.permitType);
    if (!county || !permitType) throw notFound();
    return { county, permitType, estimate: computeEstimate(county, permitType) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — Cleard" }, { name: "robots", content: "noindex" }],
      };
    }
    const { county, permitType, estimate } = loaderData;
    const title = `${county.name} County ${permitType.shortName} Permit Timeline (${estimate.daysLow}–${estimate.daysHigh} Days) | Cleard`;
    const description = `How long a ${permitType.name.toLowerCase()} permit takes in ${county.label}: an estimated ${estimate.daysLow}–${estimate.daysHigh} days and $${estimate.feeLow.toLocaleString()}–$${estimate.feeHigh.toLocaleString()} in fees, plus what reviewers check. Cleard runs private-provider plan review in ${county.name} County.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: TimelineNotFound,
  component: TimelinePage,
});

function TimelineNotFound() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-6 py-28 lg:px-10">
        <h1 className="text-[32px]" style={{ fontFamily: SERIF, color: SLATE }}>
          We don't have a timeline page for that combination.
        </h1>
        <p className="mt-4 text-[15px]" style={{ color: SLATE, opacity: 0.75 }}>
          Use the estimator to pick a different county or permit type.
        </p>
        <Link to="/estimator" className="mt-6 inline-block underline" style={{ color: PLUM }}>
          Open the estimator →
        </Link>
      </section>
    </MarketingShell>
  );
}

function TimelinePage() {
  const { county, permitType, estimate } = Route.useLoaderData();
  const siblings = TIMELINE_PERMIT_TYPES.filter((p) => p.slug !== permitType.slug);

  return (
    <MarketingShell>
      <div style={{ background: OAT }}>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-5xl px-6 pt-10 text-[12px] lg:px-10"
          style={{ color: SLATE, opacity: 0.7 }}
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/coverage" style={{ color: "inherit" }}>
                Coverage
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link
                to="/coverage/$county"
                params={{ county: county.slug }}
                style={{ color: "inherit" }}
              >
                {county.label}
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" style={{ fontWeight: 600, opacity: 1 }}>
              {permitType.name}
            </li>
          </ol>
        </nav>

        {/* Hero + stat block */}
        <header className="mx-auto max-w-5xl px-6 pb-14 pt-8 lg:px-10">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: PLUM }}
          >
            {TIER_LABEL[county.tier]}
          </div>
          <h1
            className="mt-4 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]"
            style={{ fontFamily: SERIF, fontWeight: 500, color: SLATE }}
          >
            {county.name} County {permitType.shortName} Permit Timeline
          </h1>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Estimated timeline"
              value={`${estimate.daysLow}–${estimate.daysHigh} days`}
              note="Submittal to issuance"
            />
            <StatCard
              label="Estimated permit fees"
              value={`$${estimate.feeLow.toLocaleString()}–$${estimate.feeHigh.toLocaleString()}`}
              note="County-level fee range"
            />
            <StatCard
              label="Jurisdiction tier"
              value={`Tier ${county.tier}`}
              note={TIER_LABEL[county.tier].split("·")[1]?.trim() ?? ""}
            />
          </div>

          <p className="mt-5 text-[12.5px] " style={{ color: SLATE, opacity: 0.65 }}>
            Beta estimate from published county-level data — not yet from live Cleard pipeline data
            for {county.name} County specifically.
          </p>
        </header>

        {/* County-specific + permit-specific body */}
        <section
          className="mx-auto max-w-5xl px-6 py-14 lg:px-10"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          <h2
            className="text-[24px]"
            style={{ fontFamily: SERIF, fontWeight: 500, color: SLATE }}
          >
            Why a {permitType.shortName.toLowerCase()} permit takes {estimate.daysLow}–
            {estimate.daysHigh} days in {county.label}
          </h2>
          <p
            className="mt-5 max-w-3xl text-[15.5px] leading-relaxed"
            style={{ color: SLATE, opacity: 0.85 }}
          >
            {county.fact}
          </p>
          <h3
            className="mt-10 text-[18px]"
            style={{ fontFamily: SERIF, fontWeight: 500, color: SLATE }}
          >
            What reviewers check on a {permitType.name.toLowerCase()} submittal
          </h3>
          <p
            className="mt-4 max-w-3xl text-[15.5px] leading-relaxed"
            style={{ color: SLATE, opacity: 0.85 }}
          >
            {permitType.technical}
          </p>
        </section>

        {/* Lead form */}
        <section className="mx-auto max-w-5xl px-6 pb-14 lg:px-10">
          <LeadForm
            countyName={county.label}
            permitTypeName={permitType.name}
            estimate={estimate}
          />
        </section>

        {/* Callout up to the county page */}
        <section className="mx-auto max-w-5xl px-6 pb-14 lg:px-10">
          <div className="p-8" style={{ background: LAVENDER, border: `1px solid ${LINE}` }}>
            <p
              className="max-w-2xl text-[19px] leading-snug"
              style={{ fontFamily: SERIF, color: SLATE }}
            >
              Tired of waiting {estimate.daysLow}–{estimate.daysHigh} days? Cleard runs
              private-provider plan review in {county.name} County — 2-day plan review, same-day
              inspections.
            </p>
            <Link
              to="/coverage/$county"
              params={{ county: county.slug }}
              className="mt-6 inline-flex items-center px-6 py-3 text-[14px] no-underline"
              style={{ background: PLUM, color: OAT, fontWeight: 600 }}
            >
              See Cleard in {county.name} County →
            </Link>
          </div>
        </section>

        {/* Sibling permit types + estimator */}
        <section
          className="mx-auto max-w-5xl px-6 pb-24 lg:px-10"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          <div className="pt-12">
            <h2 className="text-[20px]" style={{ fontFamily: SERIF, color: SLATE }}>
              Other permit timelines in {county.label}
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {siblings.map((p) => (
                <Link
                  key={p.slug}
                  to="/coverage/$county/$permitType"
                  params={{ county: county.slug, permitType: p.slug }}
                  className="px-4 py-2 text-[13px] no-underline"
                  style={{ border: `1px solid ${LINE}`, color: SLATE }}
                >
                  {p.shortName}
                </Link>
              ))}
            </div>
            <p className="mt-8 text-[14px]" style={{ color: SLATE, opacity: 0.8 }}>
              Need a different county or permit type?{" "}
              <Link to="/estimator" className="underline" style={{ color: PLUM }}>
                Run the permit timeline estimator
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="p-6" style={{ border: `1px solid ${LINE}`, background: "#FFFDF7" }}>
      <div
        className="font-mono text-[10px] uppercase tracking-[0.16em]"
        style={{ color: PLUM }}
      >
        {label}
      </div>
      <div className="mt-3 text-[26px] leading-none" style={{ fontFamily: SERIF, color: SLATE }}>
        {value}
      </div>
      <div className="mt-2 text-[12px]" style={{ color: SLATE, opacity: 0.7 }}>
        {note}
      </div>
    </div>
  );
}

function LeadForm({
  countyName,
  permitTypeName,
  estimate,
}: {
  countyName: string;
  permitTypeName: string;
  estimate: { daysLow: number; daysHigh: number; feeLow: number; feeHigh: number };
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await createLead({
        name: name.trim(),
        company: company.trim() || null,
        email: email.trim(),
        county: countyName,
        permit_type: permitTypeName,
        estimate_days_low: estimate.daysLow,
        estimate_days_high: estimate.daysHigh,
        estimate_fee_low: estimate.feeLow,
        estimate_fee_high: estimate.feeHigh,
        source: "seo-landing-page",
        page_url: typeof window !== "undefined" ? window.location.href : null,
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="p-8" style={{ border: `1px solid ${PLUM}`, background: "#FFFDF7" }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: PLUM }}>
          Estimate confirmed
        </div>
        <h2 className="mt-3 text-[24px]" style={{ fontFamily: SERIF, color: SLATE }}>
          {permitTypeName} in {countyName}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-[12px]" style={{ color: SLATE, opacity: 0.7 }}>
              Timeline
            </div>
            <div className="text-[22px]" style={{ fontFamily: SERIF, color: SLATE }}>
              {estimate.daysLow}–{estimate.daysHigh} days
            </div>
          </div>
          <div>
            <div className="text-[12px]" style={{ color: SLATE, opacity: 0.7 }}>
              Permit fees
            </div>
            <div className="text-[22px]" style={{ fontFamily: SERIF, color: SLATE }}>
              ${estimate.feeLow.toLocaleString()}–${estimate.feeHigh.toLocaleString()}
            </div>
          </div>
        </div>
        <p className="mt-5 text-[13.5px]" style={{ color: SLATE, opacity: 0.8 }}>
          Thanks, {name || "there"} — we've got your details and a principal will follow up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="p-8" style={{ border: `1px solid ${LINE}`, background: "#FFFDF7" }}>
      <h2 className="text-[24px]" style={{ fontFamily: SERIF, fontWeight: 500, color: SLATE }}>
        Get this estimate for your project
      </h2>
      <p className="mt-3 max-w-2xl text-[14px]" style={{ color: SLATE, opacity: 0.8 }}>
        Enter your details and we'll confirm the {permitTypeName.toLowerCase()} timeline for{" "}
        {countyName} on screen.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Company" value={company} onChange={setCompany} />
        <Field label="Email" value={email} onChange={setEmail} type="email" required />
      </div>
      {status === "error" ? (
        <p className="mt-4 text-[13px]" style={{ color: PLUM_DARK }}>
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === "saving"}
        className="mt-6 inline-flex items-center px-6 py-3 text-[14px]"
        style={{
          background: status === "saving" ? PLUM_DARK : PLUM,
          color: OAT,
          fontWeight: 600,
          opacity: status === "saving" ? 0.8 : 1,
        }}
      >
        {status === "saving" ? "Sending…" : "Show my estimate →"}
      </button>
    </form>
  );
}

function Field({
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
      <span
        className="font-mono text-[10px] uppercase tracking-[0.16em]"
        style={{ color: SLATE, opacity: 0.7 }}
      >
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full px-3 py-2.5 text-[14px] outline-none"
        style={{ border: `1px solid ${LINE}`, background: OAT, color: SLATE }}
      />
    </label>
  );
}
