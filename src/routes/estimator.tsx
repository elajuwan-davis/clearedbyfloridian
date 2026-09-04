import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import {
  TIER_LABEL,
  TIMELINE_COUNTIES,
  TIMELINE_PERMIT_TYPES,
  computeEstimate,
} from "@/lib/permit-timelines";

const OAT = "#FAF3E6";
const SLATE = "#2F4F4F";
const PLUM = "#673147";
const LINE = "#E4DACB";
const SERIF = '"Unbounded", sans-serif';

export const Route = createFileRoute("/estimator")({
  head: () => ({
    meta: [
      { title: "Florida Permit Timeline Estimator — Days and Fees by County | Cleard" },
      {
        name: "description",
        content:
          "Pick a Florida county and permit type to see an estimated permit timeline and fee range, then open the full timeline page for that combination.",
      },
      { property: "og:title", content: "Florida Permit Timeline Estimator | Cleard" },
      {
        property: "og:description",
        content:
          "Estimated permit days and fees by county and permit type, from published county-level data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Estimator,
});

function Estimator() {
  const [countySlug, setCountySlug] = useState(TIMELINE_COUNTIES[0].slug);
  const [permitSlug, setPermitSlug] = useState(TIMELINE_PERMIT_TYPES[0].slug);

  const county = TIMELINE_COUNTIES.find((c) => c.slug === countySlug)!;
  const permitType = TIMELINE_PERMIT_TYPES.find((p) => p.slug === permitSlug)!;
  const estimate = computeEstimate(county, permitType);

  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Estimator"
        title="Permit timeline estimator."
        intro="Choose a county and permit type to see the estimated timeline and fee range."
      />
      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-10" style={{ background: OAT }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ color: SLATE, opacity: 0.7 }}
            >
              County
            </span>
            <select
              value={countySlug}
              onChange={(e) => setCountySlug(e.target.value)}
              className="mt-2 w-full px-3 py-2.5 text-[14px]"
              style={{ border: `1px solid ${LINE}`, background: "#FFFDF7", color: SLATE }}
            >
              {TIMELINE_COUNTIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ color: SLATE, opacity: 0.7 }}
            >
              Permit type
            </span>
            <select
              value={permitSlug}
              onChange={(e) => setPermitSlug(e.target.value)}
              className="mt-2 w-full px-3 py-2.5 text-[14px]"
              style={{ border: `1px solid ${LINE}`, background: "#FFFDF7", color: SLATE }}
            >
              {TIMELINE_PERMIT_TYPES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-10 p-8" style={{ border: `1px solid ${LINE}`, background: "#FFFDF7" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: PLUM }}>
            {TIER_LABEL[county.tier]}
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-[12px]" style={{ color: SLATE, opacity: 0.7 }}>
                Estimated timeline
              </div>
              <div className="text-[28px]" style={{ fontFamily: SERIF, color: SLATE }}>
                {estimate.daysLow}–{estimate.daysHigh} days
              </div>
            </div>
            <div>
              <div className="text-[12px]" style={{ color: SLATE, opacity: 0.7 }}>
                Estimated permit fees
              </div>
              <div className="text-[28px]" style={{ fontFamily: SERIF, color: SLATE }}>
                ${estimate.feeLow.toLocaleString()}–${estimate.feeHigh.toLocaleString()}
              </div>
            </div>
          </div>
          <p className="mt-5 text-[12.5px] italic" style={{ color: SLATE, opacity: 0.65 }}>
            Beta estimate from published county-level data — not yet from live Cleard pipeline data
            for {county.name} County specifically.
          </p>
          <Link
            to="/coverage/$county/$permitType"
            params={{ county: county.slug, permitType: permitType.slug }}
            className="mt-6 inline-flex items-center px-6 py-3 text-[14px] no-underline"
            style={{ background: PLUM, color: OAT, fontWeight: 600 }}
          >
            Open the {county.name} County {permitType.shortName} page →
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
