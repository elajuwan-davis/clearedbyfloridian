// Invoices table — rendered as the "Invoices" tab of Billing & Invoices.
// Extracted from the former standalone /invoices page; logic unchanged.
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TableShell, EmptyState, StatusChip, StatTile } from "@/components/ui-kit";

type InvStatus = "paid" | "pending" | "overdue";
type Invoice = {
  number: string;
  status: InvStatus;
  address: string;
  description: string;
  amount_cents: number;
  issued: string;
};

const statusTone: Record<InvStatus, "success" | "warning" | "danger"> = {
  paid: "success",
  pending: "warning",
  overdue: "danger",
};

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function InvoicesView() {
  const [show, setShow] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("fees" as any)
        .select("id, invoice_number, status, description, amount_cents, address, created_at")
        .order("created_at", { ascending: false });
      if (cancelled || error || !data || data.length === 0) return;
      setInvoices(
        (data as any[]).map((r: Record<string, unknown>) => ({
          number: String(r.invoice_number ?? r.id),
          status: String(r.status ?? "pending") as InvStatus,
          address: String(r.address ?? ""),
          description: String(r.description ?? ""),
          amount_cents: Number(r.amount_cents ?? 0),
          issued: r.created_at ? new Date(String(r.created_at)).toLocaleDateString() : "",
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.amount_cents, 0);
    const pending = invoices
      .filter((i) => i.status === "pending")
      .reduce((s, i) => s + i.amount_cents, 0);
    const overdue = invoices
      .filter((i) => i.status === "overdue")
      .reduce((s, i) => s + i.amount_cents, 0);
    return { total, pending, overdue };
  }, [invoices]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          Permitting and admin fees, invoiced at submittal under FL 553.791.
        </p>
        <button type="button" onClick={() => setShow((s) => !s)} className="p-btn p-btn-ghost">
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {show ? "Hide amounts" : "Show amounts"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatTile label="Total Amount" value={show ? fmt(stats.total) : "•••••••"} />
        <StatTile label="Pending" value={show ? fmt(stats.pending) : "•••••••"} tone="warning" />
        <StatTile label="Overdue" value={show ? fmt(stats.overdue) : "•••••••"} tone="danger" />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
          title="No invoices on file."
          description="Invoices will appear here as they are issued."
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Status</th>
              <th>Address</th>
              <th className="text-right">Amount</th>
              <th className="w-[1%]" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const isOpen = open === inv.number;
              return (
                <>
                  <tr
                    key={inv.number}
                    className="cursor-pointer"
                    onClick={() => setOpen(isOpen ? null : inv.number)}
                  >
                    <td className="font-medium">{inv.number}</td>
                    <td>
                      <StatusChip tone={statusTone[inv.status]}>{inv.status}</StatusChip>
                    </td>
                    <td className="max-w-[280px] truncate text-muted-foreground">{inv.address}</td>
                    <td className="text-right tabular-nums">
                      {show ? fmt(inv.amount_cents) : "••••••"}
                    </td>
                    <td className="text-right text-muted-foreground">{isOpen ? "▲" : "▼"}</td>
                  </tr>
                  {isOpen && (
                    <tr key={`${inv.number}-detail`}>
                      <td colSpan={5} className="bg-[var(--p-card-2)]">
                        <div className="space-y-2 px-1 py-2">
                          <p className="text-[12.5px]">
                            {inv.description} — {inv.address}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Issued {inv.issued}</p>
                          <Button
                            variant={inv.status === "paid" ? "outline" : "default"}
                            className="gap-2"
                            disabled={inv.status === "paid"}
                          >
                            <FileText className="h-4 w-4" />
                            {inv.status === "paid"
                              ? "Paid — view receipt"
                              : inv.status === "overdue"
                                ? "Pay now (overdue)"
                                : "Pay invoice"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
