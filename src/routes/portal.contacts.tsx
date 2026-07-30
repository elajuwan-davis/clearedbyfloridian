import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  CONTACT_TYPES,
  CONTACT_TYPE_LABEL,
  type ContactRow,
  type ContactType,
  type ContactInput,
} from "@/lib/contacts-api";

export const Route = createFileRoute("/portal/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Cleard" },
      { name: "description", content: "Your shared contact book of subcontractors, design professionals and municipal contacts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContactsPage,
});

const EMPTY: ContactInput = {
  name: "",
  company: "",
  contact_type: "subcontractor",
  trade: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

function ContactsPage() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContactType>("all");

  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ContactInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContactRow | null>(null);

  async function refresh() {
    try {
      setRows(await listContacts());
    } catch (e) {
      toast.error(`Could not load contacts: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.contact_type !== typeFilter) return false;
      if (!q) return true;
      return `${r.name} ${r.company ?? ""} ${r.email ?? ""} ${r.phone ?? ""} ${r.trade ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, typeFilter]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(row: ContactRow) {
    setEditing(row);
    setForm({
      name: row.name,
      company: row.company ?? "",
      contact_type: row.contact_type,
      trade: row.trade ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      address: row.address ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateContact(editing.id, form);
        toast.success("Contact updated");
      } else {
        await createContact(form);
        toast.success("Contact added");
      }
      setDialogOpen(false);
      setEditing(null);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteContact(deleteTarget.id);
      toast.success("Contact deleted");
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-obsidian/10 pb-6">
        <div className="eyebrow text-obsidian/50">Contact Book</div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="display-serif text-4xl sm:text-5xl text-obsidian">Contacts</h1>
            <p className="mt-2 max-w-xl text-sm text-obsidian/60">
              Subcontractors, design professionals, suppliers and municipal contacts — shared
              with everyone on your team.
            </p>
          </div>
          <Button type="button" variant="dark" onClick={openNew} className="shrink-0 h-11 rounded-[3px] gap-2">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            New contact
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, email or phone…"
            className="h-11 rounded-[3px] border-obsidian/15 bg-white pl-9"
          />
        </div>
        <div className="min-w-[200px]">
          <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
            Type
          </Label>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="h-11 rounded-[3px] border-obsidian/15 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {CONTACT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{CONTACT_TYPE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
          {filtered.length} of {rows.length}
        </div>
      </div>

      <div className="mt-6 border border-obsidian/15 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-obsidian/55">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-obsidian/25" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-obsidian/60">
              {rows.length === 0 ? "No contacts yet." : "No contacts match your search."}
            </p>
            {rows.length === 0 && (
              <Button type="button" variant="outline" onClick={openNew} className="mt-4 rounded-[3px]">
                Add your first contact
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-obsidian/8">
            {filtered.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 p-4 sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] text-obsidian" style={{ fontFamily: "var(--font-subline)", fontWeight: 500 }}>
                      {c.name}
                    </span>
                    <span className="border border-obsidian/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-obsidian/65 rounded-[2px]">
                      {CONTACT_TYPE_LABEL[c.contact_type] ?? c.contact_type}
                    </span>
                    {c.trade && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">{c.trade}</span>
                    )}
                  </div>
                  {c.company && <div className="mt-1 text-sm text-obsidian/70">{c.company}</div>}
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-obsidian/65">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 hover:underline">
                        <Mail className="h-3.5 w-3.5" strokeWidth={1.6} /> {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
                        <Phone className="h-3.5 w-3.5" strokeWidth={1.6} /> {c.phone}
                      </a>
                    )}
                    {c.address && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.6} /> {c.address}
                      </span>
                    )}
                  </div>
                  {c.notes && <p className="mt-2 text-[13px] text-obsidian/55">{c.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-[3px]"
                    onClick={() => openEdit(c)}
                    aria-label={`Edit ${c.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span className="ml-1.5 hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-[3px] text-oxblood"
                    onClick={() => setDeleteTarget(c)}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create / edit */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="rounded-[3px] border-obsidian/15 bg-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="eyebrow text-obsidian/50">{editing ? "Edit Contact" : "New Contact"}</div>
            <DialogTitle className="display-serif text-2xl text-obsidian">
              {editing ? editing.name : "Add a contact"}
            </DialogTitle>
            <DialogDescription className="text-sm text-obsidian/55">
              Stored with your company's contact book and visible to your whole team.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="Company">
              <Input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="Type">
              <Select value={form.contact_type} onValueChange={(v) => setForm({ ...form, contact_type: v as ContactType })}>
                <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{CONTACT_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Trade / role">
              <Input value={form.trade ?? ""} onChange={(e) => setForm({ ...form, trade: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-[3px]" />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-[3px]" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-[3px]" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-[3px]" />
              </Field>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="ghost" className="rounded-[3px]" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="dark" onClick={save} disabled={saving} className="rounded-[3px]">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editing ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="rounded-[3px] border-obsidian/15 bg-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="display-serif text-2xl text-obsidian">Delete contact?</DialogTitle>
            <DialogDescription className="text-sm text-obsidian/60">
              {deleteTarget?.name} will be removed from your contact book. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="rounded-[3px]" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="dark" className="rounded-[3px]" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
        {label}
      </Label>
      {children}
    </div>
  );
}
