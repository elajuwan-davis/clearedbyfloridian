import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getNto, upsertNto, type NtoRow, type NtoStatus } from "@/lib/nto-api";
import { buildNtoPdfBytes, downloadPdf } from "@/lib/nto-pdf";
import { Download, Send, AlertTriangle, ScrollText } from "lucide-react";

type Props = {
  permitId: string;
  propertyAddress?: string | null;
  ownerName?: string | null;
  contractorCompany?: string | null;
};

export function NtoSection({ permitId, propertyAddress, ownerName, contractorCompany }: Props) {
  const [row, setRow] = useState<Partial<NtoRow> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getNto(permitId).then((r) => {
      if (r) setRow(r);
      else
        setRow({
          permit_id: permitId,
          property_address: propertyAddress ?? "",
          owner_name: ownerName ?? "",
          contractor_name: contractorCompany || "Flōridian LLC",
          contractor_address: "215 Clematis Street, West Palm Beach, FL 33401",
          status: "not_filed",
        });
    });
  }, [permitId, propertyAddress, ownerName, contractorCompany]);

  if (!row) return null;

  const status = (row.status ?? "not_filed") as NtoStatus;

  function set<K extends keyof NtoRow>(key: K, val: NtoRow[K]) {
    setRow((r) => ({ ...(r ?? {}), [key]: val }));
  }

  async function save(nextStatus?: NtoStatus) {
    setBusy(true);
    try {
      const saved = await upsertNto({
        permit_id: permitId,
        ...(row as Partial<NtoRow>),
        status: nextStatus ?? status,
      });
      setRow(saved);
      toast.success(nextStatus === "sent" ? "NTO marked as sent" : "NTO saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function generatePdf() {
    if (!row) return;
    try {
      const bytes = await buildNtoPdfBytes(row);
      const safe = String(propertyAddress || permitId).replace(/[^A-Za-z0-9._-]+/g, "-");
      downloadPdf(bytes, `NTO-${safe}.pdf`);
      if (status === "not_filed") await save("draft");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF failed");
    }
  }

  const showWarning = status === "not_filed" || status === "draft";

  return (
    <section className="border border-obsidian/10 bg-white rounded-[3px] p-6">
      <div className="flex items-center gap-3 mb-1">
        <ScrollText className="h-4 w-4 text-obsidian" />
        <h2 className="display-serif text-2xl text-obsidian">Notice to Owner</h2>
        <StatusBadge status={status} />
      </div>
      <p className="text-obsidian/60 text-sm mb-4">
        Florida Statute § 713.06 — protect lien rights by serving the property owner within 45 days of first work.
      </p>

      {showWarning && (
        <div className="mb-4 flex items-start gap-2 border border-amber-300 bg-amber-50 text-amber-900 rounded-[3px] px-3 py-2 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>NTO has not been served. File before work begins to preserve lien rights.</div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Property Address" value={row.property_address ?? ""} onChange={(v) => set("property_address", v)} />
        <TextField label="Owner Name" value={row.owner_name ?? ""} onChange={(v) => set("owner_name", v)} />
        <TextField label="Owner Address" value={row.owner_address ?? ""} onChange={(v) => set("owner_address", v)} />
        <TextField label="Owner Email" value={row.owner_email ?? ""} onChange={(v) => set("owner_email", v)} />
        <TextField label="Contractor Name" value={row.contractor_name ?? ""} onChange={(v) => set("contractor_name", v)} />
        <TextField label="Contractor Address" value={row.contractor_address ?? ""} onChange={(v) => set("contractor_address", v)} />
        <div className="sm:col-span-2">
          <TextField
            label="Description of Work"
            value={row.work_description ?? ""}
            onChange={(v) => set("work_description", v)}
            multiline
          />
        </div>
        <TextField
          label="Date of First Work / Materials"
          type="date"
          value={row.first_work_date ?? ""}
          onChange={(v) => set("first_work_date", v)}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => save()}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-obsidian text-paper px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] disabled:opacity-60"
        >
          Save Draft
        </button>
        <button
          onClick={generatePdf}
          className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
        >
          <Download className="h-3.5 w-3.5" /> Generate PDF
        </button>
        <button
          onClick={() => save("sent")}
          disabled={busy}
          className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
        >
          <Send className="h-3.5 w-3.5" /> Mark as Sent
        </button>
        <button
          onClick={() => save("confirmed")}
          disabled={busy}
          className="inline-flex items-center gap-2 border border-emerald-300 bg-emerald-50 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-800 rounded-[3px]"
        >
          Confirm Receipt
        </button>
      </div>
      <p className="mt-3 text-obsidian/45 text-xs">
        Certified mail is required for statutory service — print the PDF and send via USPS Certified Mail with return receipt.
      </p>
    </section>
  );
}

function StatusBadge({ status }: { status: NtoStatus }) {
  const cls: Record<NtoStatus, string> = {
    not_filed: "bg-obsidian/10 text-obsidian/60",
    draft: "bg-amber-100 text-amber-800",
    sent: "bg-sky-100 text-sky-800",
    confirmed: "bg-emerald-100 text-emerald-800",
  };
  const label: Record<NtoStatus, string> = {
    not_filed: "Not Filed",
    draft: "Draft",
    sent: "Sent",
    confirmed: "Confirmed",
  };
  return (
    <span className={`ml-2 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-[3px] ${cls[status]}`}>
      {label[status]}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-obsidian/55 mb-1">{label}</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-obsidian/15 focus:border-obsidian/40 outline-none px-3 py-2 rounded-[3px] text-sm text-obsidian bg-white"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-obsidian/15 focus:border-obsidian/40 outline-none px-3 py-2 rounded-[3px] text-sm text-obsidian bg-white"
        />
      )}
    </label>
  );
}
