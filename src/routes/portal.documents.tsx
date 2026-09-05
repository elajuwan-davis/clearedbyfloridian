import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Download, FolderOpen, Search } from "lucide-react";
import { listPermits, type PermitDoc, type PermitRow } from "@/lib/permits-api";
import { useActiveTenantId } from "@/lib/view-mode-context";
import { getPermitFileUrl } from "@/lib/permit-storage";
import { PageShell, SearchInput } from "@/components/ui-kit";
import { BulkDocUpload } from "@/components/bulk-doc-upload";
import { PermitPicker } from "@/components/permit-picker";
import { CleardTitleBlock, isEngineeringDeliverable } from "@/components/cleard-title-block";
import { ChangeOfProviderFormDialog } from "@/components/change-of-provider-form-dialog";

import {
  CDS,
  CdsEmpty,
  Kpi,
  KpiBar,
  Reveal,
  SidePanel,
  SkeletonRows,
  Tag,
  toneForStatus,
} from "@/components/cds-kit";

export const Route = createFileRoute("/portal/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Cleard" },
      {
        name: "description",
        content: "Every plan set, survey, approval and compliance document across your permits.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DocumentsPage,
});

type DocEntry = PermitDoc & { permitId: string; projectName: string; jobAddress: string };

function extOf(d: DocEntry) {
  const name = d.filename ?? "";
  const ext = name.includes(".") ? name.split(".").pop()!.toUpperCase() : "DOC";
  return ext.slice(0, 4);
}

function tileColor(ext: string) {
  if (ext.startsWith("PDF")) return CDS.black;
  if (ext.startsWith("JPG") || ext.startsWith("PNG")) return CDS.blue;
  return CDS.gray;
}

