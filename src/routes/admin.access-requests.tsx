import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
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
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/access-requests")({
  head: () => ({
    meta: [
      { title: "Access Requests · Admin — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccessRequestsPage,
});

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

function AccessRequestsPage() {
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
    <PortalShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <div className="label-eyebrow">Admin</div>
          <h1 className="display-serif text-4xl leading-tight mt-2">Access Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve GC applications to create their tenant and send an invite.
          </p>
        </div>

        {loading ? (
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="border rounded-[3px] p-8 text-center text-sm text-muted-foreground">
            No access requests yet.
          </div>
        ) : (
          <div className="border rounded-[3px] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Company / Contact</th>
                  <th className="px-4 py-3 font-medium">Email · Phone</th>
                  <th className="px-4 py-3 font-medium">License</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.company ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.email}</div>
                      <div className="text-xs text-muted-foreground">{r.phone ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.license_number ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-[2px]"
                        style={{
                          backgroundColor:
                            r.status === "approved"
                              ? "color-mix(in oklab, green 15%, transparent)"
                              : r.status === "rejected"
                                ? "color-mix(in oklab, red 15%, transparent)"
                                : "color-mix(in oklab, var(--obsidian) 8%, transparent)",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "new" || r.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => confirmReject(r)}
                            className="rounded-[3px] h-8 gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openApprove(r)}
                            className="rounded-[3px] h-8 gap-1"
                            style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <DialogContent className="rounded-[3px]">
          <DialogHeader>
            <DialogTitle>Approve access request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Creates a tenant and emails an invite to <strong>{approving?.email}</strong>.
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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
