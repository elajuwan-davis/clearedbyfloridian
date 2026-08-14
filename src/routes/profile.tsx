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
import { Upload, Plus, Trash2, FileText, CheckCircle2, AlertTriangle, CreditCard, ArrowRight, Users, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  isPaymentAuthSigned,
  loadPaymentAuth,
  revokePaymentAuth as revokePaymentAuthRow,
  type PaymentAuthRecord,
} from "@/lib/payment-auth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationPrefsSection } from "@/components/notification-prefs-section";
import { useServerFn } from "@tanstack/react-start";
import { inviteTeamMemberFn, listMyTeamFn, removeTeamMemberFn, getMyTenantOnboardingFn, setTenantAllowedDomainFn, createInviteTokenFn, revokeInviteTokenFn } from "@/lib/tenants.functions";
import { useSession } from "@/lib/use-session";
import { nameFromEmail } from "@/lib/profile-api";
import {
  PAA_EVT,
  acceptTos,
  isPaaSigned,
  loadPaa,
  loadTosAccepted,
  type PaaRecord,
} from "@/lib/paa";
import { PaaSignedCard } from "@/components/paa-sign-dialog";
import { PageShell, Panel, KV, StatusChip } from "@/components/ui-kit";



export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

type TeamMember = { user_id: string; email: string; role: string };

