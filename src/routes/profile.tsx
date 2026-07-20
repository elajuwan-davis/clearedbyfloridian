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
import { Upload, Plus, Trash2, FileText, CheckCircle2, AlertTriangle, CreditCard, ArrowRight, Users, Mail } from "lucide-react";
import { toast } from "sonner";
import { loadPaymentAuth, clearPaymentAuth, type PaymentAuthRecord } from "@/lib/payment-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const TEAM_MEMBERS: Array<{ name: string; email: string; role: string }> = [
  { name: "Elajuwan Davis", email: "elajuwan@floridianinc.com", role: "Owner" },
  { name: "Jose", email: "jose@floridianinc.com", role: "Admin" },
  { name: "Eman", email: "eman@floridianinc.com", role: "Admin" },
  { name: "Paul", email: "paul@floridianinc.com", role: "Admin" },
];

function ProfilePage() {
  const [displayName, setDisplayName] = useState("Elajuwan Davis");
  const [company, setCompany] = useState({
    name: "Flōridian",
    website: "https://floridianinc.com",
    phone: "(561) 555-0144",
    address: "",
  });
  const [language, setLanguage] = useState("en");
  const [emails, setEmails] = useState<string[]>(["team@floridianinc.com"]);
  const [newEmail, setNewEmail] = useState("");
  const [license] = useState({ number: "CPC1459161", type: "CPC (Certified Pool/Spa Contractor)", expires: "2027-08-31" });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [paymentAuth, setPaymentAuth] = useState<PaymentAuthRecord | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { setPaymentAuth(loadPaymentAuth()); }, []);

  function revokePaymentAuth() {
    clearPaymentAuth();
    setPaymentAuth(null);
    toast.success("Payment authorization revoked");
  }


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) return;
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("display_name, full_name, avatar_url, company_name, website, phone, address, language, notification_emails")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled || error || !data) return;
      const d = data as Record<string, unknown>;
      if (d.display_name || d.full_name) setDisplayName(String(d.display_name ?? d.full_name));
      if (d.avatar_url) setAvatar(String(d.avatar_url));
      setCompany((c) => ({
        name: String(d.company_name ?? c.name),
        website: String(d.website ?? c.website),
        phone: String(d.phone ?? c.phone),
        address: String(d.address ?? c.address),
      }));
      if (d.language) setLanguage(String(d.language));
      if (Array.isArray(d.notification_emails)) setEmails(d.notification_emails as string[]);
    })();
    return () => { cancelled = true; };
  }, []);

  function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  }

  function addEmail() {
    const v = newEmail.trim();
    if (!v || !v.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    if (emails.includes(v)) {
      toast.error("Email already on list");
      return;
    }
    setEmails((e) => [...e, v]);
    setNewEmail("");
  }

  function removeEmail(e: string) {
    setEmails((list) => list.filter((x) => x !== e));
  }

  async function saveProfile() {
    if (!userId) { toast.success("Profile saved (sign in to persist)"); return; }
    const { error } = await supabase.from("profiles" as any).update({
      display_name: displayName,
      avatar_url: avatar,
      company_name: company.name,
      website: company.website,
      phone: company.phone,
      address: company.address,
      language,
      notification_emails: emails,
    }).eq("id", userId);
    if (error) { toast.error("Save failed: " + error.message); return; }
    toast.success("Profile saved");
  }

  async function changePassword() {
    if (pwd.next.length < 8) return toast.error("Password must be 8+ characters");
    if (pwd.next !== pwd.confirm) return toast.error("Passwords do not match");
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) return toast.error(error.message);
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Password updated");
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
        {/* Header */}
        <div className="border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50">Account</div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Profile</h1>
        </div>

        {/* Avatar + display name */}
        <Section title="Identity" subtitle="How your firm appears throughout the portal.">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="shrink-0">
              <div
                className="h-24 w-24 grid place-items-center border border-obsidian/15 bg-paper-warm rounded-[3px] overflow-hidden"
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-3xl text-obsidian/60">
                    {displayName.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </span>
                )}
              </div>
              <label className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.12em] text-obsidian/65 cursor-pointer hover:text-obsidian">
                <Upload className="h-3 w-3" />
                Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
              </label>
            </div>
            <div className="flex-1 w-full space-y-4">
              <Field label="Display Name">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-[3px]" />
              </Field>
              <Button onClick={saveProfile} variant="dark" className="rounded-[3px]">Save</Button>
            </div>
          </div>
        </Section>

        {/* Company */}
        <Section title="Company Information" subtitle="Used on permit applications and invoices.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name">
              <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="Website">
              <Input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="Phone">
              <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="Address">
              <Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className="rounded-[3px]" />
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={saveProfile} variant="dark" className="rounded-[3px]">Save company info</Button>
          </div>
        </Section>

        {/* Language */}
        <Section title="Language Preference" subtitle="Affects portal UI text.">
          <div className="max-w-xs">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="rounded-[3px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        {/* Notification emails */}
        <Section
          title="Notification Email Addresses"
          subtitle="All listed addresses receive notifications when messages are posted."
        >
          <ul className="divide-y divide-obsidian/10 border border-obsidian/15 rounded-[3px] bg-white">
            {emails.map((e) => (
              <li key={e} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-obsidian truncate">{e}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(e)}
                  className="text-obsidian/40 hover:text-oxblood"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {emails.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-obsidian/45">No notification emails.</li>
            )}
          </ul>
          <div className="mt-4 flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@firm.com"
              className="rounded-[3px]"
              onKeyDown={(e) => e.key === "Enter" && addEmail()}
            />
            <Button onClick={addEmail} variant="dark" className="rounded-[3px] gap-1.5 shrink-0">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </Section>

        {/* License */}
        <Section title="License Management" subtitle="Florida DBPR license on file.">
          <div className="border border-obsidian/15 bg-white p-5 rounded-[3px]">
            <div className="grid gap-3 sm:grid-cols-3">
              <Meta label="Number" value={license.number} mono />
              <Meta label="Type" value={license.type} />
              <Meta label="Expires" value={license.expires} mono />
            </div>
            <label className="mt-5 inline-flex items-center gap-2 text-sm font-mono uppercase tracking-[0.12em] text-obsidian/65 cursor-pointer hover:text-obsidian">
              <FileText className="h-3.5 w-3.5" />
              Upload updated license
              <input type="file" accept=".pdf,image/*" className="hidden" onChange={() => toast.success("License uploaded")} />
            </label>
          </div>
        </Section>

        {/* Team Members */}
        <Section
          title="Team Members"
          subtitle="Everyone with access to your Cleared workspace."
        >
          <div className="border border-obsidian/15 bg-white rounded-[3px] divide-y divide-obsidian/10">
            {TEAM_MEMBERS.map((m) => (
              <div key={m.email} className="flex items-center gap-4 px-4 py-3">
                <div className="h-9 w-9 grid place-items-center rounded-[3px] bg-paper-warm border border-obsidian/10 shrink-0">
                  <span className="font-display text-sm text-obsidian/70">
                    {m.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-obsidian font-medium truncate">{m.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-obsidian/55 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    {m.email}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] rounded-[2px] ${
                    m.role === "Owner"
                      ? "bg-obsidian text-paper border-obsidian"
                      : "bg-paper-warm text-obsidian/70 border-obsidian/15"
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-obsidian/55">
            <Users className="h-3 w-3" />
            {TEAM_MEMBERS.length} members with access
          </p>
        </Section>

        {/* Payment Authorization */}
        <Section title="Payment Authorization" subtitle="Authorize Cleared by Flōridian to charge for services and permit fees.">
          {paymentAuth ? (
            <div
              className="border bg-white p-5 rounded-[3px]"
              style={{ borderColor: "color-mix(in oklab, var(--success, oklch(0.7 0.16 145)) 35%, transparent)" }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="h-5 w-5 mt-0.5 shrink-0"
                  strokeWidth={1.8}
                  style={{ color: "var(--success, oklch(0.55 0.16 145))" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-obsidian font-medium">On file</div>
                  <div className="mt-0.5 text-xs text-obsidian/55">
                    Authorized {new Date(paymentAuth.authorizedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
                <CreditCard className="h-4 w-4 text-obsidian/45 shrink-0" strokeWidth={1.5} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4 pt-5 border-t border-obsidian/10">
                <Meta label="Type" value={paymentAuth.cardType} />
                <Meta label="Brand" value={paymentAuth.brand} />
                <Meta label={paymentAuth.cardType === "ACH" ? "Account" : "Card"} value={`•••• ${paymentAuth.last4}`} mono />
                {paymentAuth.cardType !== "ACH" && <Meta label="Expires" value={paymentAuth.expiry} mono />}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-[3px]">
                  <Link to="/forms/payment-authorization">Update authorization</Link>
                </Button>
                <Button variant="outline" className="rounded-[3px] text-oxblood border-oxblood/40 hover:bg-oxblood/5" onClick={revokePaymentAuth}>
                  Revoke
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border bg-white p-5 rounded-[3px]"
              style={{ borderColor: "color-mix(in oklab, var(--amber, oklch(0.78 0.16 75)) 45%, transparent)" }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="h-5 w-5 mt-0.5 shrink-0"
                  strokeWidth={1.8}
                  style={{ color: "var(--amber, oklch(0.62 0.16 65))" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-obsidian font-medium">No payment authorization on file</div>
                  <p className="mt-1 text-xs text-obsidian/55 max-w-md">
                    A payment authorization is required before Cleared can disburse municipality permit fees on your behalf.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <Button asChild variant="dark" className="rounded-[3px] gap-2">
                  <Link to="/forms/payment-authorization">
                    Complete payment authorization <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Section>


        {/* Password */}
        <Section title="Change Password">
          <div className="grid gap-4 sm:grid-cols-3 max-w-2xl">
            <Field label="Current">
              <Input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="New">
              <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="Confirm">
              <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} className="rounded-[3px]" />
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={changePassword} variant="dark" className="rounded-[3px]">Update password</Button>
          </div>
        </Section>
      </div>
    </PortalShell>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="display-serif text-2xl text-obsidian">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-obsidian/55">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1">{label}</div>
      <div className={`text-sm text-obsidian ${mono ? "font-mono tabular-nums" : ""}`}>{value}</div>
    </div>
  );
}
