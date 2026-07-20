import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  loadSubLibrary,
  coiLifecycleStatus,
  daysUntilCoiExpiration,
  logCoiReminder,
  type SubRecord,
} from "@/lib/subcontractor-library";

function fmt(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function RenewalButton({ sub, onSent }: { sub: SubRecord; onSent: () => void }) {
  function send() {
    const dateStr = fmt(sub.coiExpiration);
    const subject = encodeURIComponent("Certificate of Insurance renewal — Flōridian");
    const body = encodeURIComponent(
      `Hi ${sub.contactFirstName || sub.companyName},\n\n` +
        `Your Certificate of Insurance on file with Flōridian expires on ${dateStr}. ` +
        `Please submit your updated COI at ${window.location.origin}/portal/subcontractors ` +
        `so we can keep you cleared for active projects.\n\n` +
        `Thank you,\nFlōridian`,
    );
    if (sub.email) {
      window.open(`mailto:${sub.email}?subject=${subject}&body=${body}`, "_blank");
    }
    logCoiReminder(sub.id);
    toast.success(`Renewal request sent to ${sub.companyName}`);
    onSent();
  }
  return (
    <button
      type="button"
      onClick={send}
      className="inline-flex items-center gap-1.5 border border-obsidian/25 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian hover:text-paper"
    >
      <Mail className="h-3 w-3" /> Send Renewal Request
    </button>
  );
}

function Row({
  sub,
  tone,
  onSent,
}: {
  sub: SubRecord;
  tone: "red" | "amber";
  onSent: () => void;
}) {
  const days = daysUntilCoiExpiration(sub);
  const chip =
    tone === "red"
      ? "border-red-600/40 bg-red-50 text-red-800"
      : "border-amber-600/40 bg-amber-50 text-amber-800";
  const label =
    tone === "red"
      ? days == null
        ? "Expired"
        : `Expired ${Math.abs(days)}d ago`
      : `Expires in ${days}d`;
  return (
    <div className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-t border-obsidian/10 first:border-t-0">
      <div className="col-span-12 sm:col-span-4">
        <div className="font-medium text-obsidian text-sm">{sub.companyName}</div>
        <div className="text-[11px] text-obsidian/60">{sub.trade || "—"}</div>
      </div>
      <div className="col-span-6 sm:col-span-3 text-[12px] text-obsidian/70">
        {fmt(sub.coiExpiration)}
      </div>
      <div className="col-span-6 sm:col-span-2">
        <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] rounded-[3px] ${chip}`}>
          {label}
        </span>
      </div>
      <div className="col-span-12 sm:col-span-3 sm:text-right">
        <RenewalButton sub={sub} onSent={onSent} />
        {sub.coiLastReminderSent && (
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-obsidian/50">
            <CheckCircle2 className="h-3 w-3" /> Last sent {fmt(sub.coiLastReminderSent)}
          </div>
        )}
      </div>
    </div>
  );
}

export function CoiAlertsWidget() {
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setSubs(loadSubLibrary());
  }, [tick]);

  const { expired, expiring } = useMemo(() => {
    const expired: SubRecord[] = [];
    const expiring: SubRecord[] = [];
    for (const s of subs) {
      const st = coiLifecycleStatus(s);
      if (st === "expired") expired.push(s);
      else if (st === "expiring_soon") expiring.push(s);
    }
    expired.sort((a, b) => (a.coiExpiration ?? "").localeCompare(b.coiExpiration ?? ""));
    expiring.sort((a, b) => (a.coiExpiration ?? "").localeCompare(b.coiExpiration ?? ""));
    return { expired, expiring };
  }, [subs]);

  if (expired.length === 0 && expiring.length === 0) return null;

  const refresh = () => setTick((t) => t + 1);

  return (
    <section className="border hairline rounded-[3px] bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b hairline">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-600" strokeWidth={1.75} />
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian">
            COI Alerts
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {expired.length} expired · {expiring.length} expiring
          </span>
        </div>
      </div>

      {expired.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-red-50/50 font-mono text-[10px] uppercase tracking-[0.14em] text-red-800">
            Expired ({expired.length})
          </div>
          {expired.map((s) => (
            <Row key={s.id} sub={s} tone="red" onSent={refresh} />
          ))}
        </div>
      )}

      {expiring.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-amber-50/60 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800 border-t border-obsidian/10">
            Expiring within 30 days ({expiring.length})
          </div>
          {expiring.map((s) => (
            <Row key={s.id} sub={s} tone="amber" onSent={refresh} />
          ))}
        </div>
      )}
    </section>
  );
}
