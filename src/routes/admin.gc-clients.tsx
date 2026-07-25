import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/admin/gc-clients")({
  head: () => ({
    meta: [
      { title: "GC Clients — Admin — Cleard by Flōridian" },
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
    <div className="max-w-5xl mx-auto p-8 space-y-10">
      <header>
        <div className="label-eyebrow">Admin</div>
        <h1 className="display-serif text-4xl">GC Clients</h1>
        <p className="text-sm text-muted-foreground mt-2">
          External general contractor accounts. GC clients see only their assigned projects — never internal notes,
          costs, or other clients' work.
        </p>
      </header>

      <section className="border hairline p-6 rounded-[3px]">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4" style={{ color: "var(--obsidian)" }} />
          <h2 className="font-subline uppercase text-xs tracking-[0.15em]">Add GC Client</h2>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Firm name" value={form.firmName} onChange={(v) => setForm({ ...form, firmName: v })} required />
          <Field label="Contact name" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="License #" value={form.licenseNumber} onChange={(v) => setForm({ ...form, licenseNumber: v })} />
          <div className="md:col-span-2">
            <Button type="submit" style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }} className="rounded-[3px]">
              Create GC Client
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-subline uppercase text-xs tracking-[0.15em]">GC Clients ({clients.length})</h2>
        {clients.map((c) => (
          <div key={c.id} className="border hairline p-5 rounded-[3px] space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="display-serif text-xl">{c.firmName}</div>
                <div className="text-sm text-muted-foreground">
                  {c.contactName} · {c.email} · {c.phone || "—"}
                </div>
                <div className="text-xs font-mono mt-1">License {c.licenseNumber || "—"}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this GC client?")) deleteGCClient(c.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <div className="label-eyebrow mb-2">Assigned projects ({c.projectIds.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-auto border hairline p-2 rounded-[3px]">
                {PROJECTS.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={c.projectIds.includes(p.id)}
                      onChange={() => toggleProject(c.id, p.id)}
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="text-sm text-muted-foreground italic">No GC clients yet.</div>
        )}
      </section>
    </div>
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
    <div className="space-y-1.5">
      <Label className="font-subline text-[11px] tracking-[0.15em] uppercase text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="rounded-[3px] h-10"
      />
    </div>
  );
}
