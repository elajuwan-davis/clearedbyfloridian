import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
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
import { ExternalLink, Building2, Plus, Eye, EyeOff, Check, Trash2, Pencil, Search } from "lucide-react";
import { isInternalUser } from "@/lib/is-internal-user";
import {
  listMunicipalities, addMunicipality, updateMunicipality, deleteMunicipality,
  subscribeMunicipalities, FL_COUNTIES, PORTAL_PLATFORMS,
  type CustomMunicipality, type PortalPlatform,
} from "@/lib/municipalities-store";
import { MUNICIPALITY_TREE } from "@/lib/municipalities-data";

export const Route = createFileRoute("/portal/building-dept")({
  head: () => ({
    meta: [
      { title: "Building Department Portals — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuildingDeptPage,
});

type Row = { name: string; url?: string; note?: string };

const SEED: Row[] = [
  { name: "Coral Springs", url: "https://etrakit.coralsprings.gov/etrakit/" },
  { name: "Greenacres", url: "https://portal.greenacresfl.gov/", note: "Need to register in their office" },
  { name: "Jupiter", url: "https://cds.jupiter.fl.us/EnerGov_Prod/selfservice/JupiterFLProd", note: "Log-in details not working" },
  { name: "Palm Beach", url: "https://eden.townofpalmbeach.com/Default.aspx?Build=PM.PermitsHome&ShowLogon=ShowLogon" },
  { name: "Wellington", url: "https://wellingtonfl-energovweb.tylerhost.net/apps/SelfService" },
  { name: "Palm Beach Gardens", url: "https://palmbeachgardensfl-energovweb.tylerhost.net/apps/SelfService#/home" },
  { name: "Fort Lauderdale", url: "https://aca-prod.accela.com/FTL/Login.aspx" },
  { name: "City of Port St. Lucie", url: "https://county-taxes.net/stlucie/stlucie/property-tax/", note: "Property search link" },
  { name: "West Palm Beach", url: "https://permit-planner.wpb.org/" },
  { name: "Miramar", url: "https://mss.miramarfl.gov/css/default.aspx", note: "No login required" },
  { name: "Boca Raton", url: "https://www.bocaehub.com", note: "Uses EHub Boca system" },
  { name: "Pembroke Pines", url: "https://pembrokepinesfl-energovweb.tylerhost.net/apps/selfservice", note: "No login required" },
  { name: "Miami-Dade County", url: "https://www.miamidade.gov/Apps/RER/EPSPortal" },
  { name: "Oakland Park", url: "https://cityofoaklandparkfl.tylerportico.com/portal/launcher/" },
  { name: "Weston", url: "https://aca-prod.accela.com/WESTON/Login.aspx" },
  { name: "Wilton Manors", url: "https://www.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=125" },
  { name: "Davie", url: "https://esuite.davie-fl.gov/eSuite.Permits/AdvancedSearchPage/AdvancedSearch.aspx" },
  { name: "Martin County / Stuart", url: "https://aca-prod.accela.com/MARTINCO/Default.aspx" },
  { name: "Boynton Beach", url: "https://www.sagesgov.com/boyntonbeach-fl" },
  { name: "Royal Palm Beach", url: "https://click2gov.royalpalmbeach.com/Click2GovBP/index.html" },
  { name: "Fort Myers", url: "https://cdservices.cityftmyers.com/energovprod/selfservice" },
  { name: "Westlake", url: "https://cityviewportal.westlakegov.com/Permit/Locator" },
  { name: "Doral", url: "https://doralfl-energovweb.tylerhost.net/apps/SelfService" },
  { name: "Parkland", url: "https://www.mgoconnect.org/cp/portal" },
  { name: "North Palm Beach", url: "https://www.mgoconnect.org/cp/portal", note: "Select North Palm Beach on login" },
  { name: "Plantation", url: "https://aca.plantation.org/CitizenAccess/Default.aspx" },
  { name: "Tequesta", url: "https://bsaonline.com/Account/LogOn?uid=2607" },
  { name: "Miami Beach", url: "https://energovcss.miamibeachfl.gov/energovprod/selfservice#/home" },
  { name: "Lighthouse Point", url: "https://ci-lighthousepoint-fl.smartgovcommunity.com/" },
  { name: "County of PSL", url: "https://www.stlucieco.gov/departments-and-services/planning-and-development-services/energov-online-platform" },
];

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

function BuildingDeptPage() {
  const internal = isInternalUser();
  const [custom, setCustom] = useState<CustomMunicipality[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    setCustom(listMunicipalities());
    return subscribeMunicipalities(() => setCustom(listMunicipalities()));
  }, []);

  const seedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEED;
    return SEED.filter((r) => r.name.toLowerCase().includes(q));
  }, [query]);

  const customRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return custom;
    return custom.filter((r) =>
      r.municipality_name.toLowerCase().includes(q) || r.county.toLowerCase().includes(q),
    );
  }, [custom, query]);

  const statewideRows = useMemo(() => {
    const seedUrls = new Map(SEED.map((s) => [s.name.toLowerCase(), s.url]));
    const map = new Map<string, { city: string; portalUrl?: string }>();
    for (const region of MUNICIPALITY_TREE) {
      for (const county of region.counties) {
        for (const city of county.cities) {
          const key = city.name.toLowerCase();
          map.set(key, { city: city.name, portalUrl: city.portalUrl ?? seedUrls.get(key) });
        }
      }
    }
    for (const s of SEED) {
      const key = s.name.toLowerCase();
      if (!map.has(key)) map.set(key, { city: s.name, portalUrl: s.url });
    }
    const rows = Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city));
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
    <PortalShell>
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

        {/* Seed table */}
        <section>
          <div className="label-eyebrow text-obsidian/60 mb-3">Reference directory</div>
          <div className="border hairline overflow-hidden bg-background">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b hairline bg-secondary/40 label-eyebrow">
              <div className="col-span-4">Municipality</div>
              <div className="col-span-5">Notes</div>
              <div className="col-span-3 text-right">Portal Link</div>
            </div>
            <div className="divide-y">
              {seedRows.map((m) => (
                <div key={m.name} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-secondary/30 transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-obsidian/60" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-obsidian">{m.name}</div>
                  </div>
                  <div className="col-span-5 text-xs text-muted-foreground">
                    {m.note ? <span className="italic">{m.note}</span> : <span className="text-muted-foreground/40">—</span>}
                  </div>
                  <div className="col-span-3 flex justify-end">
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-sky/60 bg-sky/10 hover:bg-sky/20 text-obsidian px-3 py-1.5 rounded-[3px] font-mono text-[11px] uppercase tracking-[0.12em] transition-colors">
                        Open Portal <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center border border-border bg-secondary/60 text-muted-foreground px-3 py-1.5 rounded-[3px] font-mono text-[11px] uppercase tracking-[0.12em]">
                        Link Coming
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statewide municipalities */}
        <section>
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
            <div className="label-eyebrow text-obsidian/60">Statewide municipalities</div>
            <div className="text-xs text-muted-foreground">{statewideRows.length} cities</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {statewideRows.map((r) => (
              <div key={`${r.region}-${r.county}-${r.city}`} className="border hairline bg-white rounded-[3px] p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-obsidian/60 mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-obsidian truncate">{r.city}</div>
                    <div className="text-[11px] text-muted-foreground">{r.county} County · {r.region}</div>
                    {r.deptName && <div className="text-[11px] text-obsidian/60 mt-0.5 truncate">{r.deptName}</div>}
                  </div>
                </div>
                {r.portalUrl ? (
                  <a href={r.portalUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-sky/60 bg-sky/10 hover:bg-sky/20 text-obsidian px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.12em]">
                    Open Portal <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="inline-flex items-center border border-border bg-secondary/60 text-muted-foreground px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.12em]">
                    Contact Dept.
                  </span>
                )}
              </div>
            ))}
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
    </PortalShell>
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
