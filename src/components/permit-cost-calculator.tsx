import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

const OAT = "#FFFFFF";
const OFF = "#FFFFFF";
const INK = "#000000";
const GRAY = "rgba(0,0,0,0.55)";
const PLUM = "#9C6B3F";
const BORDER = "rgba(0,0,0,0.12)";
const SERIF = "'Instrument Sans', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const PROJECT_TYPES = [
  "Pool & Spa",
  "Roofing",
  "HVAC",
  "Electrical",
  "Kitchen & Bath",
  "Addition / ADU",
  "New Construction",
  "Other",
];

/** Cleard baseline used for the schedule comparison: 2-day plan review, same-day inspections. */
const CLEARD_REVIEW_DAYS = 2;
const CLEARD_INSPECTION_DELAY = 0;

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function NumField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span
        className="block text-[10px] uppercase"
        style={{ fontFamily: MONO, letterSpacing: "0.16em", color: GRAY }}
      >
        {label}
      </span>
      <span className="mt-2 flex items-center" style={{ border: `1px solid ${BORDER}`, background: OAT }}>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-4 py-3 text-[15px] outline-none"
          style={{ color: INK }}
        />
        {suffix && (
          <span className="pr-4 text-[12px]" style={{ color: GRAY, fontFamily: MONO }}>
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

export function PermitCostCalculator({ background = OFF }: { background?: string }) {
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [permitsPerYear, setPermitsPerYear] = useState(24);
  const [hoursPerPermit, setHoursPerPermit] = useState(6);
  const [hourlyCost, setHourlyCost] = useState(45);
  const [reviewDays, setReviewDays] = useState(15);
  const [inspections, setInspections] = useState(5);
  const [inspectionDelay, setInspectionDelay] = useState(3);

  const r = useMemo(() => {
    const annualHours = permitsPerYear * hoursPerPermit;
    const adminCost = annualHours * hourlyCost;

    const reviewExposure = Math.max(0, reviewDays - CLEARD_REVIEW_DAYS);
    const inspectionExposure = Math.max(0, inspectionDelay - CLEARD_INSPECTION_DELAY) * inspections;
    const daysPerProject = reviewExposure + inspectionExposure;
    const annualDays = daysPerProject * permitsPerYear;

    // Schedule exposure valued at the same loaded coordination cost per delayed day.
    const scheduleCost = annualDays * hourlyCost * 2;
    return {
      annualHours,
      adminCost,
      daysPerProject,
      annualDays,
      scheduleCost,
      total: adminCost + scheduleCost,
    };
  }, [permitsPerYear, hoursPerPermit, hourlyCost, reviewDays, inspections, inspectionDelay]);

  return (
    <section style={{ background }}>
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-24 lg:px-8">
        <div
          className="flex items-center gap-3 text-[10.5px] font-bold uppercase"
          style={{ letterSpacing: "0.22em", color: INK, fontFamily: MONO }}
        >
          <span className="copper-hairline inline-block h-px w-7" />
          Cost of delay
        </div>
        <h2
          className="mt-5 max-w-3xl"
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(1.8rem, 3.4vw, 2.6rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: INK,
          }}
        >
          What is your current permit process{" "}
          <span className="copper-emph">actually costing you?</span>
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] items-start">
          {/* Inputs */}
          <div className="p-6 md:p-8" style={{ background: OAT, border: `1px solid ${BORDER}` }}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span
                  className="block text-[10px] uppercase"
                  style={{ fontFamily: MONO, letterSpacing: "0.16em", color: GRAY }}
                >
                  Project type
                </span>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
                  style={{ border: `1px solid ${BORDER}`, background: OAT, color: INK }}
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <NumField
                label="Permits handled per year"
                value={permitsPerYear}
                onChange={setPermitsPerYear}
              />
              <NumField
                label="Staff hours per permit"
                value={hoursPerPermit}
                onChange={setHoursPerPermit}
                suffix="hrs"
              />
              <NumField
                label="Loaded hourly cost"
                value={hourlyCost}
                onChange={setHourlyCost}
                suffix="$/hr"
              />
              <NumField
                label="Current plan review turnaround"
                value={reviewDays}
                onChange={setReviewDays}
                suffix="biz days"
              />
              <NumField
                label="Inspections per project"
                value={inspections}
                onChange={setInspections}
              />
              <NumField
                label="Scheduling delay per inspection"
                value={inspectionDelay}
                onChange={setInspectionDelay}
                suffix="biz days"
              />
            </div>
          </div>

          {/* Outputs */}
          <div className="p-6 md:p-8" style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
            <div
              className="text-[10px] uppercase"
              style={{ fontFamily: MONO, letterSpacing: "0.2em", color: "rgba(0,0,0,0.6)" }}
            >
              {projectType} · Annual estimate
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <div
                  className="text-[10px] uppercase"
                  style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "rgba(0,0,0,0.55)" }}
                >
                  Admin-hour cost
                </div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 600,
                    fontSize: "2.3rem",
                    letterSpacing: "-0.035em",
                    color: INK,
                    lineHeight: 1.05,
                  }}
                >
                  {usd(r.adminCost)}
                </div>
                <div className="mt-1 text-[13px]" style={{ color: "rgba(0,0,0,0.6)" }}>
                  {r.annualHours.toLocaleString()} staff hours per year
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.10)" }} className="pt-6">
                <div
                  className="text-[10px] uppercase"
                  style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "rgba(0,0,0,0.55)" }}
                >
                  Schedule exposure
                </div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 600,
                    fontSize: "2.3rem",
                    letterSpacing: "-0.035em",
                    color: INK,
                    lineHeight: 1.05,
                  }}
                >
                  {r.annualDays.toLocaleString()} days
                </div>
                <div className="mt-1 text-[13px]" style={{ color: "rgba(0,0,0,0.6)" }}>
                  {r.daysPerProject} business days per project against Cleard&apos;s 2-day plan review
                  and same-day inspections
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.10)" }} className="pt-6">
                <div
                  className="text-[10px] uppercase"
                  style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "#9C6B3F" }}
                >
                  Total identifiable cost exposure
                </div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 600,
                    fontSize: "2.9rem",
                    letterSpacing: "-0.04em",
                    color: INK,
                    lineHeight: 1.02,
                  }}
                >
                  {usd(r.total)}
                </div>
              </div>
            </div>

            <Link
              to="/join"
              className="p-btn p-btn-primary mt-8 inline-flex items-center no-underline"
              style={{ fontWeight: 700 }}
            >
              See how Cleard compares →
            </Link>

            <p
              className="mt-6 text-[11.5px] leading-relaxed"
              style={{ color: "rgba(0,0,0,0.5)" }}
            >
              These are planning estimates, not guaranteed savings. Actual results vary by project
              scope, jurisdiction, and conditions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
