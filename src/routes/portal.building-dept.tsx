import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Building2, Plus, Eye, EyeOff, Check, Trash2, Pencil, Search, Lock } from "lucide-react";
import { toast } from "sonner";
import { isInternalUser } from "@/lib/is-internal-user";
import {
  listMunicipalities, addMunicipality, updateMunicipality, deleteMunicipality,
  subscribeMunicipalities, FL_COUNTIES, PORTAL_PLATFORMS,
  type CustomMunicipality, type PortalPlatform,
} from "@/lib/municipalities-store";
import { MUNICIPALITIES } from "@/lib/municipalities";
import { savePortalLogin, deletePortalLogin, listPortalLoginFlags } from "@/lib/portal-logins.functions";

function slugifyCity(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const EMPTY_FORM = {
  municipality_name: "",
  county: "Palm Beach",
  portal_url: "",
  platform: "EnerGov" as PortalPlatform,
  username: "",
  password: "",
  phone: "",
  email: "",
  notes: "",
  verified: false,
};

export const Route = createFileRoute("/portal/building-dept")({
  head: () => ({
    meta: [
      { title: "Building Department Logins — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuildingDeptPage,
});


function BuildingDeptPage() {
  const internal = isInternalUser();
  const [custom, setCustom] = useState<CustomMunicipality[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);

  // GC portal credentials (per-user, per-municipality). Stored encrypted server-side.
  const listFlags = useServerFn(listPortalLoginFlags);
  const saveFn = useServerFn(savePortalLogin);
  const deleteFn = useServerFn(deletePortalLogin);
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [loginDialog, setLoginDialog] = useState<{ city: string; slug: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "", notes: "" });
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginSaving, setLoginSaving] = useState(false);

  async function refreshFlags() {
    try {
      const rows = await listFlags();
      setSavedSlugs(new Set(rows.map((r) => r.municipality_slug)));
    } catch { /* signed-out ok */ }
  }
  useEffect(() => { void refreshFlags(); }, []);

  function openLogin(city: string) {
    setLoginDialog({ city, slug: slugifyCity(city) });
    setLoginForm({ username: "", password: "", notes: "" });
    setLoginShowPw(false);
  }
  async function submitLogin() {
    if (!loginDialog) return;
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      toast.error("Username and password are required");
      return;
    }
    setLoginSaving(true);
    try {
      await saveFn({
        data: {
          municipality_slug: loginDialog.slug,
          city_name: loginDialog.city,
          username: loginForm.username.trim(),
          password: loginForm.password,
          notes: loginForm.notes.trim() || null,
        },
      });
      toast.success(`Login saved for ${loginDialog.city}`);
      setLoginDialog(null);
      await refreshFlags();
    } catch (e) {
      toast.error("Failed to save login: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoginSaving(false);
    }
  }
  async function clearLogin(city: string) {
    const slug = slugifyCity(city);
    if (!confirm(`Remove saved login for ${city}?`)) return;
    try {
      await deleteFn({ data: { municipality_slug: slug } });
      toast.success("Login removed");
      await refreshFlags();
    } catch (e) {
      toast.error("Failed to remove: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  useEffect(() => {
    setCustom(listMunicipalities());
    return subscribeMunicipalities(() => setCustom(listMunicipalities()));
  }, []);

  const customRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return custom;
    return custom.filter((r) =>
      r.municipality_name.toLowerCase().includes(q) || r.county.toLowerCase().includes(q),
    );
  }, [custom, query]);

  const statewideRows = useMemo(() => {
    const rows = MUNICIPALITIES.map((m) => ({ city: m.name, portalUrl: m.url }));
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.city.toLowerCase().includes(q));
  }, [query]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowPw(false);
    setOpen(true);
  }
  function openEdit(m: CustomMunicipality) {
    setEditingId(m.id);
    setForm({
      municipality_name: m.municipality_name,
      county: m.county,
      portal_url: m.portal_url,
      platform: m.platform,
      username: m.username || "",
      password: m.password || "",
      phone: m.phone || "",
      email: m.email || "",
      notes: m.notes || "",
      verified: m.verified,
    });
    setShowPw(false);
    setOpen(true);
  }
  function save() {
    if (!form.municipality_name.trim() || !form.portal_url.trim()) return;
    if (editingId) updateMunicipality(editingId, form);
    else addMunicipality(form);
    setOpen(false);
  }

  return (
    <>
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label-eyebrow">◇ Reference</div>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-obsidian">
              Building Department Portals
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Municipal portal links, credentials, and notes.
            </p>
          </div>
          {internal && (
            <Button variant="dark" onClick={openAdd} className="rounded-[3px] gap-2">
              <Plus className="h-4 w-4" /> Add Municipality
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-obsidian/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search municipalities or counties…"
            className="block w-full border border-obsidian/15 bg-white pl-9 pr-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none"
          />
        </div>

        {/* Custom user-added */}
        {customRows.length > 0 && (
          <section className="space-y-3">
            <div className="label-eyebrow text-obsidian/60">Added by team</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customRows.map((m) => (
                <CustomCard
                  key={m.id}
                  rec={m}
                  internal={internal}
                  onEdit={() => openEdit(m)}
                  onDelete={() => { if (confirm(`Delete ${m.municipality_name}?`)) deleteMunicipality(m.id); }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Statewide municipalities */}
        <section>
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
            <div className="label-eyebrow text-obsidian/60">Building Departments</div>
            <div className="text-xs text-muted-foreground">{statewideRows.length} cities</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {statewideRows.map((r) => {
              const slug = slugifyCity(r.city);
              const hasLogin = savedSlugs.has(slug);
              return (
                <div key={r.city} className="border hairline bg-white rounded-[3px] p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-obsidian truncate">{r.city}</div>
                    {r.portalUrl ? (
                      <a href={r.portalUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-sky/60 bg-sky/10 hover:bg-sky/20 text-obsidian px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.12em] shrink-0">
                        Open Portal <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center border border-border bg-secondary/60 text-muted-foreground px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.12em] shrink-0">
                        Contact Dept.
                      </span>
                    )}
                  </div>
                  {hasLogin ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-mono text-[10px] uppercase tracking-[0.12em]">
                        <Check className="h-3 w-3" /> Login Saved
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openLogin(r.city)}
                          className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:text-obsidian underline underline-offset-2"
                        >Edit</button>
                        <span className="text-obsidian/25">·</span>
                        <button
                          onClick={() => clearLogin(r.city)}
                          className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:text-red-700 underline underline-offset-2"
                        >Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openLogin(r.city)}
                      className="inline-flex items-center gap-1.5 self-start font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:text-obsidian underline underline-offset-2"
                    >
                      <Lock className="h-3 w-3" /> Add Login
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>


      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Municipality" : "Add Municipality"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2">
              <Label>Municipality Name *</Label>
              <Input value={form.municipality_name}
                onChange={(e) => setForm({ ...form, municipality_name: e.target.value })}
                placeholder="City of Delray Beach" />
            </div>
            <div>
              <Label>County</Label>
              <Select value={form.county} onValueChange={(v) => setForm({ ...form, county: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FL_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Portal Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as PortalPlatform })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PORTAL_PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Portal URL *</Label>
              <Input value={form.portal_url}
                onChange={(e) => setForm({ ...form, portal_url: e.target.value })}
                placeholder="https://..." />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-9" />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-obsidian/50 hover:text-obsidian">
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Must register in office first, login not working, etc." />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <Checkbox id="verified" checked={form.verified}
                onCheckedChange={(v) => setForm({ ...form, verified: !!v })} />
              <Label htmlFor="verified" className="cursor-pointer">Verified — confirmed working</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-[3px]">Cancel</Button>
            <Button variant="dark" onClick={save} className="rounded-[3px]">
              {editingId ? "Save Changes" : "Add Municipality"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* GC Portal Login credential dialog */}
      <Dialog open={!!loginDialog} onOpenChange={(o) => !o && setLoginDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Portal Login — {loginDialog?.city}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-obsidian/60 leading-relaxed">
              Your credentials are encrypted at rest and used solely staff to
              submit permit documents to this building department on your behalf.
            </p>
            <div>
              <Label>Username / Email</Label>
              <Input
                value={loginForm.username}
                onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                autoComplete="off"
              />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={loginShowPw ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setLoginShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-obsidian/50 hover:text-obsidian"
                  aria-label={loginShowPw ? "Hide password" : "Show password"}
                >
                  {loginShowPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                rows={2}
                placeholder="e.g. use secondary email, MFA on file, etc."
                value={loginForm.notes}
                onChange={(e) => setLoginForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialog(null)} disabled={loginSaving}>
              Cancel
            </Button>
            <Button variant="dark" onClick={submitLogin} disabled={loginSaving}>
              {loginSaving ? "Saving…" : "Save Login"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomCard({
  rec, internal, onEdit, onDelete,
}: {
  rec: CustomMunicipality;
  internal: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="border hairline bg-white p-4 rounded-[3px] space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-obsidian/60" />
            <div className="text-sm font-semibold text-obsidian truncate">{rec.municipality_name}</div>
            {rec.verified && (
              <span title="Verified" className="inline-flex items-center gap-0.5 text-emerald-700 text-[10px] font-mono uppercase">
                <Check className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{rec.county} County</div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] border border-obsidian/15 bg-secondary/40 px-2 py-0.5 rounded-[2px]">
          {rec.platform}
        </span>
      </div>

      {rec.portal_url && (
        <a href={rec.portal_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-sky hover:opacity-70 break-all">
          {rec.portal_url.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      )}

      {internal && (rec.username || rec.password) && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {rec.username && (
            <div>
              <div className="label-eyebrow text-obsidian/50 mb-0.5">Username</div>
              <div className="font-mono text-obsidian truncate">{rec.username}</div>
            </div>
          )}
          {rec.password && (
            <div>
              <div className="label-eyebrow text-obsidian/50 mb-0.5">Password</div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-obsidian truncate">
                  {showPw ? rec.password : "•".repeat(Math.min(rec.password.length, 12))}
                </span>
                <button onClick={() => setShowPw((s) => !s)} className="text-obsidian/50 hover:text-obsidian">
                  {showPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(rec.phone || rec.email) && (
        <div className="text-xs text-muted-foreground space-x-3">
          {rec.phone && <span>{rec.phone}</span>}
          {rec.email && <span>{rec.email}</span>}
        </div>
      )}

      {rec.notes && (
        <div className="text-xs italic text-muted-foreground border-l-2 border-obsidian/10 pl-2">{rec.notes}</div>
      )}

      {internal && (
        <div className="flex gap-2 pt-2 border-t hairline">
          <Button size="sm" variant="outline" onClick={onEdit} className="rounded-[3px] h-7 text-xs gap-1">
            <Pencil className="h-3 w-3" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}
            className="rounded-[3px] h-7 text-xs gap-1 text-oxblood hover:text-oxblood">
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
        </div>
      )}
    </div>
  );
}
