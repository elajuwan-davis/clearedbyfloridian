import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectFromDeal, listHubspotProjects, deleteHubspotProject, HUBSPOT_EVT } from "@/lib/hubspot-projects";
import { useEffect } from "react";
import { CheckCircle2, ExternalLink, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/hubspot-simulate")({
  head: () => ({ meta: [{ title: "HubSpot Simulator — Cleared" }, { name: "robots", content: "noindex" }] }),
  component: HubspotSimulate,
});

const WEBHOOK_URL = "https://clearedbyfloridian.lovable.app/api/public/hubspot/deal-webhook";

function HubspotSimulate() {
  const [form, setForm] = useState({
    hubspot_deal_id: String(Math.floor(Math.random() * 900000) + 100000),
    deal_name: "New Custom Pool — Doe Residence",
    contact_name: "Jane Doe",
    contact_email: "jane@example.com",
    contact_phone: "(561) 555-0142",
    address: "1200 S Ocean Blvd",
    city: "Palm Beach",
    state: "FL",
    zip: "33480",
    deal_amount: 185000,
    project_type: "pool",
  });
  const [items, setItems] = useState(listHubspotProjects());
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setItems(listHubspotProjects());
    refresh();
    window.addEventListener(HUBSPOT_EVT, refresh);
    return () => window.removeEventListener(HUBSPOT_EVT, refresh);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = createProjectFromDeal({ ...form, deal_amount: Number(form.deal_amount) || 0 });
    setFlash(`Project created: ${p.name} (${p.id})`);
    setForm((f) => ({ ...f, hubspot_deal_id: String(Math.floor(Math.random() * 900000) + 100000) }));
    setTimeout(() => setFlash(null), 4000);
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <header className="border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Internal · Integration</div>
          <h1 className="display-serif mt-3 text-4xl text-obsidian">HubSpot → Cléared</h1>
          <p className="mt-3 max-w-2xl text-sm text-obsidian/70">
            When a HubSpot deal is marked <strong>Closed Won</strong>, a project auto-creates in Cléared under the
            <em> Intake </em> stage. Use this page to simulate the webhook and to review configuration for Eman.
          </p>
        </header>

        <section className="border border-obsidian/10 bg-white p-6 rounded-[3px]">
          <div className="font-subline text-xs font-bold uppercase tracking-[0.14em] text-obsidian mb-3">Webhook endpoint</div>
          <div className="flex items-center gap-2 font-mono text-xs bg-paper-warm border border-obsidian/10 px-3 py-2 rounded-[3px] overflow-x-auto">
            <span className="text-obsidian/50">POST</span>
            <code className="text-obsidian">{WEBHOOK_URL}</code>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-obsidian/75 list-disc list-inside">
            <li>Subscribe to <code>deal.propertyChange</code> on <code>dealstage</code> in the HubSpot Developer Portal.</li>
            <li>Set signing secret in Project Settings → Secrets as <code>HUBSPOT_WEBHOOK_SECRET</code>.</li>
            <li>Payload accepts either flat fields or HubSpot's native <code>properties</code> shape.</li>
            <li>Stage values recognized as Closed Won: <code>closedwon</code>, <code>closed_won</code>, <code>closed-won</code>.</li>
          </ul>
        </section>

        <form onSubmit={submit} className="border border-obsidian/10 bg-white p-6 rounded-[3px] space-y-4">
          <div className="font-subline text-xs font-bold uppercase tracking-[0.14em] text-obsidian">Simulate Closed Won Deal</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ["hubspot_deal_id", "Deal ID"],
              ["deal_name", "Deal Name"],
              ["contact_name", "Contact Name"],
              ["contact_email", "Contact Email"],
              ["contact_phone", "Contact Phone"],
              ["address", "Address"],
              ["city", "City"],
              ["state", "State"],
              ["zip", "Zip"],
              ["deal_amount", "Deal Amount (USD)"],
              ["project_type", "Project Type"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs font-mono uppercase tracking-[0.1em] text-obsidian/60">{label}</Label>
                <Input
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 rounded-[3px]"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="dark" className="rounded-[3px]">Simulate Closed Won → Create Project</Button>
            {flash && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> {flash}
              </span>
            )}
          </div>
        </form>

        <section className="border border-obsidian/10 bg-white p-6 rounded-[3px]">
          <div className="font-subline text-xs font-bold uppercase tracking-[0.14em] text-obsidian mb-3">
            HubSpot-sourced projects ({items.length})
          </div>
          {items.length === 0 ? (
            <div className="text-sm text-obsidian/50">No projects yet. Simulate a deal above.</div>
          ) : (
            <ul className="divide-y divide-obsidian/5">
              {items.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-obsidian">{p.name}</div>
                    <div className="text-xs text-obsidian/55">
                      {p.address}{p.city ? `, ${p.city}` : ""} · Deal {p.hubspot_deal_id} · {p.contact_email ?? "—"}
                    </div>
                  </div>
                  <Link
                    to="/portal/projects/$id"
                    params={{ id: p.id }}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-sky-700 hover:text-sky-900"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteHubspotProject(p.id)}
                    className="inline-flex items-center gap-1 text-oxblood/70 hover:text-oxblood text-xs"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
