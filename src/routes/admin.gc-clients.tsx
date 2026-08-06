import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROJECTS } from "@/lib/projects-data";
import {
  addGCClient,
  deleteGCClient,
  listGCClients,
  updateGCClient,
  type GCClient,
} from "@/lib/gc-clients";
import { Trash2, UserPlus } from "lucide-react";
import { PageShell, Panel, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/admin/gc-clients")({
  head: () => ({
    meta: [
      { title: "GC Clients — Admin — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GCClientsAdmin,
});

function GCClientsAdmin() {
  const [clients, setClients] = useState<GCClient[]>([]);
  const [form, setForm] = useState({
    firmName: "",
    contactName: "",
    email: "",
    phone: "",
    licenseNumber: "",
    projectIds: [] as string[],
  });

  useEffect(() => {
    const refresh = () => setClients(listGCClients());
    refresh();
    window.addEventListener("gc-clients:changed", refresh);
    return () => window.removeEventListener("gc-clients:changed", refresh);
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.firmName || !form.email) return;
    addGCClient(form);
    setForm({ firmName: "", contactName: "", email: "", phone: "", licenseNumber: "", projectIds: [] });
  }

  function toggleProject(clientId: string, projectId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const has = client.projectIds.includes(projectId);
    updateGCClient(clientId, {
      projectIds: has ? client.projectIds.filter((p) => p !== projectId) : [...client.projectIds, projectId],
    });
  }

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Admin" }]}
        title="GC Clients"
        meta={`${clients.length} accounts`}
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Panel
            title="Add GC client"
            action={<UserPlus className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />}
          >
            <form onSubmit={submit} className="grid grid-cols-1 gap-3">
              <Field label="Firm name" value={form.firmName} onChange={(v) => setForm({ ...form, firmName: v })} required />
              <Field label="Contact name" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="License #" value={form.licenseNumber} onChange={(v) => setForm({ ...form, licenseNumber: v })} />
              <button type="submit" className="p-btn p-btn-primary mt-1">
                Create GC client
              </button>
            </form>
          </Panel>

          <div className="min-w-0 space-y-3">
            {clients.length === 0 ? (
              <Panel padded={false}>
                <EmptyState title="No GC clients yet" />
              </Panel>
            ) : (
              clients.map((c) => (
                <Panel
                  key={c.id}
                  title={c.firmName}
                  meta={`${c.contactName} · ${c.email} · ${c.phone || "—"} · License ${c.licenseNumber || "—"}`}
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this GC client?")) deleteGCClient(c.id);
                      }}
                      className="p-btn p-btn-quiet p-btn-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  }
                >
                  <div className="text-[10.5px] uppercase tracking-[0.07em] text-muted-foreground/70">
                    Assigned projects ({c.projectIds.length})
                  </div>
                  <div className="p-inset mt-1.5 grid max-h-56 grid-cols-1 gap-1.5 overflow-auto p-2.5 md:grid-cols-2">
                    {PROJECTS.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-[12.5px]">
                        <input
                          type="checkbox"
                          checked={c.projectIds.includes(p.id)}
                          onChange={() => toggleProject(c.id, p.id)}
                        />
                        <span className="truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </Panel>
              ))
            )}
          </div>
        </div>
      </PageShell>
    </PortalShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10.5px] uppercase tracking-[0.07em] text-muted-foreground/70">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="rounded-lg"
      />
    </div>
  );
}
