import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Minus } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";
import cleardMark from "@/assets/cleard-c-copper.png.asset.json";
import logoGreenlite from "@/assets/logo-greenlite.png.asset.json";
import logoPermitflow from "@/assets/logo-permitflow.png.asset.json";
import logoSunray from "@/assets/logo-sunray.png.asset.json";
import logoMycoi from "@/assets/logo-mycoi.png.asset.json";
import logoInspected from "@/assets/logo-inspected.png.asset.json";
import logoOneCS from "@/assets/logo-one-contractor-solutions.png.asset.json";
import logoFreedom from "@/assets/logo-freedom-code.png.asset.json";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare — Cleard vs GreenLite, Permit Flow, SunRay, myCOI" },
      {
        name: "description",
        content:
          "Five services, one login. See how Cleard compares to GreenLite, Permit Flow, SunRay, myCOI, Inspected, 1 Contractor Solutions and Freedom Code Compliance.",
      },
      { property: "og:title", content: "Five services. Count how many they cover." },
      {
        property: "og:description",
        content:
          "Most vendors cover one or two. Cleard covers all five — permitting, private plan review, licensing, insurance compliance and lien rights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

const INK = "#2F4F4F";
const GRAY = "#7A5C68";
const PLUM = "#673147";
const BORDER = "#E0D3BC";
const OFF = "#F3EAD9";
const LAV = "#E6E6FA";

const SERVICES = [
  "Permitting Administration",
  "Private Plan Review & Inspections",
  "Contractor License Management",
  "Insurance Compliance",
  "Lien Rights",
] as const;

type Vendor = {
  name: string;
  logo: string;
  note: string;
  /** one boolean per SERVICES entry */
  covers: [boolean, boolean, boolean, boolean, boolean];
};

const CLEARD: Vendor = {
  name: "Cleard",
  logo: cleardMark.url,
  note: "All five services on one project record, one login, one bill.",
  covers: [true, true, true, true, true],
};

const VENDORS: Vendor[] = [
  {
    name: "GreenLite",
    logo: logoGreenlite.url,
    note: "Permitting and inspections only — no licensing, insurance or lien rights.",
    covers: [true, true, false, false, false],
  },
  {
    name: "Permit Flow",
    logo: logoPermitflow.url,
    note: "Submission tracking software. No private provider licence.",
    covers: [true, false, false, false, false],
  },
  {
    name: "SunRay",
    logo: logoSunray.url,
    note: "Lien and notice documents, filed per document.",
    covers: [false, false, false, false, true],
  },
  {
    name: "myCOI",
    logo: logoMycoi.url,
    note: "Certificate tracking in isolation from the permit record.",
    covers: [false, false, false, true, false],
  },
  {
    name: "Inspected",
    logo: logoInspected.url,
    note: "Virtual inspections priced per inspection.",
    covers: [false, true, false, false, false],
  },
  {
    name: "1 Contractor Solutions",
    logo: logoOneCS.url,
    note: "Service agency for permits and licences — no platform of record.",
    covers: [true, false, true, false, false],
  },
  {
    name: "Freedom Code Compliance",
    logo: logoFreedom.url,
    note: "Plan review and inspections as a service bureau, no software.",
    covers: [false, true, false, false, false],
  },
];

const MATRIX_ROWS: { feature: string; cleard: boolean | string; cells: (boolean | string)[] }[] = [
  ...SERVICES.map((s, i) => ({
    feature: s,
    cleard: true,
    cells: VENDORS.map((v) => v.covers[i]),
  })),
  {
    feature: "Permit submission tracking",
    cleard: true,
    cells: [true, true, false, false, false, true, false],
  },
  {
    feature: "AI assistant",
    cleard: true,
    cells: [true, true, false, false, false, false, false],
  },
  {
    feature: "Dedicated back-office team",
    cleard: true,
    cells: [false, false, false, false, false, true, true],
  },
  {
    feature: "Pricing model",
    cleard: "Subscription",
    cells: [
      "Per-project",
      "Subscription",
      "Per-document",
      "Subscription",
      "Per-inspection",
      "Per-project",
      "Per-project",
    ],
  },
];

function Logo({ src, name, size = 34 }: { src: string; name: string; size?: number }) {
  // Fixed-height, aspect-preserving slot: no white plate, no border, logo art
  // fills its own bounds edge to edge.
  return (
    <span
      className="inline-flex shrink-0 items-center justify-start overflow-hidden"
      style={{ width: Math.round(size * 2.4), height: size }}
    >
      <img
        src={src}
        alt={`${name} logo`}
        loading="lazy"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          display: "block",
          borderRadius: 4,
        }}
      />
    </span>
  );
}

function Pips({ covers, hero }: { covers: boolean[]; hero?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {covers.map((on, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scaleX: 0.4 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 * i, duration: 0.35, ease: "easeOut" }}
          style={{
            display: "block",
            height: hero ? 14 : 12,
            width: "clamp(28px, 6vw, 62px)",
            borderRadius: 3,
            transformOrigin: "left",
            background: on ? (hero ? "#52243A" : INK) : "#E4E0D6",
            opacity: on ? 1 : 0.9,
          }}
        />
      ))}
    </div>
  );
}

