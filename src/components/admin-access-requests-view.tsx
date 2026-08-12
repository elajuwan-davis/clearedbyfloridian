import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listAccessRequestsFn,
  approveAccessRequestFn,
  rejectAccessRequestFn,
} from "@/lib/tenants.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { TableShell, EmptyState, StatusChip } from "@/components/ui-kit";
import type { MetricTone } from "@/components/ui-kit";

type AccessRequest = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  license_number: string | null;
  status: string;
  notes: string | null;
  approved_tenant_id: string | null;
  service_areas?: string[];
  created_at: string;
};

const statusTone: Record<string, MetricTone> = {
  approved: "success",
  rejected: "danger",
  new: "neutral",
  pending: "warning",
};

/** Inbound access requests with approve (creates tenant + invite) / reject actions. */
export function AdminAccessRequestsView() {
  const list = useServerFn(listAccessRequestsFn);
  const approve = useServerFn(approveAccessRequestFn);
  const reject = useServerFn(rejectAccessRequestFn);
  const [rows, setRows] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<AccessRequest | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await list();
      setRows(data as AccessRequest[]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openApprove(r: AccessRequest) {
    setApproving(r);
    setTenantName(r.company ?? r.name);
    setLicenseNumber(r.license_number ?? "");
  }

  async function confirmApprove() {
    if (!approving) return;
    setBusy(true);
    try {
      const redirect =
        typeof window !== "undefined" ? `${window.location.origin}/onboarding` : undefined;
      const res = (await approve({
        data: {
          access_request_id: approving.id,
          tenant_name: tenantName.trim(),
          license_number: licenseNumber.trim() || null,
          invite_email: approving.email,
          redirect_to: redirect,
        },
      })) as { invite_token: string; email_sent: boolean; email_error: string | null };
      const link =
        typeof window !== "undefined"
          ? `${window.location.origin}/join/${res.invite_token}`
          : `/join/${res.invite_token}`;
      setInviteLink(link);
      if (res.email_sent) toast.success(`Invited ${approving.email}`);
      else toast.warning("Tenant created — email invite failed, share the link below instead.");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select and copy manually.");
    }
  }

  async function confirmReject(r: AccessRequest) {
    if (!confirm(`Reject request from ${r.email}?`)) return;
    try {
      await reject({ data: { access_request_id: r.id, notes: null } });
      toast.success("Request rejected");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      {loading ? (
        <div className="px-1 py-6 text-[12.5px] text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No access requests yet" />
      ) : (
        <>
          <div className="mb-2 text-[11.5px] text-muted-foreground">{rows.length} requests</div>
          <TableShell>
            <thead>
              <tr>
                <th>Company / Contact</th>
                <th>Email · Phone</th>
                <th>License</th>
                <th>Status</th>
                <th className="w-[1%]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium">{r.company ?? "—"}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">{r.name}</div>
                  </td>
                  <td className="min-w-0">
                    <div className="truncate text-[12.5px]">{r.email}</div>
                    <div className="text-[11.5px] text-muted-foreground">{r.phone ?? "—"}</div>
                  </td>
                  <td className="text-[12.5px] tabular-nums text-muted-foreground">{r.license_number ?? "—"}</td>
                  <td>
                    <StatusChip tone={statusTone[r.status] ?? "neutral"}>{r.status}</StatusChip>
                  </td>
                  <td className="text-right">
                    {r.status === "new" || r.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => confirmReject(r)} className="p-btn p-btn-ghost p-btn-sm">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button type="button" onClick={() => openApprove(r)} className="p-btn p-btn-primary p-btn-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11.5px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </>
      )}

      <Dialog
        open={!!approving}
        onOpenChange={(o) => {
          if (!o) {
            setApproving(null);
            setInviteLink(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent className="rounded-[3px]">
          <DialogHeader>
            <DialogTitle className="display-serif text-2xl text-obsidian">
              Approve access request
            </DialogTitle>
          </DialogHeader>
          {inviteLink ? (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                Tenant created for <strong>{approving?.email}</strong>. Share this join link — it works
                whether or not the invite email is delivered.
              </div>
              <div className="space-y-1.5">
                <Label className="label-eyebrow text-obsidian/50">Join link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={inviteLink} className="rounded-[3px] font-mono text-xs" />
                  <Button onClick={copyLink} className="rounded-[3px] gap-2 shrink-0" variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                Creates a tenant, generates a join link, and emails an invite to{" "}
                <strong>{approving?.email}</strong>.
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tname">Tenant / Company name</Label>
                <Input
                  id="tname"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="rounded-[3px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tlic">License number</Label>
                <Input
                  id="tlic"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="rounded-[3px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            {inviteLink ? (
              <Button
                onClick={() => {
                  setApproving(null);
                  setInviteLink(null);
                  setCopied(false);
                }}
                className="rounded-[3px]"
                style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
              >
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setApproving(null)} className="rounded-[3px]">
                  Cancel
                </Button>
                <Button
                  onClick={confirmApprove}
                  disabled={busy || !tenantName.trim()}
                  className="rounded-[3px] gap-2"
                  style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & invite"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
