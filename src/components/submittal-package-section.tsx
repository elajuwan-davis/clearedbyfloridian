// Displays the compliance-doc snapshot that traveled with a permit submittal
// (COI, WC, license, BTR, etc). Read from `intake_payload.compliance_submittal`.
// Also lets the GC re-attach the latest on-file version for a single doc when
// it's been updated mid-project — historic submissions keep their prior copy.

import { useEffect, useState } from "react";
import { Paperclip, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { PermitRow } from "@/lib/permits-api";
import { updatePermit } from "@/lib/permits-api";
import { loadGcCompliance } from "@/lib/gc-compliance";
import { refreshSnapshot, type SubmittalDocSnapshot } from "@/lib/submittal-package";

function fmtVersion(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso.slice(0, 10); }
}

export function SubmittalPackageSection({
  row,
  onChange,
}: {
  row: PermitRow;
  onChange: (r: PermitRow) => void;
}) {
  const ip = (row.intake_payload ?? {}) as Record<string, unknown>;
  const items = (ip.compliance_submittal ?? []) as SubmittalDocSnapshot[];
  const [current, setCurrent] = useState(() => loadGcCompliance());
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);

  useEffect(() => {
    const onDocs = () => setCurrent(loadGcCompliance());
    window.addEventListener("cleard:gc-compliance-updated", onDocs);
    window.addEventListener("storage", onDocs);
    return () => {
      window.removeEventListener("cleard:gc-compliance-updated", onDocs);
      window.removeEventListener("storage", onDocs);
    };
  }, []);

  if (!items || items.length === 0) {
    return (
      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
        <div className="flex items-center gap-2 mb-2">
          <Paperclip className="h-4 w-4 text-obsidian/60" />
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Submittal Package</div>
        </div>
        <p className="text-sm text-obsidian/55">
          No compliance documents were attached to this submittal. Attach COI, license, and BTR from the Municipality Readiness panel during intake.
        </p>
      </div>
    );
  }

  async function reattach(key: string) {
    const fresh = refreshSnapshot(key as any);
    if (!fresh) {
      toast.error("No current version on file. Upload the doc from Profile first.");
      return;
    }
    setRefreshingKey(key);
    try {
      const next = items.map((it) => (it.key === key ? fresh : it));
      const patch = { intake_payload: { ...(row.intake_payload as any ?? {}), compliance_submittal: next } };
      const updated = await updatePermit(row.id, patch);
      onChange(updated);
      toast.success(`Attached latest ${fresh.label} to this submittal.`);
    } catch (e) {
      toast.error("Re-attach failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRefreshingKey(null);
    }
  }

  return (
    <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-obsidian/60" />
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Submittal Package</div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
          {items.length} doc{items.length === 1 ? "" : "s"} attached
        </span>
      </div>
      <div className="text-[12px] text-obsidian/55 mb-3">
        Compliance documents that traveled with this permit submission. Prior versions are preserved — re-attach the latest to update only future submittals.
      </div>
      <ul className="divide-y divide-obsidian/10">
        {items.map((it) => {
          const currentRec = current.find((c) => c.key === it.key);
          const currentVersion = currentRec?.updatedAt ?? null;
          const isStale = currentVersion && currentVersion !== it.version && currentRec?.onFile;
          return (
            <li key={it.key} className="py-3 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span className="text-obsidian font-medium text-sm">{it.label}</span>
                  {it.fileName && (
                    <span className="text-obsidian/50 text-[12px] truncate max-w-[220px]">— {it.fileName}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono text-obsidian/55">
                  <span>v {fmtVersion(it.version)}</span>
                  <span>Attached {fmtVersion(it.capturedAt)}</span>
                  {it.expiration && <span>Expires {it.expiration}</span>}
                  {isStale && (
                    <span className="inline-flex items-center gap-1 border border-amber-500/40 bg-amber-50 text-amber-900 rounded-[3px] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                      Newer version on file
                    </span>
                  )}
                </div>
              </div>
              {isStale && (
                <button
                  type="button"
                  onClick={() => reattach(it.key)}
                  disabled={refreshingKey === it.key}
                  className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white text-obsidian rounded-[3px] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-obsidian/5 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshingKey === it.key ? "animate-spin" : ""}`} />
                  Re-attach latest
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