function VendorRow({ v, hero, index }: { v: Vendor; hero?: boolean; index: number }) {
  const [open, setOpen] = useState(false);
  const score = v.covers.filter(Boolean).length;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.04 * index, duration: 0.4 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      className="outline-none"
      style={{
        padding: hero ? "18px 18px" : "14px 18px",
        borderBottom: hero ? "none" : `1px solid ${BORDER}`,
        border: hero ? `1px solid ${PLUM}` : undefined,
        borderRadius: hero ? 10 : 0,
        background: hero ? LAV : open ? "rgba(103,49,71,0.045)" : "transparent",
        transition: "background 220ms ease",
      }}
    >
      <div className="flex items-center gap-4">
        <Logo src={v.logo} name={v.name} size={hero ? 40 : 32} />
        <div
          className="min-w-0 flex-1"
          style={{
            color: hero ? PLUM : INK,
            fontWeight: hero ? 800 : 600,
            fontSize: hero ? 18 : 14.5,
            letterSpacing: "-0.01em",
          }}
        >
          {v.name}
        </div>
        <Pips covers={v.covers} hero={hero} />
        <div
          className="w-10 text-right tabular-nums"
          style={{ color: hero ? PLUM : GRAY, fontSize: 12.5, fontWeight: 700 }}
        >
          {score}/5
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="pt-2.5 pl-[3rem] text-[13px] leading-relaxed"
              style={{ color: hero ? "#52243A" : GRAY }}
            >
              {v.note}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Mark({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="mx-auto h-4 w-4" style={{ color: PLUM }} strokeWidth={2.6} />;
  if (value === false)
    return <Minus className="mx-auto h-4 w-4" style={{ color: "#B9B0A2" }} strokeWidth={2} />;
  return (
    <span className="text-[12px]" style={{ color: GRAY }}>
      {value}
    </span>
  );
}

function ComparePage() {
  const [expanded, setExpanded] = useState(false);
  const allVendors = useMemo(() => VENDORS, []);

  return (
    <MarketingShell>
      <div style={{ background: "#FAF3E6", color: INK }}>
        <section className="mx-auto max-w-4xl px-5 lg:px-8 pt-20 pb-14 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10.5px] uppercase tracking-[0.24em]"
            style={{ color: PLUM }}
          >
            Coverage
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-5 max-w-2xl"
            style={{
              fontWeight: 800,
              fontSize: "clamp(2rem, 4.4vw, 3.1rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            Five services. Count how many they cover.
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 260 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6"
            style={{ height: 6, borderRadius: 3, background: "#DCD8CC" }}
          />

          {/* Service legend */}
          <div className="mt-7 flex flex-wrap gap-x-4 gap-y-1.5">
            {SERVICES.map((s, i) => (
              <span
                key={s}
                className="text-[11px] uppercase tracking-[0.12em]"
                style={{ color: GRAY }}
              >
                <span style={{ color: PLUM, fontWeight: 700 }}>{i + 1}</span> {s}
              </span>
            ))}
          </div>

          {/* Coverage board */}
          <div className="mt-9">
            <VendorRow v={CLEARD} hero index={0} />
            <div className="mt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              {allVendors.map((v, i) => (
                <VendorRow key={v.name} v={v} index={i + 1} />
              ))}
            </div>
          </div>

          {/* Expandable full matrix */}
          <div className="mt-8" style={{ border: `1px dashed ${BORDER}`, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-[13px]" style={{ color: INK }}>
                Full feature matrix — all 7 vendors, {MATRIX_ROWS.length} rows
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.14em]"
                style={{ color: PLUM }}
              >
                {expanded ? "Collapse" : "Expand"}
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} style={{ display: "flex" }}>
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="overflow-x-auto px-3 pb-4">
                    <table
                      className="w-full"
                      style={{ borderCollapse: "collapse", minWidth: 900 }}
                    >
                      <thead>
                        <tr style={{ background: OFF }}>
                          <th
                            className="px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.14em]"
                            style={{ color: GRAY, fontWeight: 600 }}
                          >
                            Feature
                          </th>
                          <th className="px-3 py-2.5" style={{ background: LAV }}>
                            <Logo src={CLEARD.logo} name="Cleard" size={26} />
                          </th>
                          {allVendors.map((v) => (
                            <th key={v.name} className="px-3 py-2.5" title={v.name}>
                              <Logo src={v.logo} name={v.name} size={26} />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MATRIX_ROWS.map((r, ri) => (
                          <tr
                            key={r.feature}
                            style={{
                              background: ri % 2 ? "rgba(122,92,104,0.045)" : "transparent",
                            }}
                          >
                            <td className="px-3 py-2.5 text-[13px]" style={{ color: INK }}>
                              {r.feature}
                            </td>
                            <td
                              className="px-3 py-2.5 text-center"
                              style={{ background: "rgba(103,49,71,0.07)" }}
                            >
                              <Mark value={r.cleard} />
                            </td>
                            {r.cells.map((c, i) => (
                              <td key={i} className="px-3 py-2.5 text-center">
                                <Mark value={c} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* CTA bar */}
        <section style={{ background: INK }}>
          <div className="mx-auto flex max-w-4xl flex-col items-start gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <h2
              style={{
                color: "#FAF3E6",
                fontWeight: 800,
                fontSize: "clamp(1.35rem, 3vw, 1.9rem)",
                letterSpacing: "-0.03em",
              }}
            >
              One login covers all five.
            </h2>
            <Link
              to="/join"
              className="inline-flex items-center px-5 py-2.5 text-[13.5px] no-underline"
              style={{ background: LAV, color: PLUM, fontWeight: 700, borderRadius: 999 }}
            >
              Get early access
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
