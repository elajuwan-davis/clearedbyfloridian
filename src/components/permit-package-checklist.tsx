import { CheckCircle2, Circle, FileText } from "lucide-react";

export type ChecklistDocStatus = "pending" | "generated";

export type ChecklistDoc = {
  key: string;
  label: string;
  description: string;
  status: ChecklistDocStatus;
  /** Shown next to the status pill once generated, e.g. "Ready for signature". */
  generatedNote?: string;
};

const STATUS_STYLES: Record<ChecklistDocStatus, string> = {
  pending: "bg-obsidian/10 text-obsidian/60",
  generated: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABEL: Record<ChecklistDocStatus, string> = {
  pending: "Pending",
  generated: "Generated",
};

/** Preview of the forms Dispatch's data will produce for this permit — shown
 *  once scope of work is selected, well before generation actually runs. */
export function PermitPackageChecklist({ items }: { items: ChecklistDoc[] }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white border border-obsidian/15 rounded-[3px] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-obsidian text-white">
        <FileText className="h-4 w-4" />
        <div className="font-mono text-[11px] uppercase tracking-[0.18em]">Forms to Be Created</div>
      </div>
      <div className="divide-y divide-obsidian/10">
        {items.map((doc) => (
          <div key={doc.key} className="flex items-start justify-between gap-4 px-5 py-3">
            <div className="flex items-start gap-3">
              {doc.status === "generated" ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 mt-0.5 text-obsidian/30 shrink-0" />
              )}
              <div>
                <div className="text-sm text-obsidian font-medium">{doc.label}</div>
                <div className="text-xs text-obsidian/55">{doc.description}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className={`inline-flex items-center rounded-[3px] px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] ${STATUS_STYLES[doc.status]}`}
              >
                {STATUS_LABEL[doc.status]}
              </span>
              {doc.status === "generated" && doc.generatedNote && (
                <span className="text-[10px] text-obsidian/45">{doc.generatedNote}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
