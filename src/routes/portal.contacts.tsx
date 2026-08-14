import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Mail, Phone, Loader2 } from "lucide-react";
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
import { PageShell, SearchInput, Segmented, TableShell, EmptyState, StatusChip } from "@/components/ui-kit";

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
  // Contacts tabs (Inspectors / Municipalities / Homeowners) drive this filter
  // through ?type= so each tab lands on the right slice of the contact book.
  const typeParam = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown>)?.["type"] as string | undefined,
  });
  const [typeFilter, setTypeFilter] = useState<"all" | ContactType>("all");

  useEffect(() => {
    if (typeParam && (CONTACT_TYPES as readonly string[]).includes(typeParam)) {
      setTypeFilter(typeParam as ContactType);
    }
  }, [typeParam]);

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
    <PageShell
      crumbs={[{ label: "Workspace" }, { label: "Contacts" }]}
      title="Contacts"
      meta={loading ? "Loading…" : `${filtered.length} of ${rows.length}`}
      actions={
        <button type="button" className="p-btn p-btn-primary" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          New contact
        </button>
      }
      toolbar={
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, company, email or phone…" className="w-64" />
          <Segmented
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All" },
              ...CONTACT_TYPES.map((t) => ({ value: t, label: CONTACT_TYPE_LABEL[t] })),
            ]}
          />
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 p-12 text-[12.5px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? "No contacts yet" : "No contacts match your search"}
          action={
            rows.length === 0 ? (
              <button type="button" className="p-btn p-btn-ghost" onClick={openNew}>
                Add your first contact
              </button>
            ) : undefined
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th className="w-[1%]" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="group">
                <td className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  {c.trade && <div className="truncate text-[11px] text-muted-foreground">{c.trade}</div>}
                </td>
                <td>
                  <StatusChip tone="neutral">{CONTACT_TYPE_LABEL[c.contact_type] ?? c.contact_type}</StatusChip>
                </td>
                <td className="max-w-[200px] truncate text-muted-foreground">{c.company || "—"}</td>
                <td className="max-w-[220px] truncate">
                  {c.email ? (
                    <Link
                      to="/messages"
                      search={{ contact: c.id }}
                      title={`Message ${c.name} in Cleard`}
                      className="inline-flex items-center gap-1.5 hover:underline"
                    >
                      <Mail className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.6} /> {c.email}
                    </Link>
                  ) : "—"}
                </td>

                <td className="whitespace-nowrap">
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
                      <Phone className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.6} /> {c.phone}
                    </a>
                  ) : "—"}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" className="p-btn p-btn-quiet p-btn-sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                    <button type="button" className="p-btn p-btn-quiet p-btn-sm text-[var(--p-danger)]" onClick={() => setDeleteTarget(c)} aria-label={`Delete ${c.name}`}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {/* Create / edit */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add a contact"}</DialogTitle>
            <DialogDescription>
              Stored with your company's contact book and visible to your whole team.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Company">
              <Input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={form.contact_type} onValueChange={(v) => setForm({ ...form, contact_type: v as ContactType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{CONTACT_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Trade / role">
              <Input value={form.trade ?? ""} onChange={(e) => setForm({ ...form, trade: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2 border-t border-[var(--p-border)] pt-3">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editing ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete contact?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} will be removed from your contact book. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