function fmtSize(bytes?: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsPage() {
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<DocEntry | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bulkPermit, setBulkPermit] = useState<PermitRow | null>(null);
  const activeTenantId = useActiveTenantId();

  useEffect(() => {
    let alive = true;
    listPermits(activeTenantId)
      .then((rows) => alive && setPermits(rows))
      .catch(() => toast.error("Could not load documents"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [activeTenantId]);

  const docs = useMemo<DocEntry[]>(
    () =>
      permits.flatMap((p) =>
        (p.documents ?? []).map((d) => ({
          ...d,
          permitId: p.id,
          projectName: p.project_name,
          jobAddress: p.job_address,
        })),
      ),
    [permits],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) =>
      `${d.label} ${d.filename ?? ""} ${d.projectName} ${d.jobAddress}`.toLowerCase().includes(q),
    );
  }, [docs, query]);

  const stats = useMemo(
    () => ({
      total: docs.length,
      uploaded: docs.filter((d) => d.status === "uploaded").length,
      pending: docs.filter((d) => d.status === "pending" || d.status === "missing").length,
      recent: docs.filter(
        (d) =>
          d.uploaded_at && Date.now() - new Date(d.uploaded_at).getTime() < 1000 * 60 * 60 * 24 * 14,
      ).length,
    }),
    [docs],
  );

  async function download(d: DocEntry) {
    if (d.external_url) {
      window.open(d.external_url, "_blank", "noopener");
      return;
    }
    if (!d.path) {
      toast.error("No file stored for this document yet");
      return;
    }
    try {
      const url = await getPermitFileUrl(d.path);
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Could not open that file");
    }
  }

  return (
    <PageShell
      crumbs={[{ label: "Workspace" }, { label: "Documents" }]}
      title="Documents"
      meta={loading ? "Loading…" : `${docs.length} across ${permits.length} permits`}
      toolbar={
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search filename, label or project…"
          className="w-72"
        />
      }
    >
      <KpiBar>
        <Kpi label="Total documents" value={stats.total} />
        <Kpi label="Uploaded" value={stats.uploaded} tone="teal" />
        <Kpi label="Pending / missing" value={stats.pending} tone={stats.pending > 0 ? "red" : "gray"} />
        <Kpi label="Added last 14 days" value={stats.recent} tone="blue" />
      </KpiBar>

      <Reveal className="mb-4">
        <div style={{ background: CDS.white, border: `1px solid ${CDS.border}`, padding: 12 }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: CDS.grayLt,
                }}
              >
                Bulk upload
              </div>
              <div style={{ fontSize: 12.5, color: CDS.gray, marginTop: 2 }}>
                {bulkPermit
                  ? `Filing to ${bulkPermit.project_name}`
                  : "Choose the permit these documents belong to, then upload as many files as you need."}
              </div>
            </div>
            <button type="button" className="p-btn p-btn-ghost" onClick={() => setPickerOpen(true)}>
              <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
              {bulkPermit ? "Change permit" : "Select permit"}
            </button>
          </div>
          {bulkPermit && (
            <div className="mt-3">
              <BulkDocUpload
                permit={bulkPermit}
                onChange={(updated) => {
                  setBulkPermit(updated);
                  setPermits((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }}
              />
            </div>
          )}
        </div>
      </Reveal>

      {pickerOpen && (
        <PermitPicker
          permits={permits}
          title="File documents to"
          eyebrow="Bulk upload"
          onClose={() => setPickerOpen(false)}
          onPick={(p) => {
            setBulkPermit(p);
            setPickerOpen(false);
          }}
        />
      )}

      <Reveal>
        <div style={{ background: CDS.white, border: `1px solid ${CDS.border}` }}>
          {loading ? (
            <div style={{ padding: 16 }}>
              <SkeletonRows rows={7} />
            </div>
          ) : filtered.length === 0 ? (
            <CdsEmpty
              icon={docs.length === 0 ? <FolderOpen className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              title={docs.length === 0 ? "No documents yet" : "Nothing matches that search"}
              description="Plan sets, surveys, product approvals and compliance files appear here as soon as they are attached to a permit."
            />
          ) : (
            <ul>
              {filtered.map((d, i) => {
                const ext = extOf(d);
                return (
                  <li key={`${d.permitId}-${d.key}-${i}`}>
                    <button
                      type="button"
                      onClick={() => setPreview(d)}
                      className="flex w-full min-w-0 items-center gap-3 text-left transition-colors hover:bg-[#F6F6F6]"
                      style={{ borderBottom: `1px solid ${CDS.off2}`, padding: "10px 12px" }}
                    >
                      <span
                        className="grid shrink-0 place-items-center"
                        style={{
                          width: 30,
                          height: 30,
                          background: tileColor(ext),
                          color: CDS.white,
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        {ext}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate"
                          style={{ fontSize: 13, fontWeight: 500, color: CDS.black }}
                        >
                          {d.filename ?? d.label}
                        </span>
                        <span className="block truncate" style={{ fontSize: 11.5, color: CDS.gray }}>
                          {d.label} · {d.projectName}
                        </span>
                      </span>
                      <span
                        className="hidden shrink-0 tabular-nums sm:block"
                        style={{ fontSize: 11.5, color: CDS.grayLt, width: 88 }}
                      >
                        {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : "—"}
                      </span>
                      <span
                        className="hidden shrink-0 tabular-nums md:block"
                        style={{ fontSize: 11.5, color: CDS.grayLt, width: 64 }}
                      >
                        {fmtSize(d.size)}
                      </span>
                      <Tag tone={toneForStatus(d.status === "uploaded" ? "verified" : d.status)}>
                        {d.status.replace("_", " ")}
                      </Tag>
                      <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} style={{ color: CDS.grayLt }} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Reveal>

      <SidePanel
        open={preview !== null}
        title={preview?.filename ?? preview?.label ?? ""}
        meta={preview ? `${preview.label} · ${preview.projectName}` : undefined}
        onClose={() => setPreview(null)}
        footer={
          preview ? (
            <>
              <Link to="/portal/permits/$id" params={{ id: preview.permitId }} className="p-btn p-btn-ghost">
                Open permit
              </Link>
              <button type="button" className="p-btn p-btn-primary" onClick={() => download(preview)}>
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Download
              </button>
            </>
          ) : undefined
        }
      >
        {preview && (
          <div className="space-y-3">
            {isEngineeringDeliverable(preview.label) && (
              <CleardTitleBlock
                projectName={preview.projectName}
                projectAddress={preview.jobAddress}
                documentType={preview.label}
                documentDate={
                  preview.uploaded_at ? new Date(preview.uploaded_at).toLocaleDateString() : ""
                }
                jobNo={preview.permitId}
                className="mb-4"
              />
            )}

            <Field label="Status">
              <Tag tone={toneForStatus(preview.status === "uploaded" ? "verified" : preview.status)}>
                {preview.status.replace("_", " ")}
              </Tag>
            </Field>
            <Field label="Project">{preview.projectName}</Field>
            <Field label="Address">{preview.jobAddress || "—"}</Field>
            <Field label="Required">{preview.required ? "Yes" : "Optional"}</Field>
            <Field label="Size">{fmtSize(preview.size)}</Field>
            <Field label="Uploaded">
              {preview.uploaded_at ? new Date(preview.uploaded_at).toLocaleString() : "—"}
            </Field>
            <Field label="Source">{preview.source ?? "—"}</Field>
            <p style={{ fontSize: 12, color: CDS.grayLt }}>
              <FileText className="mr-1 inline h-3 w-3" strokeWidth={1.75} />
              Files open in a new tab through a short-lived secure link.
            </p>
          </div>
        )}
      </SidePanel>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: CDS.grayLt,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: CDS.black, marginTop: 2 }}>{children}</div>
    </div>
  );
}
