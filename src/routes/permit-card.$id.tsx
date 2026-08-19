import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ShieldCheck } from "lucide-react";
import { findPortalForAddress } from "@/lib/municipalities";
import { labelFor, type InspectionResult } from "@/lib/inspections-api";

export const Route = createFileRoute("/permit-card/$id")({
  head: () => ({
    meta: [
      { title: "Digital Permit Card — Cleard" },
      { name: "description", content: "Public digital permit card with live inspection status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PermitCardPage,
});

/** The public-safe subset served by /api/public/permit-card/$id. */
type PublicPermit = {
  id: string;
  project_name: string;
  job_address: string;
  city: string | null;
  municipality: string | null;
  permit_type: string | null;
  permit_number: string | null;
  submitted_date: string | null;
  description: string | null;
  contractor_company: string | null;
  contractor_qualifier: string | null;
};

type PublicInspection = {
  id: string;
  inspection_type: string;
  result: InspectionResult | string | null;
  scheduled_date: string | null;
  requested_date: string | null;
};

function PermitCardPage() {
  const { id } = Route.useParams();
  const [permit, setPermit] = useState<PublicPermit | null>(null);
  const [inspections, setInspections] = useState<PublicInspection[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let alive = true;
    fetch(`/api/public/permit-card/${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!alive) return;
        if (!r.ok) {
          setState("missing");
          return;
        }
        const json = (await r.json()) as {
          permit: PublicPermit;
          inspections: PublicInspection[];
        };
        setPermit(json.permit);
        setInspections(json.inspections ?? []);
        setState("ready");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#faf3e6] px-6 py-24 text-center text-sm text-obsidian/60">
        Loading permit card…
      </div>
    );
  }

  if (state === "missing" || !permit) {
    return (
      <div className="min-h-screen bg-[#faf3e6] px-6 py-24 text-center">
        <h1 className="display-serif text-3xl text-obsidian">Permit card not found</h1>
        <p className="mt-2 text-sm text-obsidian/60">
          This card may have been removed, or the code was scanned incorrectly.
        </p>
      </div>
    );
  }

  return <PermitCard permit={permit} inspections={inspections} />;
}

function PermitCard({
  permit,
  inspections,
}: {
  permit: PublicPermit;
  inspections: PublicInspection[];
}) {
  const portal = findPortalForAddress(permit.job_address);
  const passed = inspections.filter((i) => i.result === "passed").length;
  const url =
    typeof window !== "undefined"
      ? window.location.href
      : `https://cleardinc.com/permit-card/${permit.id}`;

  return (
    <div className="min-h-screen bg-[#faf3e6] text-obsidian print:bg-white">
      {/* Screen-only top bar */}
      <div className="print:hidden border-b border-obsidian/10 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-end">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 border border-[#2F4F4F] bg-[#2F4F4F] text-white px-3 py-1.5 text-xs font-medium rounded-[3px] hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-8 print:py-4">
        <article className="bg-white border-2 border-[#2F4F4F] rounded-[3px] print:border-black">
          {/* Header */}
          <header className="bg-[#2F4F4F] text-white px-8 py-6 print:bg-[#2F4F4F] print:text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#E6E6FA]">
                  Cleard · Private Provider
                </div>
                <h1 className="mt-1 display-serif text-3xl">Digital Permit Card</h1>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/70">
                  FS §553.791 · Post at Job Site
                </div>
              </div>
              <div className="bg-white p-2 rounded-[3px]">
                <QRCodeSVG value={url} size={104} level="M" />
              </div>
            </div>
          </header>

          {/* Project block */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 py-6 border-b border-obsidian/15">
            <Field label="Project" value={permit.project_name} big />
            <Field label="Permit Number" value={permit.permit_number || "— pending —"} mono big />
            <Field label="Job Site Address" value={permit.job_address} full />
            <Field label="Scope of Work" value={permit.permit_type || permit.description || "—"} />
            <Field label="Contractor of Record" value={permit.contractor_company || "—"} />
            <Field label="Qualifier" value={permit.contractor_qualifier || "—"} />
            <Field label="Submitted" value={permit.submitted_date || "— pending —"} mono />
            <Field
              label="Municipality"
              value={permit.municipality || portal?.name || permit.city || "—"}
            />
          </section>

          {/* Inspections */}
          <section className="px-8 py-6">
            <div className="flex items-baseline justify-between">
              <h2 className="display-serif text-xl text-obsidian">Inspection Progress</h2>
              {inspections.length > 0 && (
                <div className="font-mono text-xs uppercase tracking-[0.12em] text-obsidian/70">
                  {passed}/{inspections.length} passed
                </div>
              )}
            </div>
            {inspections.length === 0 ? (
              <p className="mt-4 border border-obsidian/15 rounded-[3px] px-3 py-6 text-center text-sm text-obsidian/55">
                No inspections scheduled yet.
              </p>
            ) : (
              <ol className="mt-4 divide-y divide-obsidian/10 border border-obsidian/15 rounded-[3px]">
                {inspections.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex-1 text-sm text-obsidian">
                      {labelFor(i.inspection_type)}
                    </span>
                    {i.scheduled_date && (
                      <span className="font-mono text-[11px] text-obsidian/55">
                        {i.scheduled_date}
                      </span>
                    )}
                    <StatusPill result={i.result} scheduled={Boolean(i.scheduled_date)} />
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Footer */}
          <footer className="bg-[#faf3e6] px-8 py-4 border-t border-obsidian/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-obsidian/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              Scan the QR code to verify this permit &amp; view live inspection status.
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
              cleardinc.com
            </div>
          </footer>
        </article>
      </main>

      <style>{`
        @media print {
          @page { size: letter; margin: 0.4in; }
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  big,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  big?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
        {label}
      </div>
      <div
        className={`${big ? "text-lg" : "text-sm"} ${mono ? "font-mono" : ""} text-obsidian mt-0.5`}
      >
        {value}
      </div>
    </div>
  );
}

const RESULT_PILL: Record<string, { bg: string; text: string; label: string }> = {
  passed: { bg: "bg-green-600", text: "text-white", label: "Passed" },
  failed: { bg: "bg-red-600", text: "text-white", label: "Failed" },
  reinspect: { bg: "bg-amber-600", text: "text-white", label: "Reinspect" },
  cancelled: { bg: "bg-obsidian/40", text: "text-white", label: "Cancelled" },
};

function StatusPill({ result, scheduled }: { result: string | null; scheduled: boolean }) {
  const s =
    (result ? RESULT_PILL[result] : undefined) ??
    (scheduled
      ? { bg: "bg-blue-600", text: "text-white", label: "Scheduled" }
      : { bg: "bg-obsidian/10", text: "text-obsidian/70", label: "Pending" });
  return (
    <span
      className={`inline-flex items-center rounded-[3px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${s.bg} ${s.text} print:border print:border-black`}
    >
      {s.label}
    </span>
  );
}
