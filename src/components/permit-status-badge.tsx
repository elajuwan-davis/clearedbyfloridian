// Legacy label-based status badge (previously exported from the portal overview route).
export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    "Approved": "bg-emerald-100 text-emerald-900 border-emerald-200",
    "Plan Review": "bg-sky-100 text-sky-900 border-sky-200",
    "Revisions Required": "bg-amber-100 text-amber-900 border-amber-200",
    "Inspections": "bg-sky-50 text-sky-800 border-sky-200",
    "Intake": "bg-secondary text-foreground border-border",
    "Closed": "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center border rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        tone[status] ?? "bg-secondary text-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
}
