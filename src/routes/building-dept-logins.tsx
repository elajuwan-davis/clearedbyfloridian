import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MunicipalityContactsTab } from "@/components/municipal-contacts";
import { MUNICIPALITIES } from "@/lib/municipalities";
import {
  listPortalLoginFlags,
  revealOwnPortalLogin,
  type PortalLoginFlag,
} from "@/lib/portal-logins.functions";
import {
  getPortalLoginDocUrlFn,
  isDocExpired,
  listPortalLoginDocuments,
  type PortalLoginDocument,
} from "@/lib/portal-login-docs";
import { toast } from "sonner";
import {
  ChevronDown, Copy, Eye, EyeOff, FileText, Plus, Search, Check, ExternalLink, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/building-dept-logins")({
  head: () => ({
    meta: [
      { title: "Building Dept Logins — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuildingDeptLoginsPage,
});

type EnrichedLogin = PortalLoginFlag & {
  county: string;
  resolvedPortalUrl: string | null;
  status: "active" | "needs_updated";
  docs: PortalLoginDocument[];
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function enrich(flags: PortalLoginFlag[], docsBySlug: Map<string, PortalLoginDocument[]>): EnrichedLogin[] {
  return flags.map((f) => {
    const meta = MUNICIPALITIES.find(
      (m) =>
        m.name.toLowerCase() === f.city_name.toLowerCase() ||
        m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === f.municipality_slug,
    );
    const docs = docsBySlug.get(f.municipality_slug) ?? [];
    const expiredCount = docs.filter((d) => isDocExpired(d.expiration_date)).length;
    return {
      ...f,
      county: meta?.county ?? "—",
      resolvedPortalUrl: f.portal_url || meta?.url || null,
      status: expiredCount > 0 ? "needs_updated" : "active",
      docs,
    };
  });
}

function BuildingDeptLoginsPage() {
  const listFlags = useServerFn(listPortalLoginFlags);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EnrichedLogin[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const flags = await listFlags();
      const docs = await listPortalLoginDocuments().catch(() => [] as PortalLoginDocument[]);
      const bySlug = new Map<string, PortalLoginDocument[]>();
      for (const d of docs) {
        const list = bySlug.get(d.municipality_slug) ?? [];
        list.push(d);
        bySlug.set(d.municipality_slug, list);
      }
      const enriched = enrich(flags, bySlug);
      setRows(enriched);
      setOpen((prev) => {
        if (prev && enriched.some((r) => r.municipality_slug === prev)) return prev;
        return enriched[0]?.municipality_slug ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load portal logins");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [listFlags]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((l) =>
      `${l.city_name} ${l.county} ${l.registration ?? ""}`.toLowerCase().includes(q),
    );
  }, [query, rows]);

  return (
    <PortalShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-8">
          <div>
            <div className="eyebrow text-obsidian/50">Credentials Vault</div>
            <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Building Dept Logins</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              Encrypted portal credentials, contractor registrations, and document expirations.
            </p>
          </div>
          <Button asChild variant="dark" className="rounded-[3px] gap-2">
            <Link to="/building-dept-logins/submit">
              <Plus className="h-4 w-4" /> Submit New Login
            </Link>
          </Button>
        </div>

        <div className="mt-6 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-obsidian/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search municipalities…"
            className="block w-full border border-obsidian/15 bg-white pl-9 pr-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]"
          />
        </div>

        <div className="mt-8 border border-obsidian/15 bg-white">
          {loading && (
            <div className="px-5 py-10 text-center text-sm text-obsidian/50 inline-flex w-full items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading vault…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-obsidian/50">
              No portal logins saved yet.{" "}
              <Link to="/building-dept-logins/submit" className="text-sky underline underline-offset-2">
                Submit a new login
              </Link>
              .
            </div>
          )}
          {filtered.map((l) => {
            const isOpen = open === l.municipality_slug;
            const expiredCount = l.docs.filter((d) => isDocExpired(d.expiration_date)).length;
            return (
              <div key={l.municipality_slug} className="border-b border-obsidian/10 last:border-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : l.municipality_slug)}
                  className="w-full flex flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-paper-warm/50 transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 text-obsidian/40 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-obsidian truncate">{l.city_name}</div>
                    <div className="text-xs text-obsidian/55 truncate">
                      {l.county === "—" ? "Jurisdiction" : `${l.county} County`}
                    </div>
                  </div>
                  {expiredCount > 0 && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-oxblood border border-oxblood/30 bg-oxblood/10 px-2 py-0.5 rounded-[2px]">
                      {expiredCount} expired
                    </span>
                  )}
                  <StatusBadge status={l.status} />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-12 pb-6 pt-1 space-y-6">
                    <Tabs defaultValue="credentials">
                      <TabsList className="rounded-[3px] bg-paper-warm p-1">
                        <TabsTrigger value="credentials" className="rounded-[3px] font-mono text-[10px] uppercase tracking-[0.12em]">
                          Credentials
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="rounded-[3px] font-mono text-[10px] uppercase tracking-[0.12em]">
                          Contacts
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="contacts" className="mt-5">
                        <MunicipalityContactsTab muni={l.city_name} />
                      </TabsContent>
                      <TabsContent value="credentials" className="mt-5 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          <Field label="Portal">
                            {l.resolvedPortalUrl ? (
                              <a
                                href={l.resolvedPortalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-sky hover:opacity-70"
                              >
                                {l.resolvedPortalUrl.replace(/^https?:\/\//, "")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <div className="text-sm text-obsidian/50">—</div>
                            )}
                          </Field>
                          <Field label="Registration">
                            <div className="text-sm text-obsidian">{l.registration || "—"}</div>
                          </Field>

                          <Field label="Username">
                            <RevealedSecretField municipalitySlug={l.municipality_slug} field="username" />
                          </Field>
                          <Field label="Password">
                            <RevealedSecretField municipalitySlug={l.municipality_slug} field="password" />
                          </Field>

                          <Field label="Portal Features">
                            <div className="flex gap-2">
                              <FeatureTag on={l.e_plan} label="ePlan" />
                              <FeatureTag on={l.derm} label="DERM" />
                            </div>
                          </Field>
                        </div>

                        <div>
                          <div className="eyebrow text-obsidian/55 mb-3">Documents on file</div>
                          {l.docs.length === 0 ? (
                            <div className="border border-dashed border-obsidian/15 px-4 py-6 text-center text-xs text-obsidian/45 rounded-[3px]">
                              No documents uploaded for this municipality yet.
                            </div>
                          ) : (
                            <ul className="border border-obsidian/10 divide-y divide-obsidian/5">
                              {l.docs.map((d) => {
                                const expired = isDocExpired(d.expiration_date);
                                return (
                                  <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                                    <FileText className="h-4 w-4 text-obsidian/40 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-obsidian truncate">{d.doc_label}</div>
                                    </div>
                                    <div
                                      className="font-mono text-[11px] tabular-nums"
                                      style={{ color: expired ? "var(--accent)" : "var(--obsidian)" }}
                                    >
                                      {expired ? "Expired " : "Exp. "}{fmtDate(d.expiration_date)}
                                    </div>
                                    <ViewDocButton path={d.file_path} />
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PortalShell>
  );
}

function StatusBadge({ status }: { status: "active" | "needs_updated" }) {
  const cls =
    status === "active"
      ? "bg-emerald-600/10 text-emerald-700 border-emerald-600/30"
      : "bg-amber-500/10 text-amber-700 border-amber-600/30";
  const label = status === "active" ? "Active" : "Needs Updated";
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] rounded-[2px] ${cls}`}>
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow text-obsidian/45 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch { /* */ }
      }}
      className="p-1.5 text-obsidian/40 hover:text-obsidian transition-colors"
      aria-label="Copy"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/** Username/password only appear after a controlled revealOwnPortalLogin call. */
function RevealedSecretField({
  municipalitySlug,
  field,
}: {
  municipalitySlug: string;
  field: "username" | "password";
}) {
  const reveal = useServerFn(revealOwnPortalLogin);
  const [value, setValue] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [loading, setLoading] = useState(false);

  async function doReveal() {
    if (value) {
      setShown((s) => !s);
      return;
    }
    setLoading(true);
    try {
      const res = await reveal({ data: { municipality_slug: municipalitySlug } });
      if (!res) throw new Error("No credentials on file");
      setValue(field === "username" ? res.username : res.password);
      setShown(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reveal failed");
    } finally {
      setLoading(false);
    }
  }

  const display = !value
    ? "••••••••••••"
    : field === "password" && !shown
      ? "•".repeat(Math.min(value.length, 14))
      : value;

  return (
    <div className="flex items-center gap-1 border border-obsidian/10 bg-paper-warm/50 px-3 py-1.5 rounded-[3px]">
      <span className="flex-1 min-w-0 truncate text-sm text-obsidian font-mono tabular-nums">{display}</span>
      <button
        type="button"
        onClick={() => void doReveal()}
        disabled={loading}
        className="p-1.5 text-obsidian/40 hover:text-obsidian transition-colors"
        aria-label={value && shown ? "Hide" : "Reveal"}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : value && shown ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
      {value && <CopyButton value={value} />}
    </div>
  );
}

function ViewDocButton({ path }: { path: string }) {
  const getUrl = useServerFn(getPortalLoginDocUrlFn);
  const [opening, setOpening] = useState(false);

  async function open() {
    setOpening(true);
    try {
      const { url } = await getUrl({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open file");
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={opening}
      className="font-mono text-[10px] uppercase tracking-[0.12em] text-sky hover:opacity-70 inline-flex items-center gap-1"
    >
      {opening ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      View
    </button>
  );
}

function FeatureTag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 border rounded-[2px]"
      style={
        on
          ? { color: "var(--sky)", borderColor: "color-mix(in oklab, var(--sky) 35%, transparent)", backgroundColor: "color-mix(in oklab, var(--sky) 8%, transparent)" }
          : { color: "color-mix(in oklab, var(--obsidian) 45%, transparent)", borderColor: "color-mix(in oklab, var(--obsidian) 15%, transparent)" }
      }
    >
      {on && <Check className="h-3 w-3" />}
      {label}
    </span>
  );
}
