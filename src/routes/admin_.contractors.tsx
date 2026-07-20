import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ShieldCheck, ArrowLeft } from "lucide-react";
import { isInternalUser } from "@/lib/is-internal-user";
import {
  listContractors,
  addContractor,
  updateContractor,
  deleteContractor,
  subscribeContractors,
  LICENSE_TYPES,
  type Contractor,
} from "@/lib/contractors-store";

export const Route = createFileRoute("/admin_/contractors")({
  head: () => ({
    meta: [
      { title: "Admin · Contractors — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminContractorsPage,
});

function AdminContractorsPage() {
  const [items, setItems] = useState<Contractor[]>([]);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [creating, setCreating] = useState(false);
  const [internal, setInternal] = useState(false);

  useEffect(() => {
    setInternal(isInternalUser());
    setItems(listContractors());
    return subscribeContractors(() => setItems(listContractors()));
  }, []);

  if (!internal) {
    return (
      <PortalShell>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-obsidian/40" />
          <h1 className="display-serif mt-4 text-3xl text-obsidian">Staff Only</h1>
          <p className="mt-2 text-sm text-obsidian/60">
            Contractor registry is limited to Flōridian internal users.
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-[3px]">
            <Link to="/portal">Back to Portal</Link>
          </Button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8 lg:py-10">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Admin
        </Link>

        <div className="mt-4 border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Admin · Registry</div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display-serif text-4xl text-obsidian">
                Registered <em>Contractors</em>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-obsidian/60">
                Licensed firms available for NTBO & Owner Authorization form generation.
                Register a contractor once and reuse on any project.
              </p>
            </div>
            <Button variant="dark" className="rounded-[3px]" onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Contractor
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden border border-obsidian/15 bg-white">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--obsidian)" }}>
              <tr>
                <Th>Firm</Th>
                <Th>Contact</Th>
                <Th>License</Th>
                <Th>Email / Phone</Th>
                <Th>Status</Th>
                <Th align="right"> </Th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-obsidian/55">
                    No contractors registered yet.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="border-b border-obsidian/5 hover:bg-paper-warm/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-obsidian">{c.firm_name}</div>
                      <div className="mt-0.5 text-xs text-obsidian/55">{c.address}</div>
                    </td>
                    <td className="px-6 py-4 text-obsidian/85">{c.contact_name}</td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-obsidian">{c.license_number}</div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                        {c.license_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-obsidian/70">
                      <div>{c.email}</div>
                      <div>{c.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                          c.active
                            ? "border-emerald-600/40 bg-emerald-50 text-emerald-700"
                            : "border-obsidian/20 bg-paper-warm text-obsidian/55"
                        }`}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-[3px]"
                          onClick={() => setEditing(c)}
                        >
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-[3px] text-oxblood hover:text-oxblood"
                          onClick={() => {
                            if (confirm(`Delete ${c.firm_name}?`)) deleteContractor(c.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContractorFormDialog
        open={creating || editing !== null}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        contractor={editing}
      />
    </PortalShell>
  );
}

function ContractorFormDialog({
  open,
  onOpenChange,
  contractor,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contractor: Contractor | null;
}) {
  const [firm, setFirm] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState("");
  const [licenseType, setLicenseType] = useState<string>("CGC");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (contractor) {
      setFirm(contractor.firm_name);
      setContact(contractor.contact_name);
      setAddress(contractor.address);
      setPhone(contractor.phone);
      setEmail(contractor.email);
      setLicense(contractor.license_number);
      setLicenseType(contractor.license_type);
      setActive(contractor.active);
    } else {
      setFirm("");
      setContact("");
      setAddress("");
      setPhone("");
      setEmail("");
      setLicense("");
      setLicenseType("CGC");
      setActive(true);
    }
  }, [open, contractor]);

  function save() {
    const payload = {
      firm_name: firm.trim(),
      contact_name: contact.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      license_number: license.trim(),
      license_type: licenseType,
      active,
    };
    if (!payload.firm_name || !payload.license_number) return;
    if (contractor) updateContractor(contractor.id, payload);
    else addContractor(payload);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">
          {contractor ? "Edit Contractor" : "Register Contractor"}
        </DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          These details will appear in the NTBO and Owner Authorization dropdowns.
        </DialogDescription>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <F label="Firm Name" value={firm} onChange={setFirm} />
          <F label="Contact Name" value={contact} onChange={setContact} />
          <div className="sm:col-span-2">
            <F label="Address" value={address} onChange={setAddress} />
          </div>
          <F label="Phone" value={phone} onChange={setPhone} />
          <F label="Email" value={email} onChange={setEmail} />
          <F label="License Number" value={license} onChange={setLicense} mono />
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1 block">
              License Type
            </Label>
            <Select value={licenseType} onValueChange={setLicenseType}>
              <SelectTrigger className="rounded-[3px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-obsidian">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active — show in form dropdowns
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="dark" className="rounded-[3px]" onClick={save}>
            {contractor ? "Save changes" : "Register contractor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function F({
  label, value, onChange, mono,
}: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div>
      <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1 block">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-[3px] ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-6 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-paper ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
