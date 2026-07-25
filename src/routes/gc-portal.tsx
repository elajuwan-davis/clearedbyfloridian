import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getGCSession, clearGCSession, type GCClient } from "@/lib/gc-clients";
import { PROJECTS, type Project } from "@/lib/projects-data";
import { listSignatureRequests, type SignatureRequest } from "@/lib/signature-requests";
import { listNotaryRequests, type NotaryRequest } from "@/lib/notary-requests";
import { FileSignature, Stamp, FolderOpen, Plus, LogOut } from "lucide-react";

export const Route = createFileRoute("/gc-portal")({
  head: () => ({
    meta: [
      { title: "Builder Portal — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GCPortal,
});

function GCPortal() {
  const navigate = useNavigate();
  const [client, setClient] = useState<GCClient | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingSigs, setPendingSigs] = useState<SignatureRequest[]>([]);
  const [notary, setNotary] = useState<NotaryRequest[]>([]);

  useEffect(() => {
    const c = getGCSession();
    if (!c) {
      navigate({ to: "/login", replace: true });
      return;
    }
    setClient(c);
    const assigned = PROJECTS.filter((p) => c.projectIds.includes(p.id));
    setProjects(assigned);
    const assignedIds = new Set(assigned.map((p) => p.id));
    try {
      setPendingSigs(
        listSignatureRequests().filter((s) => assignedIds.has(s.projectId) && s.status !== "signed")
      );
    } catch {
      setPendingSigs([]);
    }
    try {
      setNotary(listNotaryRequests().filter((n) => assignedIds.has(n.projectId)));
    } catch {
      setNotary([]);
    }
  }, [navigate]);

  if (!client) return null;

  function signOut() {
    clearGCSession();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <header className="border-b hairline">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="wordmark text-2xl">Cleard</div>
            <div className="wordmark-subline">Builder Portal</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{client.firmName}</div>
              <div className="text-xs text-muted-foreground">{client.contactName}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="flex items-end justify-between">
          <div>
            <div className="label-eyebrow">Welcome</div>
            <h1 className="display-serif text-4xl">Your projects</h1>
          </div>
          <Link to="/forms/permit-intake">
            <Button style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }} className="rounded-[3px] gap-2">
              <Plus className="h-4 w-4" /> Submit New Project
            </Button>
          </Link>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<FolderOpen className="h-4 w-4" />} label="Active projects" value={projects.length} />
          <StatCard icon={<FileSignature className="h-4 w-4" />} label="Awaiting signature" value={pendingSigs.length} />
          <StatCard icon={<Stamp className="h-4 w-4" />} label="Notary requests" value={notary.length} />
        </section>

        <section>
          <h2 className="font-subline uppercase text-xs tracking-[0.15em] mb-4">Projects</h2>
          <div className="space-y-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/portal/projects/$id"
                params={{ id: p.id }}
                className="block border hairline rounded-[3px] p-5 hover:bg-muted/20 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="display-serif text-xl">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.address}</div>
                  </div>
                  <span
                    className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded-[3px]"
                    style={{
                      backgroundColor: "color-mix(in oklab, var(--obsidian) 8%, transparent)",
                      color: "var(--obsidian)",
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="border hairline rounded-[3px] p-8 text-center text-sm text-muted-foreground italic">
                No projects assigned yet. Contact Cleard to set up your first permit.
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ListPanel title="Documents awaiting your signature" empty="Nothing waiting.">
            {pendingSigs.map((s) => (
              <div key={s.id} className="text-sm border-b hairline py-2 last:border-b-0">
                <div className="font-medium">{s.documentName}</div>
                <div className="text-xs text-muted-foreground uppercase font-mono">{s.status}</div>
              </div>
            ))}
          </ListPanel>
          <ListPanel title="Pending notary requests" empty="No notary requests.">
            {notary.map((n) => (
              <div key={n.id} className="text-sm border-b hairline py-2 last:border-b-0">
                <div className="font-medium">{n.documentName}</div>
                <div className="text-xs text-muted-foreground uppercase font-mono">{n.status}</div>
              </div>
            ))}
          </ListPanel>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="border hairline p-5 rounded-[3px]">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="label-eyebrow">{label}</span>
      </div>
      <div className="display-serif text-4xl mt-2">{value}</div>
    </div>
  );
}

function ListPanel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="border hairline rounded-[3px] p-5">
      <h3 className="font-subline uppercase text-xs tracking-[0.15em] mb-3">{title}</h3>
      {hasChildren ? children : <div className="text-sm text-muted-foreground italic">{empty}</div>}
    </div>
  );
}
