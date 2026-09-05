import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PageShell, StatusChip, EmptyState } from "@/components/ui-kit";
import { PROJECTS } from "@/lib/projects-data";
import {
  COMPLIANCE_SERVICES,
  createComplianceRequest,
  listComplianceRequests,
  type ComplianceRequest,
  type ComplianceService,
  type ComplianceRequestStatus,
} from "@/lib/compliance-requests";

export const Route = createFileRoute("/portal/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance — Cleard" },
      {
        name: "description",
        content: "Request statutory compliance filings for your permits — Cleard handles the rest.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompliancePage,
});

const statusTone: Record<ComplianceRequestStatus, "warning" | "info" | "success"> = {
  Pending: "warning",
  "In Progress": "info",
  Complete: "success",
};

function CompliancePage() {
  const [requests, setRequests] = useState<ComplianceRequest[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    setRequests(listComplianceRequests());
  }, []);

  const latestByService = useMemo(() => {
    const map = new Map<string, ComplianceRequest>();
    for (const r of requests) if (!map.has(r.service)) map.set(r.service, r);
    return map;
  }, [requests]);

  return (
    <PageShell
      title="Compliance"
      meta="Statutory filings handled by Cleard"
      crumbs={[{ label: "Documents", to: "/portal/documents" }, { label: "Compliance" }]}
    >
      <p className="mb-5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        Pick a service, tell us which project it is for, and submit. Our team prepares, files and
        tracks the document — you will see the status here.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {COMPLIANCE_SERVICES.map((service) => (
          <ServiceCard
            key={service.key}
            service={service}
            latest={latestByService.get(service.key)}
            open={openKey === service.key}
            onToggle={() => setOpenKey(openKey === service.key ? null : service.key)}
            onSubmitted={() => {
              setRequests(listComplianceRequests());
              setOpenKey(null);
            }}
          />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        My requests
      </h2>
      {requests.length === 0 ? (
        <div className="p-surface-flat">
          <EmptyState
            title="No requests yet"
            description="Request a service above and it will show up here with its status."
          />
        </div>
      ) : (
        <div className="p-surface-flat divide-y" style={{ borderColor: "var(--p-border)" }}>
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">
                  {COMPLIANCE_SERVICES.find((s) => s.key === r.service)?.title ?? r.service}
                </div>
                <div className="truncate text-[11.5px] text-muted-foreground">
                  {r.project_name}
                  {r.detail ? ` · ${r.detail}` : ""} ·{" "}
                  {new Date(r.submitted_at).toLocaleDateString()}
                </div>
              </div>
              <StatusChip tone={statusTone[r.status]}>{r.status}</StatusChip>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function ServiceCard({
  service,
  latest,
  open,
  onToggle,
  onSubmitted,
}: {
  service: ComplianceService;
  latest?: ComplianceRequest;
  open: boolean;
  onToggle: () => void;
  onSubmitted: () => void;
}) {
  const projects = PROJECTS;
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [detail, setDetail] = useState(service.field?.options?.[0] ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setSubmitting(true);
    createComplianceRequest({
      service: service.key,
      project_id: project.id,
      project_name: project.name,
      detail: service.field ? detail.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    setDone(true);
    setNotes("");
    onSubmitted();
    window.setTimeout(() => setDone(false), 6000);
  }

  return (
    <div className="p-surface-flat flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px] font-medium">{service.title}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            {service.description}
          </p>
        </div>
        {latest && <StatusChip tone={statusTone[latest.status]}>{latest.status}</StatusChip>}
      </div>

      {done ? (
        <div className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#2E7D32" }} />
          <span>Your request has been submitted. Cleard will handle the rest.</span>
        </div>
      ) : open ? (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Project
            </span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full border bg-transparent px-2.5 py-2 text-[13px]"
              style={{ borderColor: "var(--p-border)", borderRadius: 3 }}
              required
            >
              {projects.length === 0 && <option value="">No active permits</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.permit_no}
                </option>
              ))}
            </select>
          </label>

          {service.field && (
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {service.field.label}
              </span>
              {service.field.options ? (
                <select
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="mt-1 w-full border bg-transparent px-2.5 py-2 text-[13px]"
                  style={{ borderColor: "var(--p-border)", borderRadius: 3 }}
                  required
                >
                  {service.field.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder={service.field.placeholder}
                  className="mt-1 w-full border bg-transparent px-2.5 py-2 text-[13px]"
                  style={{ borderColor: "var(--p-border)", borderRadius: 3 }}
                  required
                />
              )}
            </label>
          )}

          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full border bg-transparent px-2.5 py-2 text-[13px]"
              style={{ borderColor: "var(--p-border)", borderRadius: 3 }}
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || !projectId}
              className="px-3 py-2 text-[12px] font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#9C6B3F", borderRadius: 3 }}
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="px-3 py-2 text-[12px] text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="mt-4 self-start px-3 py-2 text-[12px] font-medium text-white"
          style={{ backgroundColor: "#9C6B3F", borderRadius: 3 }}
        >
          Request
        </button>
      )}
    </div>
  );
}
