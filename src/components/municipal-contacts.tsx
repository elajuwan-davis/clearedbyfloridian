import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Phone, Mail, Plus, Pencil, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  CONTACT_ROLES,
  MUNI_CONTACT_EVT,
  STANDING_META,
  addMunicipalContact,
  deleteMunicipalContact,
  listMunicipalContacts,
  resolveJurisdiction,
  updateMunicipalContact,
  type MunicipalContact,
  type Standing,
} from "@/lib/municipal-contacts";

function useContacts(muni: string | null) {
  const [rows, setRows] = useState<MunicipalContact[]>([]);
  useEffect(() => {
    if (!muni) { setRows([]); return; }
    const refresh = () => setRows(listMunicipalContacts(muni));
    refresh();
    window.addEventListener(MUNI_CONTACT_EVT, refresh);
    return () => window.removeEventListener(MUNI_CONTACT_EVT, refresh);
  }, [muni]);
  return rows;
}

function StandingBadge({ standing }: { standing: Standing }) {
  const meta = STANDING_META[standing];
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] rounded-[3px] ${meta.className}`}>
      {meta.label}
    </span>
  );
}

/* ------------------------- Full tab (staff editable) ------------------------ */

export function MunicipalityContactsTab({ muni, editable = true }: { muni: string; editable?: boolean }) {
  const rows = useContacts(muni);
  const [editing, setEditing] = useState<MunicipalContact | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-obsidian/60">
          {rows.length} contact{rows.length === 1 ? "" : "s"} on file for {muni}.
        </div>
        {editable && (
          <Button size="sm" variant="dark" className="rounded-[3px] gap-1.5" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" /> Add Contact
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="border border-obsidian/12 bg-white p-8 text-center rounded-[3px]">
          <Users className="mx-auto h-5 w-5 text-obsidian/35" />
          <div className="mt-2 text-sm text-obsidian/60">No contacts recorded yet.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((c) => (
            <div key={c.id} className="border border-obsidian/12 bg-white p-4 rounded-[3px]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-obsidian truncate">{c.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/55 mt-0.5">{c.role}</div>
                </div>
                <StandingBadge standing={c.standing} />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`} className="inline-flex items-center gap-1.5 text-sky-700 hover:underline">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-sky-700 hover:underline">
                    <Mail className="h-3 w-3" /> {c.email}
                  </a>
                )}
              </div>

              {c.notes && <p className="mt-3 text-xs text-obsidian/70 leading-relaxed">{c.notes}</p>}

              <div className="mt-3 flex items-center justify-between border-t border-obsidian/8 pt-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                  Last contacted {c.lastContacted || "—"}
                </div>
                {editable && (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setEditing(c)} className="p-1.5 text-obsidian/45 hover:text-obsidian" aria-label="Edit contact">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { deleteMunicipalContact(c.id); toast.success("Contact removed"); }}
                      className="p-1.5 text-obsidian/45 hover:text-red-700"
                      aria-label="Delete contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ContactDialog
        muni={muni}
        contact={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function ContactDialog({
  muni, contact, onClose,
}: { muni: string; contact: MunicipalContact | "new" | null; onClose: () => void }) {
  const isNew = contact === "new";
  const existing = contact && contact !== "new" ? contact : null;
  const [form, setForm] = useState({
    name: "", role: CONTACT_ROLES[0] as string, phone: "", email: "", notes: "", lastContacted: "", standing: "neutral" as Standing,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name, role: existing.role, phone: existing.phone, email: existing.email,
        notes: existing.notes, lastContacted: existing.lastContacted, standing: existing.standing,
      });
    } else {
      setForm({ name: "", role: CONTACT_ROLES[0], phone: "", email: "", notes: "", lastContacted: "", standing: "neutral" });
    }
  }, [contact]);

  function save() {
    if (!form.name.trim()) return toast.error("Name is required");
    if (existing) {
      updateMunicipalContact(existing.id, form);
      toast.success("Contact updated");
    } else {
      addMunicipalContact({ muni, ...form });
      toast.success("Contact added");
    }
    onClose();
  }

  return (
    <Dialog open={contact !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-[3px]">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl text-obsidian">
            {isNew ? "Add Municipal Contact" : "Edit Contact"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Full name</Label>
            <Input className="mt-1.5 rounded-[3px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Douglas Wise" />
          </div>
          <div>
            <Label className="text-xs">Title / role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="mt-1.5 rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTACT_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Direct phone</Label>
              <Input className="mt-1.5 rounded-[3px]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(561) 233-5100" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="mt-1.5 rounded-[3px]" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@municipality.gov" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Last contacted</Label>
              <Input type="date" className="mt-1.5 rounded-[3px]" value={form.lastContacted} onChange={(e) => setForm({ ...form, lastContacted: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Relationship status</Label>
              <Select value={form.standing} onValueChange={(v) => setForm({ ...form, standing: v as Standing })}>
                <SelectTrigger className="mt-1.5 rounded-[3px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good Standing</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="attention">Needs Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea className="mt-1.5 rounded-[3px]" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Submittal preferences, escalation path, review quirks…" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-[3px]" onClick={onClose}>
            <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
          </Button>
          <Button variant="dark" className="rounded-[3px]" onClick={save}>Save Contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Compact sidebar panel (project detail view) --------------- */

export function MunicipalityContactsPanel({ city, county }: { city?: string | null; county?: string | null }) {
  const muni = useMemo(() => resolveJurisdiction(city, county), [city, county]);
  const rows = useContacts(muni);

  return (
    <div className="border border-obsidian/12 bg-white rounded-[3px]">
      <div className="border-b border-obsidian/10 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Municipality Contacts</div>
        <div className="mt-0.5 text-sm font-semibold text-obsidian">{muni ?? city ?? "Jurisdiction"}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-obsidian/55">
          No contacts on file for this jurisdiction yet.
        </div>
      ) : (
        <ul className="divide-y divide-obsidian/8">
          {rows.slice(0, 6).map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-obsidian truncate">{c.name}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-obsidian/55">{c.role}</div>
                </div>
                <StandingBadge standing={c.standing} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`} className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                    <Mail className="h-3 w-3" /> Email
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
