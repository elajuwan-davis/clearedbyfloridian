import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Search, Loader2, Building2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import { getPermit } from "@/lib/permits-api";
import {
  createHoaSubmittal,
  checklistForType,
} from "@/lib/hoa-submittals";
import {
  listHoaTemplates,
  markTemplateUsed,
  displayNameFor,
  type HoaTemplateRow,
} from "@/lib/hoa-templates";

type NewSearch = { permitId?: string };

export const Route = createFileRoute("/portal/hoa-submittals/new")({
  validateSearch: (search: Record<string, unknown>): NewSearch => ({
    permitId: typeof search.permitId === "string" ? search.permitId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New HOA Submittal — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewHoaSubmittal,
});

function relDate(iso: string | null): string {
  if (!iso) return "Never used";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function money(cents: number): string {
  if (!cents) return "No deposit";
  return `$${(cents / 100).toLocaleString("en-US")}`;
}

function NewHoaSubmittal() {
  const navigate = useNavigate();
  const { permitId } = useSearch({ from: "/portal/hoa-submittals/new" });
  const session = useSession();
  const [templates, setTemplates] = useState<HoaTemplateRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    listHoaTemplates().then(setTemplates).catch((e) => toast.error(String(e?.message ?? e)));
  }, []);

  const filtered = useMemo(() => {
    const list = templates ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.community_name.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        (t.hoa_contact_name ?? "").toLowerCase().includes(q),
    );
  }, [templates, query]);

  async function prefillFromPermit() {
    if (!permitId) return {};
    try {
      const p = await getPermit(permitId);
      if (!p) return {};
      return {
        permit_id: p.id,
        applicant_name: p.owner_name || p.poc || "",
        applicant_email: p.poc_email || "",
        applicant_phone: p.poc_phone || "",
        property_address: p.job_address,
        contractor_name: p.contractor_company,
        contractor_license: p.license_number,
        scope_of_work: p.description ?? "",
        project_description: p.description ?? "",
      };
    } catch {
      return {};
    }
  }

  async function useTemplate(tpl: HoaTemplateRow) {
    if (starting) return;
    setStarting(tpl.id);
    try {
      const prefill = await prefillFromPermit();
      const row = await createHoaSubmittal({
        source: tpl.uploaded_form_path ? "uploaded_form" : "boilerplate",
        status: "draft",
        tenant_id: session.effectiveTenantId,
        created_by: session.userId,
        template_id: tpl.id,
        hoa_name: tpl.community_name,
        community_name: tpl.community_name,
        uploaded_form_path: tpl.uploaded_form_path,
        deposit_amount_cents: tpl.deposit_amount_cents,
        checklist: checklistForType(null),
        documents: [],
        missing_fields: [],
        extracted_fields: { source_template: tpl.id },
        ...prefill,
      } as any);
      markTemplateUsed(tpl.id).catch(() => undefined);
      toast.success(`Started from ${displayNameFor(tpl)}`);
      navigate({ to: "/portal/hoa-submittals/$id", params: { id: row.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create submittal");
      setStarting(null);
    }
  }

  return (
    <PortalShell>
      <div className="space-y-8 max-w-6xl">
        <div>
          <Link to="/portal/hoa-submittals" className="inline-flex items-center gap-1 text-xs text-obsidian/60 hover:text-obsidian">
            <ArrowLeft className="h-3 w-3" /> HOA Submittals
          </Link>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-obsidian">Start an HOA Submittal</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Search the Cleard community repository. Every submittal builds this library — find your community and we pre-fill
            everything we know. If it's not listed, add it and it becomes the template for every future submittal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-obsidian/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by community or city (Wellington, Ibis, Abacoa…)"
              className="w-full border border-obsidian/20 bg-white pl-9 pr-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none"
            />
          </div>
          <Button asChild variant="dark" className="rounded-[3px] gap-2">
            <Link
              to="/portal/hoa-submittals/templates/new"
              search={permitId ? { permitId } : {}}
            >
              <Plus className="h-4 w-4" /> Add new HOA
            </Link>
          </Button>
        </div>

        {templates === null ? (
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading repository…
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-obsidian/15 rounded-[3px] px-6 py-12 text-center">
            <Building2 className="mx-auto h-8 w-8 text-obsidian/30" />
            <div className="mt-4 font-display text-2xl text-obsidian">
              {query ? "No matches" : "The repository is empty"}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {query
                ? "Try a shorter search or add this community to the repository."
                : "Add your first HOA and every future submittal to that community pre-fills automatically."}
            </p>
            <Button asChild variant="dark" className="mt-6 rounded-[3px] gap-2">
              <Link to="/portal/hoa-submittals/templates/new" search={permitId ? { permitId } : {}}>
                <Plus className="h-4 w-4" /> Add new HOA
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tpl) => (
              <article
                key={tpl.id}
                className="border border-obsidian/10 rounded-[3px] bg-white p-5 flex flex-col gap-3"
              >
                <div>
                  <div className="font-display text-xl text-obsidian leading-tight">
                    {tpl.community_name}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-obsidian/50 mt-0.5">
                    {tpl.city}
                  </div>
                </div>
                <div className="text-sm text-obsidian/70 space-y-0.5">
                  {tpl.hoa_contact_name && <div>{tpl.hoa_contact_name}</div>}
                  {tpl.hoa_contact_email && (
                    <div className="text-obsidian/60 text-xs">{tpl.hoa_contact_email}</div>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-y-1 text-xs">
                  <dt className="text-obsidian/50">Docs required</dt>
                  <dd className="text-obsidian/80 text-right">
                    {(tpl.required_documents ?? []).filter((d) => d.required).length} required
                  </dd>
                  <dt className="text-obsidian/50">Deposit</dt>
                  <dd className="text-obsidian/80 text-right">{money(tpl.deposit_amount_cents)}</dd>
                  <dt className="text-obsidian/50">Last used</dt>
                  <dd className="text-obsidian/80 text-right">{relDate(tpl.last_used_at)}</dd>
                </dl>
                <div className="mt-auto pt-2">
                  <Button
                    variant="dark"
                    className="w-full rounded-[3px]"
                    onClick={() => useTemplate(tpl)}
                    disabled={starting !== null}
                  >
                    {starting === tpl.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</>
                    ) : (
                      <>Use Template →</>
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
