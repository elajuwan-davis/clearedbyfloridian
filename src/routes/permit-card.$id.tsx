import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ShieldCheck } from "lucide-react";
import { getProjectById, fullAddress, type Project } from "@/lib/projects-data";
import { findPortalForAddress } from "@/lib/municipalities";
import { buildInspections, loadInspections, POOL_INSPECTIONS, type Inspection } from "@/lib/inspections";
import { supabase } from "@/integrations/supabase/client";

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

function PermitCardPage() {
  const { id } = Route.useParams();
  const initial = getProjectById(id);
  const [project, setProject] = useState<Project | null>(initial);
  const [resolved, setResolved] = useState<boolean>(Boolean(initial) || !id.startsWith("hs-"));
  useEffect(() => { if (!initial) { setProject(getProjectById(id)); setResolved(true); } }, [id, initial]);

  if (!resolved) return null;
  if (!project) throw notFound();
  return <PermitCard project={project} />;
}

function PermitCard({ project }: { project: Project }) {
  const portal = findPortalForAddress(`${project.address}, ${project.city}`);
  const [dispatch, setDispatch] = useState<{ owner_name: string | null; parcel_id: string | null; flood_zone: string | null } | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>(() => buildInspections(false));

  useEffect(() => {
    setInspections(loadInspections(project.id, buildInspections(false)));
    supabase
      .from("dispatch_results")
      .select("owner_name, parcel_id, flood_zone")
      .eq("permit_id", project.id)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setDispatch(data));
  }, [project.id]);

  const passed = inspections.filter((i) => i.status === "passed").length;
  const url = typeof window !== "undefined" ? window.location.href : `https://cleared.floridianinc.com/permit-card/${project.id}`;
  const issueDate = useMemo(() => project.submitted_at || new Date().toISOString().slice(0, 10), [project]);

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-obsidian print:bg-white">
      {/* Screen-only top bar */}
      <div className="print:hidden border-b border-obsidian/10 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-end">
          <button onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 border border-[#153157] bg-[#153157] text-white px-3 py-1.5 text-xs font-medium rounded-[3px] hover:opacity-90">
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-8 print:py-4">
        <article className="bg-white border-2 border-[#153157] rounded-[3px] print:border-black">
          {/* Header */}
          <header className="bg-[#153157] text-white px-8 py-6 print:bg-[#153157] print:text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#B6DAEA]">
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
            <Field label="Project" value={project.name} big />
            <Field label="Permit Number" value={project.permit_no || "— pending —"} mono big />
            <Field label="Job Site Address" value={fullAddress(project)} full />
            <Field label="Scope of Work" value={project.scope || "Pool, Spa & Hardscape"} />
            <Field label="Contractor of Record" value="Cleard" />
            <Field label="Florida License" value="CPC1459161" mono />
            <Field label="Issue Date" value={issueDate} mono />
            <Field label="Municipality" value={portal?.name ?? project.city} />
            {dispatch && (
              <>
                <Field label="Owner of Record" value={dispatch.owner_name ?? "—"} />
                <Field label="PCN" value={dispatch.parcel_id ?? "—"} mono />
                <Field label="Flood Zone" value={dispatch.flood_zone ?? "—"} mono />
              </>
            )}
          </section>

          {/* Inspections */}
          <section className="px-8 py-6">
            <div className="flex items-baseline justify-between">
              <h2 className="display-serif text-xl text-obsidian">Inspection Progress</h2>
              <div className="font-mono text-xs uppercase tracking-[0.12em] text-obsidian/70">
                {passed}/{inspections.length} passed
              </div>
            </div>
            <ol className="mt-4 divide-y divide-obsidian/10 border border-obsidian/15 rounded-[3px]">
              {inspections.map((i) => (
                <li key={i.code} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="font-mono text-[11px] w-10 text-obsidian/60">{i.code}</span>
                  <span className="flex-1 text-sm text-obsidian">{i.name}</span>
                  <StatusPill status={i.status} />
                </li>
              ))}
            </ol>
          </section>

          {/* Footer */}
          <footer className="bg-[#f5f2ec] px-8 py-4 border-t border-obsidian/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-obsidian/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              Scan the QR code to verify this permit &amp; view live inspection status.
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
              cleared.floridianinc.com
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

function Field({ label, value, mono, big, full }: {
  label: string; value: string; mono?: boolean; big?: boolean; full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">{label}</div>
      <div className={`${big ? "text-lg" : "text-sm"} ${mono ? "font-mono" : ""} text-obsidian mt-0.5`}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Inspection["status"] }) {
  const map: Record<Inspection["status"], { bg: string; text: string; label: string }> = {
    passed:       { bg: "bg-green-600",  text: "text-white", label: "Passed" },
    scheduled:    { bg: "bg-blue-600",   text: "text-white", label: "Scheduled" },
    corrections:  { bg: "bg-red-600",    text: "text-white", label: "Corrections" },
    pending:      { bg: "bg-obsidian/10",text: "text-obsidian/70", label: "Pending" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center rounded-[3px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${s.bg} ${s.text} print:border print:border-black`}>
      {s.label}
    </span>
  );
}
