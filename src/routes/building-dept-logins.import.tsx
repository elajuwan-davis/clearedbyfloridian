// Admin-only bulk import of the Building Department Login sheet.
// Paste the sheet, preview (nothing is written), then apply. Credentials are encrypted
// server-side and never come back to this page — the table below is city/status only.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PortalShell } from "@/components/portal-shell";
import { PageShell, Panel, StatusChip } from "@/components/ui-kit";
import { useSession } from "@/lib/use-session";
import { toast } from "sonner";
import { friendlyServerError } from "@/lib/server-fn-error";
import { ArrowLeft, Loader2, ShieldCheck, Upload } from "lucide-react";
import {
  importPortalLogins,
  listInternalOwners,
  type ImportSummary,
  type InternalOwner,
} from "@/lib/portal-logins-import.functions";

export const Route = createFileRoute("/building-dept-logins/import")({
  head: () => ({
    meta: [{ title: "Import Logins — Cleard" }, { name: "robots", content: "noindex" }],
  }),
  component: ImportLoginsPage,
});

function ImportLoginsPage() {
  const session = useSession();
  const listOwners = useServerFn(listInternalOwners);
  const runImport = useServerFn(importPortalLogins);

  const [owners, setOwners] = useState<InternalOwner[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [sheet, setSheet] = useState("");
  const [allowUnmatched, setAllowUnmatched] = useState(false);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  /** The exact text the preview was produced from — apply is only offered for that text. */
  const [previewedSheet, setPreviewedSheet] = useState<string | null>(null);

  useEffect(() => {
    if (!session.isAdmin) return;
    void listOwners({})
      .then((list) => {
        setOwners(list);
        setOwnerId((prev) => prev || (list[0]?.user_id ?? ""));
      })
      .catch((e: unknown) =>
        toast.error(friendlyServerError(e, "Failed to load Cleard accounts")),
      );
  }, [session.isAdmin, listOwners]);

  const run = useCallback(
    async (apply: boolean) => {
      if (!ownerId) return toast.error("Pick the Cleard account these logins belong to");
      if (!sheet.trim()) return toast.error("Paste the sheet first");
      setBusy(apply ? "apply" : "preview");
      try {
        const summary = await runImport({
          data: {
            sheet,
            owner_user_id: ownerId,
            tenant_id: tenantId.trim() || null,
            allow_unmatched: allowUnmatched,
            apply,
          },
        });
        setResult(summary);
        if (!apply) setPreviewedSheet(sheet);
        toast.success(
          apply
            ? `Imported ${summary.written} encrypted login${summary.written === 1 ? "" : "s"}`
            : `${summary.counts.import} row(s) ready to import — nothing written yet`,
        );
      } catch (e) {
        toast.error(friendlyServerError(e, "Import failed"));
      } finally {
        setBusy(null);
      }
    },
    [allowUnmatched, ownerId, runImport, sheet, tenantId],
  );

  if (!session.loading && !session.isAdmin) {
    return (
      <PortalShell>
        <PageShell
          crumbs={[{ label: "Workspace" }, { label: "Building Dept Logins" }]}
          title="Import logins"
        >
          <Panel>
            <p className="text-[12.5px] text-muted-foreground">
              This importer is limited to Cleard staff.
            </p>
          </Panel>
        </PageShell>
      </PortalShell>
    );
  }

  const canApply = previewedSheet === sheet && (result?.counts.import ?? 0) > 0;

  return (
    <PortalShell>
      <PageShell
        crumbs={[
          { label: "Workspace" },
          { label: "Building Dept Logins", to: "/building-dept-logins" },
          { label: "Import" },
        ]}
        title="Import logins from a spreadsheet"
        meta="Paste the sheet, preview, then import. Credentials are encrypted on the server."
        actions={
          <Link to="/building-dept-logins" className="p-btn">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} /> Back to vault
          </Link>
        }
      >
        <div className="grid gap-4">
          <Panel>
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Cleard account these logins belong to
                </label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="h-9 rounded-full border border-border bg-background px-3 text-[12.5px]"
                >
                  {owners.length === 0 && <option value="">No internal accounts found</option>}
                  {owners.map((o) => (
                    <option key={o.user_id} value={o.user_id}>
                      {o.email}
                    </option>
                  ))}
                </select>
                <p className="text-[11.5px] text-muted-foreground">
                  Only Cleard accounts are listed — a customer GC's logins have to be entered by the
                  customer, and the import refuses to file under their account.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Sheet (CSV, or paste straight out of Excel)
                </label>
                <textarea
                  value={sheet}
                  onChange={(e) => setSheet(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  placeholder={
                    "City,Username,Password,,,Verified,Notes,URL\nPlantation,…,…,,,yes,,https://…"
                  }
                  className="rounded-[10px] border border-border bg-background p-3 font-mono text-[11.5px] leading-relaxed"
                />
                <p className="text-[11.5px] text-muted-foreground">
                  Columns follow the Building Department Login workbook: city, username, password,
                  then the verified flag and notes/URL columns.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={allowUnmatched}
                    onChange={(e) => setAllowUnmatched(e.target.checked)}
                  />
                  Import cities that aren't in the municipality catalog
                </label>
                <input
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="Tenant ID (only if asked for one)"
                  className="h-9 min-w-[18rem] flex-1 rounded-full border border-border bg-background px-3 text-[12.5px]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="p-btn"
                  disabled={busy !== null}
                  onClick={() => void run(false)}
                >
                  {busy === "preview" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  Preview (writes nothing)
                </button>
                <button
                  type="button"
                  className="p-btn p-btn-primary"
                  disabled={busy !== null || !canApply}
                  onClick={() => void run(true)}
                >
                  {busy === "apply" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  Import {result && canApply ? `${result.counts.import} login(s)` : ""}
                </button>
                {!canApply && (
                  <span className="text-[11.5px] text-muted-foreground">
                    Preview the pasted sheet first — import unlocks once there is something to
                    write.
                  </span>
                )}
              </div>
            </div>
          </Panel>

          {result && (
            <Panel padded={false}>
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5 text-[12px]">
                <span className="font-medium">
                  {result.applied
                    ? `Imported ${result.written} login(s) under ${result.owner_email}`
                    : `Preview for ${result.owner_email} — nothing written`}
                </span>
                <span className="text-muted-foreground">
                  {result.counts.import} import · {result.counts.skip} skip · {result.counts.error}{" "}
                  error
                </span>
              </div>
              <div className="divide-y divide-border">
                {result.rows.map((r) => (
                  <div
                    key={`${r.line}:${r.city}`}
                    className="grid grid-cols-[3rem_minmax(0,12rem)_6rem_minmax(0,1fr)] items-center gap-3 px-3 py-2 text-[12px]"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground">{r.line}</span>
                    <span className="truncate">{r.city}</span>
                    <StatusChip
                      tone={
                        r.status === "import"
                          ? "emerald"
                          : r.status === "skip"
                            ? "neutral"
                            : "oxblood"
                      }
                    >
                      {r.status}
                    </StatusChip>
                    <span className="text-muted-foreground">{r.reason}</span>
                  </div>
                ))}
              </div>
              {result.applied && (
                <div className="border-t border-border px-3 py-2.5 text-[11.5px] text-muted-foreground">
                  Stored encrypted (AES-256-GCM). Check them on{" "}
                  <Link to="/building-dept-logins" className="underline underline-offset-2">
                    the vault
                  </Link>
                  , then delete your local copy of the workbook — it holds live portal passwords.
                </div>
              )}
            </Panel>
          )}
        </div>
      </PageShell>
    </PortalShell>
  );
}