function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [company, setCompany] = useState({
    name: "",
    website: "",
    phone: "",
    address: "",
  });
  const [language, setLanguage] = useState("en");
  const [emails, setEmails] = useState<string[]>([]);

  const [newEmail, setNewEmail] = useState("");
  const [license] = useState({ number: "CPC1459161", type: "CPC (Certified Pool/Spa Contractor)", expires: "2027-08-31" });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [paymentAuth, setPaymentAuth] = useState<PaymentAuthRecord | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { void loadPaymentAuth().then(setPaymentAuth); }, []);

  async function revokePaymentAuth() {
    if (!paymentAuth) return;
    try {
      await revokePaymentAuthRow(paymentAuth.id);
      setPaymentAuth(null);
      toast.success("Payment authorization revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      const mail = auth?.user?.email ?? null;
      if (cancelled) return;
      setUserId(uid);
      setEmail(mail);
      // Sensible per-user defaults before anything is saved.
      setDisplayName(nameFromEmail(mail));
      if (mail) setEmails([mail]);
      if (!uid) return;
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("display_name, full_name, avatar_url, company_name, website, phone, address, language, notification_emails")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled || error || !data) return;
      const d = data as unknown as Record<string, unknown>;
      if (d.display_name || d.full_name) setDisplayName(String(d.display_name ?? d.full_name));
      if (d.avatar_url) setAvatar(String(d.avatar_url));
      setCompany((c) => ({
        name: String(d.company_name ?? c.name),
        website: String(d.website ?? c.website),
        phone: String(d.phone ?? c.phone),
        address: String(d.address ?? c.address),
      }));
      if (d.language) setLanguage(String(d.language));
      if (Array.isArray(d.notification_emails) && (d.notification_emails as string[]).length > 0) {
        setEmails(d.notification_emails as string[]);
      }
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
    const { error } = await (supabase.from("profiles" as any) as any).upsert({
      id: userId,
      display_name: displayName,
      avatar_url: avatar,
      company_name: company.name,
      website: company.website,
      phone: company.phone,
      address: company.address,
      language,
      notification_emails: emails,
    }, { onConflict: "id" });

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
      <PageShell
        crumbs={[{ label: "Account" }, { label: "Profile" }]}
        title="Profile"
        meta={email ?? undefined}
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-2 items-start">
          {/* Left column */}
          <div className="min-w-0 space-y-4">
            <Panel title="Identity" meta="How your firm appears throughout the portal.">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="shrink-0">
                  <div className="h-16 w-16 grid place-items-center overflow-hidden rounded-md bg-[var(--p-card-2)]">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">
                        {displayName.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                    <Upload className="h-3 w-3" />
                    Upload photo
                    <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                  </label>
                </div>
                <div className="flex-1 w-full space-y-3">
                  <Field label="Display Name">
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </Field>
                  <Field label="Sign-in Email">
                    <Input value={email ?? ""} readOnly disabled />
                  </Field>
                  <button type="button" className="p-btn p-btn-primary" onClick={saveProfile}>Save</button>
                </div>
              </div>
            </Panel>

            <Panel title="Company Information" meta="Used on permit applications and invoices.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Company Name">
                  <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                </Field>
                <Field label="Website">
                  <Input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
                </Field>
                <Field label="Address">
                  <Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
                </Field>
              </div>
              <div className="mt-3">
                <button type="button" className="p-btn p-btn-primary" onClick={saveProfile}>Save company info</button>
              </div>
            </Panel>

            <Panel title="Language Preference" meta="Affects portal UI text.">
              <div className="max-w-xs">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Panel>

            <Panel title="Notification Email Addresses" meta="All listed addresses receive notifications.">
              <ul className="divide-y divide-[var(--p-border)] p-surface-flat">
                {emails.map((e) => (
                  <li key={e} className="flex items-center justify-between px-3 py-2">
                    <span className="text-[12.5px] truncate">{e}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(e)}
                      className="text-muted-foreground hover:text-[var(--p-danger)]"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {emails.length === 0 && (
                  <li className="px-3 py-4 text-center text-[12.5px] text-muted-foreground">No notification emails.</li>
                )}
              </ul>
              <div className="mt-3 flex gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@firm.com"
                  onKeyDown={(e) => e.key === "Enter" && addEmail()}
                />
                <button type="button" className="p-btn p-btn-primary shrink-0" onClick={addEmail}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            </Panel>

            <Panel title="Change Password">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Current">
                  <Input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
                </Field>
                <Field label="New">
                  <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
                </Field>
                <Field label="Confirm">
                  <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
                </Field>
              </div>
              <div className="mt-3">
                <button type="button" className="p-btn p-btn-primary" onClick={changePassword}>Update password</button>
              </div>
            </Panel>
          </div>

          {/* Right column */}
          <div className="min-w-0 space-y-4">
            <Panel title="License Management" meta="Florida DBPR license on file.">
              <div className="grid gap-3 sm:grid-cols-3">
                <KV label="Number">{license.number}</KV>
                <KV label="Type">{license.type}</KV>
                <KV label="Expires">{license.expires}</KV>
              </div>
              <label className="mt-4 inline-flex items-center gap-2 text-[11.5px] text-muted-foreground cursor-pointer hover:text-foreground">
                <FileText className="h-3.5 w-3.5" />
                Upload updated license
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={() => toast.success("License uploaded")} />
              </label>
            </Panel>

            <TeamMembersSection />
            <TeamOnboardingSection />

            <Panel title="Payment Authorization" meta="Authorize Cleard to charge for services and permit fees.">
              {paymentAuth && isPaymentAuthSigned(paymentAuth) ? (
                <div className="p-surface-flat p-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-[var(--p-success)]" strokeWidth={1.8} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium">On file · SignWell confirmed</div>
                      <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {paymentAuth.completedAt
                          ? `Authorized ${new Date(paymentAuth.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`
                          : "Authorized"}
                      </div>
                    </div>
                    <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4 pt-3 border-t border-[var(--p-border)]">
                    <KV label="Account holder">{paymentAuth.accountHolder}</KV>
                    <KV label="Billing address">{paymentAuth.billingAddress}</KV>
                    <KV label="Terms">{paymentAuth.termsVersion}</KV>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/forms/payment-authorization" className="p-btn p-btn-ghost">
                      Update authorization
                    </Link>
                    <button type="button" className="p-btn p-btn-ghost text-[var(--p-danger)]" onClick={() => void revokePaymentAuth()}>
                      Revoke
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-surface-flat p-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-[var(--p-warning)]" strokeWidth={1.8} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium">No payment authorization on file</div>
                      <p className="mt-1 text-[11.5px] text-muted-foreground max-w-md">
                        A payment authorization is required before Cleard can disburse municipality permit fees on your behalf.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link to="/forms/payment-authorization" className="p-btn p-btn-primary">
                      Complete payment authorization <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Legal" meta="Signed authorizations and platform agreements on file.">
              <LegalSectionBody />
            </Panel>

            <NotificationPrefsSection />
          </div>
        </div>
      </PageShell>
    </PortalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-[10.5px] uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function TeamMembersSection() {
  const session = useSession();
  const list = useServerFn(listMyTeamFn);
  const invite = useServerFn(inviteTeamMemberFn);
  const remove = useServerFn(removeTeamMemberFn);
  const [rows, setRows] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const canInvite = session.role === "gc_owner" || session.role === "admin";

  async function refresh() {
    setLoading(true);
    try {
      const data = await list();
      setRows(data as TeamMember[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session.loading && session.userId) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.loading, session.userId]);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await invite({ data: { email: email.trim(), redirect_to: `${window.location.origin}/onboarding` } });
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setSending(false);
    }
  }

  async function onRemove(user_id: string, memberEmail: string) {
    if (!confirm(`Remove ${memberEmail} from the team?`)) return;
    try {
      await remove({ data: { user_id } });
      toast.success("Removed");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  }

  return (
    <Panel title="Team Members" meta={`${rows.length} with access`}>
      <div className="p-surface-flat divide-y divide-[var(--p-border)]">
        {loading && (
          <div className="px-3 py-4 text-[12.5px] text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="px-3 py-4 text-[12.5px] text-muted-foreground">No team members yet.</div>
        )}
        {!loading && rows.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 grid place-items-center rounded-md bg-[var(--p-card-2)] shrink-0">
              <span className="text-[11px] font-semibold text-muted-foreground">{(m.email || "?").slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium truncate flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {m.email}
              </div>
            </div>
            <StatusChip tone={m.role === "gc_owner" ? "dark" : "neutral"}>
              {m.role === "gc_owner" ? "Owner" : m.role === "gc_member" ? "Member" : m.role}
            </StatusChip>
            {canInvite && m.user_id !== session.userId && m.role !== "gc_owner" && (
              <button onClick={() => onRemove(m.user_id, m.email)} className="text-muted-foreground hover:text-[var(--p-danger)]" title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Users className="h-3 w-3" />
        {rows.length} {rows.length === 1 ? "member" : "members"} with access
      </p>

      {canInvite && (
        <form onSubmit={onInvite} className="mt-3 flex items-stretch gap-2 flex-wrap">
          <input
            type="email"
            required
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-inset flex-1 min-w-[220px] px-2.5 text-[12.5px]"
          />
          <button
            type="submit"
            disabled={sending}
            className="p-btn p-btn-primary disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {sending ? "Sending…" : "Invite Member"}
          </button>
        </form>
      )}
    </Panel>
  );
}

function TeamOnboardingSection() {
  const session = useSession();
  const getOnb = useServerFn(getMyTenantOnboardingFn);
  const setDomain = useServerFn(setTenantAllowedDomainFn);
  const createInvite = useServerFn(createInviteTokenFn);
  const revokeInvite = useServerFn(revokeInviteTokenFn);
  const [state, setState] = useState<Awaited<ReturnType<typeof getOnb>> | null>(null);
  const [domain, setDomainInput] = useState("");
  const [busy, setBusy] = useState(false);

  const canManage = session.role === "gc_owner" || session.role === "admin";

  async function refresh() {
    try {
      const d = await getOnb();
      setState(d);
      setDomainInput(d?.tenant?.allowed_domain ?? "");
    } catch (e) { console.error(e); }
  }
  useEffect(() => {
    if (!session.loading && session.userId && canManage) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.loading, session.userId, canManage]);

  if (!canManage) return null;

  async function saveDomain() {
    setBusy(true);
    try {
      await setDomain({ data: { allowed_domain: domain.trim() || null } });
      toast.success("Domain saved. New signups with this email domain auto-join your team.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally { setBusy(false); }
  }
  async function makeLink() {
    setBusy(true);
    try {
      await createInvite();
      toast.success("Invite link created");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally { setBusy(false); }
  }
  async function revoke(id: string) {
    if (!confirm("Revoke this invite link?")) return;
    try {
      await revokeInvite({ data: { id } });
      toast.success("Revoked");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Revoke failed");
    }
  }
  function joinUrl(token: string) {
    return `${window.location.origin}/join/${token}`;
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  }

  return (
    <Panel title="Team Access" meta="Two ways to bring your team onto Cleard.">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Path A: Domain */}
        <div className="p-surface-flat p-3">
          <div className="text-[10.5px] uppercase tracking-[0.07em] text-muted-foreground">Path A</div>
          <div className="mt-1 text-[12.5px] font-semibold">Email domain auto-join</div>
          <p className="mt-1 text-[11.5px] text-muted-foreground leading-relaxed">
            Anyone who signs up with an email at this domain is added to your team automatically.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">@</span>
            <input
              value={domain}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="yourcompany.com"
              className="p-inset flex-1 px-2.5 text-[12.5px]"
            />
            <button onClick={saveDomain} disabled={busy} className="p-btn p-btn-primary">
              Save
            </button>
          </div>
          {state?.tenant?.allowed_domain && (
            <div className="mt-2 text-[11px] text-[var(--p-success)]">
              Active — new @{state.tenant.allowed_domain} signups auto-join.
            </div>
          )}
        </div>

        {/* Path B: Invite Links */}
        <div className="p-surface-flat p-3">
          <div className="text-[10.5px] uppercase tracking-[0.07em] text-muted-foreground">Path B</div>
          <div className="mt-1 text-[12.5px] font-semibold">Shareable invite link</div>
          <p className="mt-1 text-[11.5px] text-muted-foreground leading-relaxed">
            Send a single link. Anyone who signs up through it joins your team. Revoke any time.
          </p>
          <button onClick={makeLink} disabled={busy} className="mt-3 p-btn p-btn-primary">
            <Plus className="h-3.5 w-3.5" /> Create Invite Link
          </button>
          <ul className="mt-3 space-y-1.5">
            {((state?.invites ?? []) as Array<{ id: string; token: string; uses: number; revoked_at: string | null }>).map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 p-inset px-2 py-1.5">
                <code className="flex-1 truncate text-[11px]">{joinUrl(inv.token)}</code>
                <span className="text-[10.5px] text-muted-foreground">{inv.uses} used</span>
                {inv.revoked_at ? (
                  <span className="text-[10.5px] text-[var(--p-danger)]">Revoked</span>
                ) : (
                  <>
                    <button onClick={() => copy(joinUrl(inv.token))} className="text-[10.5px] text-muted-foreground hover:text-foreground underline underline-offset-2">Copy</button>
                    <button onClick={() => revoke(inv.id)} className="text-[10.5px] text-[var(--p-danger)] hover:opacity-80 underline underline-offset-2">Revoke</button>
                  </>
                )}
              </li>
            ))}
            {state && state.invites.length === 0 && (
              <li className="text-[11.5px] text-muted-foreground italic">No invite links yet.</li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
}


/** GC-facing read-only Legal section: signed PAA + Terms acceptance. */
function LegalSectionBody() {
  const [paa, setPaaRec] = useState<PaaRecord | null>(null);
  const [tos, setTos] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      void loadPaa().then(setPaaRec);
      setTos(loadTosAccepted());
    };
    refresh();
    window.addEventListener(PAA_EVT, refresh);
    return () => window.removeEventListener(PAA_EVT, refresh);
  }, []);

  return (
    <div className="space-y-3">
      {paa && isPaaSigned(paa) ? (
        <PaaSignedCard rec={paa} />
      ) : (
        <div className="p-surface-flat p-3" style={{ borderLeft: "2px solid var(--p-warning)" }}>
          <div className="text-[10.5px] uppercase tracking-[0.07em] text-[var(--p-warning)]">
            Permit Agent Authorization — not signed
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            We can't file NTBOs or submit applications as your authorized agent until this is signed.
          </p>
          <Link to="/onboarding" className="mt-3 p-btn p-btn-primary">
            Sign now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="p-surface-flat p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[12.5px] font-medium">Terms of Service</div>
            <div className="text-[11px] text-muted-foreground">
              {tos ? `Accepted ${new Date(tos).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Not yet accepted"}
            </div>
          </div>
          {!tos && (
            <button
              className="p-btn p-btn-ghost"
              onClick={() => { acceptTos(); toast.success("Terms of Service accepted"); }}
            >
              Accept Terms
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
