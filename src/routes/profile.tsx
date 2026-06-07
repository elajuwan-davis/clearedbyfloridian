import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Upload, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [displayName, setDisplayName] = useState("Javier Mendez");
  const [company, setCompany] = useState({
    name: "Coastline Builders Group",
    website: "https://coastlinebg.com",
    phone: "(561) 555-0144",
    address: "",
  });
  const [language, setLanguage] = useState("en");
  const [emails, setEmails] = useState<string[]>([
    "jmendez@coastlinebg.com",
    "permits@coastlinebg.com",
  ]);
  const [newEmail, setNewEmail] = useState("");
  const [license] = useState({ number: "CGC1521884", type: "Certified General Contractor", expires: "2027-08-31" });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [avatar, setAvatar] = useState<string | null>(null);

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

  function saveProfile() {
    toast.success("Profile saved");
  }

  function changePassword() {
    if (pwd.next.length < 8) return toast.error("Password must be 8+ characters");
    if (pwd.next !== pwd.confirm) return toast.error("Passwords do not match");
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
