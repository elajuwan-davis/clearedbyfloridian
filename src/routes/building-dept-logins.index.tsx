import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PortalShell } from "@/components/portal-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, PageShell, Panel, SearchInput, StatusChip } from "@/components/ui-kit";
import { MunicipalityContactsTab } from "@/components/municipal-contacts";
import { MUNICIPALITIES } from "@/lib/municipalities";
import {
  listPortalLoginFlags,
  revealOwnPortalLogin,
  revealPortalLogin,
  type PortalLoginFlag,
} from "@/lib/portal-logins.functions";
import { useSession } from "@/lib/use-session";
import {
  getPortalLoginDocUrlFn,
  isDocExpired,
  listPortalLoginDocuments,
  type PortalLoginDocument,
} from "@/lib/portal-login-docs";
import { toast } from "sonner";
import { friendlyServerError } from "@/lib/server-fn-error";
import {
  ChevronDown, Copy, Eye, EyeOff, FileText, KeyRound, Plus, Search, Check, ExternalLink, Loader2, Upload,
} from "lucide-react";

export const Route = createFileRoute("/building-dept-logins/")({
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
  /** Unique per row: two GCs can hold a login for the same city. */
  key: string;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function enrich(
  flags: PortalLoginFlag[],
  docsByKey: Map<string, PortalLoginDocument[]>,
): EnrichedLogin[] {
  return flags.map((f) => {
    const meta = MUNICIPALITIES.find(
      (m) =>
        m.name.toLowerCase() === f.city_name.toLowerCase() ||
        m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === f.municipality_slug,
    );
    const docs = docsByKey.get(`${f.user_id}:${f.municipality_slug}`) ?? [];
    const expiredCount = docs.filter((d) => isDocExpired(d.expiration_date)).length;
    return {
      ...f,
      key: `${f.user_id}:${f.municipality_slug}`,
      county: meta?.county ?? "—",
      resolvedPortalUrl: f.portal_url || meta?.url || null,
      status: expiredCount > 0 ? "needs_updated" : "active",
      docs,
    };
  });
}

function BuildingDeptLoginsPage() {
  const listFlags = useServerFn(listPortalLoginFlags);
  const session = useSession();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EnrichedLogin[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // Cleard staff get every jurisdiction in the vault; the server ignores "all" for a GC.
      const flags = await listFlags({ data: { scope: "all" } });
      const docs = await listPortalLoginDocuments().catch(() => [] as PortalLoginDocument[]);
      const byKey = new Map<string, PortalLoginDocument[]>();
      for (const d of docs) {
        const k = `${d.user_id}:${d.municipality_slug}`;
        const list = byKey.get(k) ?? [];
        list.push(d);
        byKey.set(k, list);
      }
      const enriched = enrich(flags, byKey);
      setRows(enriched);
      setOpen((prev) => {
        if (prev && enriched.some((r) => r.key === prev)) return prev;
        return enriched[0]?.key ?? null;
      });
    } catch (e) {
      toast.error(friendlyServerError(e, "Failed to load portal logins"));
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
      `${l.city_name} ${l.county} ${l.registration ?? ""} ${l.owner_email ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [query, rows]);

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Workspace" }, { label: "Building Dept Logins" }]}
        title="Building Dept Logins"
        meta={
          loading
            ? "Loading vault…"
            : `${rows.length} jurisdictions · encrypted credentials & document expirations`
        }
        actions={
          <>
            {session.isAdmin && (
              <Link to="/building-dept-logins/import" className="p-btn">
                <Upload className="h-3.5 w-3.5" strokeWidth={2} /> Import sheet
              </Link>
            )}
            <Link to="/building-dept-logins/submit" className="p-btn p-btn-primary">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Submit login
            </Link>
          </>
        }
        toolbar={
          <>
            <div className="p-inset min-w-0 flex-1 sm:max-w-sm">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search municipality, county, registration, owner"
              />
            </div>
            <span className="ml-auto hidden text-[11.5px] text-muted-foreground sm:inline">
              {filtered.length} shown
            </span>
          </>
        }
      >
        <Panel padded={false}>
          {loading && (
            <div className="inline-flex w-full items-center justify-center gap-2 px-3 py-10 text-center text-[12px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading vault…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            rows.length === 0 ? (
              <EmptyState
                icon={<KeyRound className="h-4 w-4" strokeWidth={1.75} />}
                title="Add your first portal login"
                description="Keep the accounts you use on government ePermitting sites here, encrypted. Paste the portal link, your username and your password — that's it."
                action={
                  <Link to="/building-dept-logins/submit" className="p-btn p-btn-primary">
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Add a portal login
                  </Link>
                }
              />
            ) : (
              <div className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                No logins match “{query}”.
              </div>
            )
          )}
          {filtered.map((l) => {
            const isOpen = open === l.key;
            const expiredCount = l.docs.filter((d) => isDocExpired(d.expiration_date)).length;
            const othersLogin = !!session.userId && l.user_id !== session.userId;
            return (
              <div key={l.key} className="border-b border-white/[0.06] last:border-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : l.key)}
                  className="flex w-full flex-wrap items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{l.city_name}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">
                      {l.county === "—" ? "Jurisdiction" : `${l.county} County`}
                      {othersLogin && l.owner_email ? ` · ${l.owner_email}` : ""}
                    </div>
                  </div>
                  {expiredCount > 0 && (
                    <StatusChip tone="danger">{expiredCount} expired</StatusChip>
                  )}
                  <StatusBadge status={l.status} />
                </button>

                {isOpen && (
                  <div className="space-y-4 px-3 pb-4 pt-1 sm:px-9">
                    <Tabs defaultValue="credentials">
                      <TabsList className="h-auto gap-1 bg-white/[0.04] p-1">
                        <TabsTrigger value="credentials" className="h-7 px-3 text-[12px]">
                          Credentials
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="h-7 px-3 text-[12px]">
                          Contacts
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="contacts" className="mt-3">
                        <MunicipalityContactsTab muni={l.city_name} />
                      </TabsContent>
                      <TabsContent value="credentials" className="mt-3 space-y-4">
                        <QuickSignIn
                          municipalitySlug={l.municipality_slug}
                          ownerUserId={othersLogin ? l.user_id : null}
                          portalUrl={l.resolvedPortalUrl}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          <Field label="Portal">
                            {l.resolvedPortalUrl ? (
                              <a
                                href={l.resolvedPortalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[12.5px] text-[#8E4B67] hover:opacity-80"
                              >
                                {l.resolvedPortalUrl.replace(/^https?:\/\//, "")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <div className="text-[12.5px] text-muted-foreground">—</div>
                            )}
                          </Field>
                          <Field label="Registration">
                            <div className="text-[12.5px]">{l.registration || "—"}</div>
                          </Field>

                          <Field label="Username">
                            <RevealedSecretField
                              municipalitySlug={l.municipality_slug}
                              ownerUserId={othersLogin ? l.user_id : null}
                              field="username"
                            />
                          </Field>
                          <Field label="Password">
                            <RevealedSecretField
                              municipalitySlug={l.municipality_slug}
                              ownerUserId={othersLogin ? l.user_id : null}
                              field="password"
                            />
                          </Field>

                          <Field label="Portal Features">
                            <div className="flex gap-2">
                              <FeatureTag on={l.e_plan} label="ePlan" />
                              <FeatureTag on={l.derm} label="DERM" />
                            </div>
                          </Field>
                        </div>

                        <div>
                          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Documents on file</div>
                          {l.docs.length === 0 ? (
                            <div className="p-surface-flat px-4 py-6 text-center text-[12px] text-muted-foreground">
                              No documents uploaded for this municipality yet.
                            </div>
                          ) : (
                            <ul className="p-surface-flat divide-y divide-white/[0.06]">
                              {l.docs.map((d) => {
                                const expired = isDocExpired(d.expiration_date);
                                return (
                                  <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                      <div className="truncate text-[12.5px]">{d.doc_label}</div>
                                    </div>
                                    <div
                                      className={`text-[11.5px] tabular-nums ${expired ? "text-[#8C3B3B]" : "text-muted-foreground"}`}
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
        </Panel>
      </PageShell>
    </PortalShell>
  );
}

function StatusBadge({ status }: { status: "active" | "needs_updated" }) {
  return status === "active" ? (
    <StatusChip tone="success">Active</StatusChip>
  ) : (
    <StatusChip tone="warning">Needs updated</StatusChip>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
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
      className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Copy"
    >
      {done ? <Check className="h-3.5 w-3.5 text-[#4E6B5C]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/**
 * Password-manager style hand-off: one click copies the username and opens the portal,
 * the next swaps the clipboard to the password. A page cannot type into another origin's
 * login form, so this is deliberately paste-paste rather than autofill.
 */
function QuickSignIn({
  municipalitySlug,
  ownerUserId,
  portalUrl,
}: {
  municipalitySlug: string;
  ownerUserId: string | null;
  portalUrl: string | null;
}) {
  const revealOwn = useServerFn(revealOwnPortalLogin);
  const revealAsStaff = useServerFn(revealPortalLogin);
  const [creds, setCreds] = useState<{ username: string; password: string } | null>(null);
  const [stage, setStage] = useState<"username" | "password">("username");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (creds) return creds;
    const res = ownerUserId
      ? await revealAsStaff({ data: { user_id: ownerUserId, municipality_slug: municipalitySlug } })
      : await revealOwn({ data: { municipality_slug: municipalitySlug } });
    if (!res) throw new Error("No credentials on file");
    const next = { username: res.username, password: res.password };
    setCreds(next);
    return next;
  }

  async function handleClick() {
    setBusy(true);
    try {
      const c = await load();
      if (stage === "username") {
        await navigator.clipboard.writeText(c.username);
        const opened = portalUrl ? window.open(portalUrl, "_blank", "noopener,noreferrer") : null;
        if (portalUrl && !opened) {
          toast.warning(
            "Username copied — your browser blocked the new tab, use the Portal link below.",
          );
        } else {
          toast.success("Username copied. Paste it, then click Copy password.");
        }
        setStage("password");
      } else {
        await navigator.clipboard.writeText(c.password);
        toast.success("Password copied. Paste it to sign in.");
        setStage("username");
      }
    } catch (e) {
      toast.error(friendlyServerError(e, "Could not copy credentials"));
    } finally {
      setBusy(false);
    }
  }

  const label =
    stage === "password"
      ? "Copy password"
      : portalUrl
        ? "Copy username & open portal"
        : "Copy username";

  return (
    <div className="p-surface-flat flex flex-wrap items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className="p-btn p-btn-primary"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : stage === "password" ? (
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        {label}
      </button>
      <span className="text-[11.5px] text-muted-foreground">
        {stage === "password"
          ? "Username is on your clipboard — paste it, then copy the password."
          : portalUrl
            ? "Opens the department portal with the username copied, password one click behind."
            : "No portal link saved for this jurisdiction — add one on the login."}
      </span>
    </div>
  );
}

/**
 * Username/password only appear after a controlled reveal call: the owner's own row
 * goes through revealOwnPortalLogin, another GC's row through the staff-only reveal.
 */
function RevealedSecretField({
  municipalitySlug,
  ownerUserId,
  field,
}: {
  municipalitySlug: string;
  ownerUserId: string | null;
  field: "username" | "password";
}) {
  const revealOwn = useServerFn(revealOwnPortalLogin);
  const revealAsStaff = useServerFn(revealPortalLogin);
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
      const res = ownerUserId
        ? await revealAsStaff({
            data: { user_id: ownerUserId, municipality_slug: municipalitySlug },
          })
        : await revealOwn({ data: { municipality_slug: municipalitySlug } });
      if (!res) throw new Error("No credentials on file");
      setValue(field === "username" ? res.username : res.password);
      setShown(true);
    } catch (e) {
      toast.error(friendlyServerError(e, "Could not reveal this credential"));
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
    <div className="p-inset flex items-center gap-1 px-2 py-1">
      <span className="min-w-0 flex-1 truncate text-[12.5px] tabular-nums">{display}</span>
      <button
        type="button"
        onClick={() => void doReveal()}
        disabled={loading}
        className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
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
      toast.error(friendlyServerError(e, "Could not open file"));
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={opening}
      className="inline-flex items-center gap-1 text-[11.5px] text-[#8E4B67] hover:opacity-80"
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
          : { color: "var(--p-text-2)", borderColor: "var(--p-border)" }
      }
    >
      {on && <Check className="h-3 w-3" />}
      {label}
    </span>
  );
}
