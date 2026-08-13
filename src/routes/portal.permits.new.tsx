import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Upload,
  Check,
  FileText,
  ArrowLeft,
  Send,
  X,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  Store,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { CloudUploadButtons } from "@/components/cloud-upload-buttons";
import { ComboboxInput } from "@/components/combobox-input";
import { AddressLookupField } from "@/components/address-lookup-field";
import { MultiSelectCombobox } from "@/components/multi-select-combobox";
import { activeProvider, resolveMunicipality, type ResolvedAddress } from "@/lib/address-lookup";
import {
  createPermit,
  updatePermit,
  getPermit,
  type PermitDoc,
  type PermitRow,
  type PermitSub,
} from "@/lib/permits-api";
import { listSubs, createSub, type SubRow } from "@/lib/subs-api";
import {
  listDesignPros,
  createDesignPro,
  type DesignProRow,
  type DesignProRole,
} from "@/lib/design-pros-api";
import { triggerNotification } from "@/lib/notifications-api";
import { MUNICIPALITIES } from "@/lib/municipalities";
import { getChecklist } from "@/lib/permit-checklists";
import { bundleFromSubs } from "@/lib/bundle";
import { NocAwarenessRibbon } from "@/components/noc-awareness-ribbon";
import { TradesOnJobPanel } from "@/components/trades-on-job-panel";
import { VictoriaIntelligencePanel } from "@/components/victoria-intelligence-panel";
import { logPermitIntelligence } from "@/lib/intelligence";
import { DispatchCard } from "@/components/dispatch-card";
import { runDispatch, type DispatchResult } from "@/lib/dispatch";
import { MunicipalityReadinessPanel } from "@/components/municipality-readiness-panel";
import type { SubmittalDocSnapshot } from "@/lib/submittal-package";
import type { GcDocKey } from "@/lib/gc-compliance";
import { draftScope, type ScopeDraft } from "@/lib/scope-draft";
import {
  CLEARD_CONTRACTOR_BLANKS,
  CLEARD_CONTRACTOR_DEFAULTS,
  isPlaceholderValue,
} from "@/lib/contractor-defaults";
import {
  coverageGaps,
  listMarketplaceRoster,
  marketplaceRosterCount,
  marketplaceUnlocked,
  type CoverageGap,
  type MarketplaceSub,
} from "@/lib/marketplace";
import { createSubUpdateRequest } from "@/lib/insurance-requests-api";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/portal/permits/new")({
  validateSearch: (search: Record<string, unknown>): { edit?: string } =>
    typeof search.edit === "string" ? { edit: search.edit } : {},
  head: () => ({
    meta: [{ title: "New Permit Intake — Cleard" }, { name: "robots", content: "noindex" }],
  }),
  component: NewPermitPage,
});

const SCOPE_OPTIONS = [
  "Pool / Spa",
  "Hardscape / Pavers",
  "Electrical",
  "Plumbing",
  "Gas",
  "Mechanical / HVAC",
  "Structural",
  "Roofing",
  "Fence",
  "Demolition",
  "Other",
] as const;

// Every scope option maps to a subcontractor trade label. Trades in
// OPTIONAL_SCOPES don't strictly require a sub license (structural/hardscape/
// demo/other) — the row still renders but is labelled "optional".
const SCOPE_TO_TRADE: Record<string, string> = {
  "Pool / Spa": "Pool / Spa",
  "Hardscape / Pavers": "Hardscape / Pavers",
  Electrical: "Electrical",
  Plumbing: "Plumbing",
  Gas: "Gas / LP",
  "Mechanical / HVAC": "Mechanical / HVAC",
  Structural: "Structural",
  Roofing: "Roofing",
  Fence: "Fence",
  Demolition: "Demolition",
  Other: "Other",
};
const OPTIONAL_SCOPES = new Set(["Hardscape / Pavers", "Structural", "Demolition", "Other"]);

type DocState = { uploaded: string | null; na: boolean; deferred: boolean };

type SubIntake = {
  /** The scope name that spawned this row (stable key). */
  scope: string;
  trade: string;
  companyName: string;
  licenseNumber: string;
  contactName: string;
  contactEmail: string;
  /** GC clicked "Skip for now" on this specific trade row. */
  skipped: boolean;
  /** Set when the row was filled from Cleard's paid marketplace roster. */
  marketplaceSubId: string | null;
};

const emptySub = (scope: string): SubIntake => ({
  scope,
  trade: SCOPE_TO_TRADE[scope] ?? scope,
  companyName: "",
  licenseNumber: "",
  contactName: "",
  contactEmail: "",
  skipped: false,
  marketplaceSubId: null,
});

/** A row the GC has started filling in must be finished, or explicitly skipped. */
function subRowMissingFields(s: SubIntake): string[] {
  const touched =
    s.companyName.trim() || s.licenseNumber.trim() || s.contactName.trim() || s.contactEmail.trim();
  if (s.skipped || !touched) return [];
  const missing: string[] = [];
  if (!s.companyName.trim()) missing.push("Company Name");
  if (!s.licenseNumber.trim()) missing.push("License #");
  if (!s.contactName.trim()) missing.push("Contact Name");
  if (!s.contactEmail.trim()) missing.push("Contact Email");
  return missing;
}

function NewPermitPage() {
  const navigate = useNavigate();
  const session = useSession();
  const { edit: editId } = Route.useSearch();
  const isEditing = !!editId;
  const [savedSubs, setSavedSubs] = useState<SubRow[]>([]);
  const [savedPros, setSavedPros] = useState<DesignProRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditing);
  const [originalRow, setOriginalRow] = useState<PermitRow | null>(null);
  const [subsSkipped, setSubsSkipped] = useState(false);
  const [docsSkipped, setDocsSkipped] = useState(false);
  const [saveArchitectToContacts, setSaveArchitectToContacts] = useState(false);
  const [saveEngineerToContacts, setSaveEngineerToContacts] = useState(false);
  const [dispatch, setDispatch] = useState<DispatchResult | null>(null);
  const [dispatchConfirmed, setDispatchConfirmed] = useState(false);
  const [submittalPackage, setSubmittalPackage] = useState<SubmittalDocSnapshot[]>([]);
  const [scopeDrafting, setScopeDrafting] = useState(false);
  const [scopeDraft, setScopeDraft] = useState<ScopeDraft | null>(null);
  const [initialSubmittalKeys, setInitialSubmittalKeys] = useState<GcDocKey[] | undefined>(
    undefined,
  );
  const [rosterUnlocked, setRosterUnlocked] = useState(false);
  const [roster, setRoster] = useState<MarketplaceSub[]>([]);
  const [rosterCount, setRosterCount] = useState(0);
  const [pickerScope, setPickerScope] = useState<string | null>(null);
  const [coverageAsked, setCoverageAsked] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [form, setForm] = useState({
    step: 1 as 1 | 2,
    projectName: "",
    address: "",
    municipality: "",
    scopes: [] as string[],
    description: "",
    subs: [] as SubIntake[],
    totalProjectValue: "" as string, // dollars, whole number
    submittedDate: new Date().toISOString().slice(0, 10),
    architectFirm: "",
    architectContact: "",
    architectLicense: "",
    architectEmail: "",
    engineerFirm: "",
    engineerContact: "",
    engineerLicense: "",
    engineerEmail: "",
    ...CLEARD_CONTRACTOR_DEFAULTS,
    /** Checked = GC supplies its own qualifier instead of Cleard's defaults. */
    differentQualifier: false,
    municipalityRegistered: "" as "" | "yes" | "no",
    ownerName: "",
    ownerEntity: "",
    signerPhone: "",
    signerEmail: "",
    additionalNotes: "",
    docs: {} as Record<string, DocState>,
    extraDocs: [] as string[],
  });

  useEffect(() => {
    listSubs()
      .then(setSavedSubs)
      .catch(() => {});
  }, []);
  useEffect(() => {
    listDesignPros()
      .then(setSavedPros)
      .catch(() => {});
  }, []);
  useEffect(() => {
    marketplaceRosterCount()
      .then(setRosterCount)
      .catch(() => {});
    marketplaceUnlocked()
      .then(async (unlocked) => {
        setRosterUnlocked(unlocked);
        if (unlocked) setRoster(await listMarketplaceRoster());
      })
      .catch(() => {});
  }, []);

  // ---- Draft auto-save (new permits only) ----------------------------------
  // The intake is long, so the form auto-saves itself locally as the GC types.
  // Nothing is written to the permit record until they submit, so a draft can
  // be kept with any number of fields still empty.
  const DRAFT_KEY = "cleard.permit-intake.draft.v1";
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftHydrated = useRef(false);

  useEffect(() => {
    if (isEditing) {
      draftHydrated.current = true;
      return;
    }
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { savedAt?: string; form?: Record<string, unknown> };
        if (parsed?.form) {
          setForm((f) => ({ ...f, ...(parsed.form as typeof f) }));
          setDraftSavedAt(parsed.savedAt ?? null);
          setDraftRestored(true);
        }
      }
    } catch {
      /* ignore malformed drafts */
    }
    draftHydrated.current = true;
  }, [isEditing]);

  useEffect(() => {
    if (isEditing || !draftHydrated.current) return;
    const t = window.setTimeout(() => {
      try {
        const savedAt = new Date().toISOString();
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt, form }));
        setDraftSavedAt(savedAt);
      } catch {
        /* storage full or unavailable — drafting is best-effort */
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [form, isEditing]);

  function discardDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setDraftSavedAt(null);
    setDraftRestored(false);
    window.location.reload();
  }


  // Load existing permit for editing
  useEffect(() => {
    if (!editId) return;
    getPermit(editId)
      .then((r) => {
        if (!r) {
          toast.error("Permit not found");
          return;
        }
        setOriginalRow(r);
        const ip = (r.intake_payload ?? {}) as Record<string, any>;
        const architect = (ip.architect ?? {}) as Record<string, string>;
        const engineer = (ip.engineer ?? {}) as Record<string, string>;
        const docsMap: Record<string, DocState> = {};
        for (const d of r.documents ?? []) {
          docsMap[d.key] = {
            uploaded: d.status === "uploaded" ? d.filename : null,
            na: d.status === "not_applicable",
            deferred: d.status === "pending",
          };
        }
        const loadedScopes = r.permit_type ? r.permit_type.split(" · ").filter(Boolean) : [];
        // Reunite persisted subs with the scopes that spawned them; scopes
        // with no matching persisted sub get an empty row.
        const loadedSubs: SubIntake[] = loadedScopes.map((scope) => {
          const trade = SCOPE_TO_TRADE[scope] ?? scope;
          const match = (r.subs ?? []).find((s) => (s.trade ?? "") === trade);
          if (!match) return emptySub(scope);
          return {
            scope,
            trade,
            companyName: match.companyName ?? "",
            licenseNumber: match.licenseNumber ?? "",
            contactName: match.qualifierName ?? "",
            contactEmail: match.contactEmail ?? "",
            skipped: false,
            marketplaceSubId:
              (match as { marketplaceSubId?: string | null }).marketplaceSubId ?? null,
          };
        });
        setForm((f) => ({
          ...f,
          projectName: r.project_name ?? "",
          address: r.job_address ?? "",
          municipality: r.municipality ?? "",
          scopes: loadedScopes,
          description: r.description ?? "",
          subs: loadedSubs,
          submittedDate: r.submitted_date ?? f.submittedDate,
          totalProjectValue: (r as any).total_project_value_cents
            ? String(Math.round((r as any).total_project_value_cents / 100))
            : "",
          architectFirm: architect.firm ?? "",
          architectContact: architect.contact ?? "",
          architectLicense: architect.license ?? "",
          architectEmail: architect.email ?? "",
          engineerFirm: engineer.firm ?? "",
          engineerContact: engineer.contact ?? "",
          engineerLicense: engineer.license ?? "",
          engineerEmail: engineer.email ?? "",
          contractorCompany: r.contractor_company ?? "",
          contractorQualifier: r.contractor_qualifier ?? "",
          companyAddress: r.company_address ?? "",
          poc: r.poc ?? f.poc,
          pocPhone: r.poc_phone ?? f.pocPhone,
          pocEmail: r.poc_email ?? f.pocEmail,
          licenseNumber: r.license_number ?? "",
          differentQualifier: Boolean(ip.different_qualifier),
          municipalityRegistered:
            ip.municipality_registered === true
              ? "yes"
              : ip.municipality_registered === false
                ? "no"
                : "",
          ownerName: r.owner_name ?? "",
          ownerEntity: r.owner_entity ?? "",
          signerPhone: r.signer_phone ?? "",
          signerEmail: r.signer_email ?? "",
          additionalNotes: r.additional_notes ?? "",
          docs: docsMap,
          extraDocs: r.extra_docs ?? [],
        }));
        const savedDispatch = (ip.dispatch ?? null) as DispatchResult | null;
        if (savedDispatch) {
          setDispatch(savedDispatch);
          setDispatchConfirmed(Boolean(ip.dispatch_confirmed_at));
        }
        const savedPkg = (ip.compliance_submittal ?? []) as SubmittalDocSnapshot[];
        if (Array.isArray(savedPkg) && savedPkg.length) {
          setSubmittalPackage(savedPkg);
          setInitialSubmittalKeys(savedPkg.map((s) => s.key));
        }
      })
      .catch(() => toast.error("Could not load permit for editing"))
      .finally(() => setLoadingEdit(false));
  }, [editId]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function updateDoc(key: string, patch: Partial<DocState>) {
    setForm((f) => ({ ...f, docs: { ...f.docs, [key]: { ...f.docs[key], ...patch } } }));
  }

  /** Cleard's contractor block is a default, not a lock: this clears it so the
   *  GC can enter its own qualifier, and restores it when unchecked. */
  function toggleDifferentQualifier(on: boolean) {
    setForm((f) => ({
      ...f,
      differentQualifier: on,
      ...(on ? CLEARD_CONTRACTOR_BLANKS : CLEARD_CONTRACTOR_DEFAULTS),
    }));
  }

  /** On-demand scope draft — same edge function the green-transition trigger calls. */
  async function runScopeDraft() {
    setScopeDrafting(true);
    try {
      const draft = await draftScope({
        permitId: editId,
        description: form.description,
        projectName: form.projectName,
        permitType: form.scopes.join(" · "),
        municipality: form.municipality,
        jobAddress: form.address,
      });
      setScopeDraft(draft);
      toast.success("Formal scope drafted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not draft the scope");
    } finally {
      setScopeDrafting(false);
    }
  }

  /** Toggling a scope also spawns / retires its inline sub row (1:1). */
  function toggleScope(scope: string) {
    setForm((f) => {
      const has = f.scopes.includes(scope);
      if (has) {
        return {
          ...f,
          scopes: f.scopes.filter((s) => s !== scope),
          subs: f.subs.filter((s) => s.scope !== scope),
        };
      }
      const trade = SCOPE_TO_TRADE[scope] ?? scope;
      // If a filled sub already exists for the same trade (e.g. Pool
      // and Pool/Spa both mapping to Pool trade), reuse its data.
      const existing = f.subs.find((s) => s.trade === trade && s.companyName.trim() && !s.skipped);
      const seed: SubIntake = existing ? { ...existing, scope, skipped: false } : emptySub(scope);
      return { ...f, scopes: [...f.scopes, scope], subs: [...f.subs, seed] };
    });
  }

  function updateSubByScope(scope: string, patch: Partial<SubIntake>) {
    setForm((f) => ({
      ...f,
      subs: f.subs.map((s) => (s.scope === scope ? { ...s, ...patch } : s)),
    }));
  }

  function toggleSubSkip(scope: string) {
    setForm((f) => ({
      ...f,
      subs: f.subs.map((s) =>
        s.scope === scope
          ? s.skipped
            ? { ...s, skipped: false }
            : {
                ...s,
                skipped: true,
                companyName: "",
                licenseNumber: "",
                contactName: "",
                contactEmail: "",
              }
          : s,
      ),
    }));
  }

  /** Insurance/licensing this project needs a sub to carry. */
  const insuranceRequirements = useMemo(
    () => ({ coverageNeededThrough: form.submittedDate || null, w9Required: true }),
    [form.submittedDate],
  );

  /** Fill a trade row from the GC's own saved subcontractor library. */
  function pickSavedSub(scope: string, sub: SubRow) {
    const contact = [sub.contact_first_name, sub.contact_last_name].filter(Boolean).join(" ");
    updateSubByScope(scope, {
      companyName: sub.company_name,
      licenseNumber: sub.license_number ?? "",
      contactName: contact || sub.qualifier_name || "",
      contactEmail: sub.email ?? "",
      marketplaceSubId: null,
      skipped: false,
    });
  }

  /** Fill a trade row from Cleard's paid roster. */
  function pickMarketplaceSub(scope: string, sub: MarketplaceSub) {
    updateSubByScope(scope, {
      companyName: sub.company_name,
      licenseNumber: sub.license_number ?? "",
      contactName: sub.qualifier_name ?? "",
      contactEmail: sub.email ?? "",
      marketplaceSubId: sub.id,
      skipped: false,
    });
    setPickerScope(null);
  }


  function gapsForRow(s: SubIntake): CoverageGap[] {
    if (!s.marketplaceSubId) return [];
    const sub = roster.find((r) => r.id === s.marketplaceSubId);
    if (!sub) return [];
    return coverageGaps(sub, insuranceRequirements);
  }

  /** Disclosure follow-up: ask the sub to raise its cover for this project. */
  async function askForCoverageUpgrade(s: SubIntake, gaps: CoverageGap[]) {
    const tenantId = session.effectiveTenantId;
    if (!tenantId || !s.marketplaceSubId) {
      toast.error("Could not identify your workspace — try again after the page finishes loading.");
      return;
    }
    try {
      await createSubUpdateRequest({
        tenantId,
        subcontractorId: s.marketplaceSubId,
        details: `Coverage upgrade requested for ${form.projectName || "an upcoming project"}${
          form.address ? ` at ${form.address}` : ""
        }. ${s.companyName} does not currently meet this project's requirements: ${gaps
          .map((g) => g.message)
          .join("; ")}.`,
      });
      setCoverageAsked((prev) => [...prev, s.scope]);
      toast.success(`Cleard will ask ${s.companyName} to upgrade coverage`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the request");
    }
  }

  /** Called when the address lookup resolves an address (Google or Census).
   *  Municipality detection lives in @/lib/address-lookup so the provider can
   *  be swapped without touching this form. Incorporated cities resolve to the
   *  city; unincorporated areas resolve to "Unincorporated <County> County". */
  async function handleAddressResolved(r: ResolvedAddress) {
    const { municipality: resolvedMuni, matchedList, unincorporated } = resolveMunicipality(r);

    setForm((f) => ({
      ...f,
      address: r.streetLine || r.formatted,
      municipality: resolvedMuni || f.municipality,
    }));
    if (resolvedMuni) {
      toast.success(
        unincorporated
          ? `Unincorporated area — routed to ${resolvedMuni}`
          : matchedList
            ? `Matched municipality: ${resolvedMuni}`
            : `City set to ${resolvedMuni} (not in list — please verify)`,
      );
    }
    // Kick off Dispatch — pre-flight property intelligence. Dispatch geocodes what it is
    // given, and the Census geocoder cannot place a bare street line, so send the whole
    // address rather than the street line the permit is stored under.
    const resolvedAddress =
      r.formatted ||
      [r.streetLine, r.city, [r.state, r.postalCode].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ");
    if (resolvedAddress) {
      const result = await runDispatch({
        address: resolvedAddress,
        city: resolvedMuni || r.city || null,
        county: r.county,
      });
      setDispatch(result);
      setDispatchConfirmed(false);
    }
  }

  const primaryType = form.scopes[0] || "Other";
  const checklist = useMemo(
    () => getChecklist(form.municipality, primaryType),
    [form.municipality, primaryType],
  );

  const docsComplete = useMemo(
    () =>
      checklist.filter((d) => {
        const s = form.docs[d.key];
        return s && (s.uploaded || s.na || s.deferred);
      }).length,
    [form.docs, checklist],
  );

  const filledSubs = form.subs.filter((s) => s.companyName.trim());

  /** Every required field, checked in one place — nothing is written until
   *  this comes back empty. Step is carried so the form can jump back to it. */
  function missingRequired(): { label: string; step: 1 | 2 }[] {
    const out: { label: string; step: 1 | 2 }[] = [];
    const need = (ok: boolean, label: string, step: 1 | 2) => {
      if (!ok) out.push({ label, step });
    };
    const email = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

    need(!!form.projectName.trim(), "Project Name", 1);
    need(!!form.address.trim(), "Property Address", 1);
    need(!!form.municipality.trim(), "Municipality / City", 1);
    need(Number(form.totalProjectValue) > 0, "Total Project Value", 1);
    need(form.scopes.length > 0, "Scope of Work", 1);
    need(!!form.municipalityRegistered, "Registered with this municipality?", 1);

    for (const s of form.subs) {
      for (const f of subRowMissingFields(s)) out.push({ label: `${s.trade} — ${f}`, step: 1 });
      if (!s.skipped && s.contactEmail.trim() && !email(s.contactEmail))
        out.push({ label: `${s.trade} — Contact Email is not a valid email`, step: 1 });
    }

    need(!!form.contractorCompany.trim(), "Contractor Company Name", 2);
    need(!!form.contractorQualifier.trim(), "Contractor Qualifier Name", 2);
    need(!!form.companyAddress.trim(), "Company Address", 2);
    need(!!form.poc.trim(), "Point of Contact", 2);
    need(!!form.pocPhone.trim(), "POC Phone", 2);
    need(email(form.pocEmail), "POC Email", 2);
    need(!!form.licenseNumber.trim(), "License Number", 2);
    if (form.signerEmail.trim() && !email(form.signerEmail))
      out.push({ label: "Signer Email is not a valid email", step: 2 });

    return out;
  }

  const missingNow = missingRequired();
  const missingLabels = new Set(missingNow.map((m) => m.label));
  const invalidCls = (label: string) =>
    showErrors && missingLabels.has(label) ? " border-red-500 bg-red-50/40" : "";
  const wantBundle = filledSubs.length >= 2;

  // True once this permit exists AND has an auto-generated NOC on file.
  const hasNoc = useMemo(
    () =>
      (originalRow?.documents ?? []).some(
        (d) => d.key === "notice_of_commencement_review" && d.status === "uploaded",
      ),
    [originalRow],
  );

  // Trades already added to this permit (edit mode) or being added right
  // now (new mode) — feeds the "Trades on this Job" panel and the reuse
  // suggestion logic.
  const jobTrades = useMemo(
    () => filledSubs.map((s) => ({ trade: s.trade, companyName: s.companyName })),
    [filledSubs],
  );

  const [dismissedReuse, setDismissedReuse] = useState<Set<number>>(new Set());
  function dismissReuse(idx: number) {
    setDismissedReuse((prev) => {
      const n = new Set(prev);
      n.add(idx);
      return n;
    });
  }

  /** For an empty sub row of a given trade, find an already-filled sub on
   *  the same job with the same trade — that's the reuse candidate. */
  function reuseCandidateFor(idx: number): SubIntake | null {
    if (dismissedReuse.has(idx)) return null;
    const row = form.subs[idx];
    if (!row || row.companyName.trim()) return null;
    const match = form.subs.find(
      (s, i) => i !== idx && s.trade === row.trade && s.companyName.trim(),
    );
    return match ?? null;
  }

  function applyReuse(idx: number, source: SubIntake) {
    setForm((f) => ({
      ...f,
      subs: f.subs.map((s, i) => (i === idx ? { ...source, trade: s.trade } : s)),
    }));
  }

  function handleFile(key: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) updateDoc(key, { uploaded: file.name, na: false, deferred: false });
  }
  function handleDrop(key: string, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) updateDoc(key, { uploaded: file.name, na: false, deferred: false });
  }
  function handleExtraFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 30 - form.extraDocs.length);
    if (files.length) update("extraDocs", [...form.extraDocs, ...files.map((f) => f.name)]);
  }

  async function maybeSaveDesignPro(
    role: DesignProRole,
    save: boolean,
    firm: string,
    contact: string,
    license: string,
    email: string,
  ) {
    if (!save || !firm.trim()) return;
    const exists = savedPros.find(
      (p) => p.role === role && p.firm_name.trim().toLowerCase() === firm.trim().toLowerCase(),
    );
    if (exists) return;
    try {
      await createDesignPro({
        role,
        firm_name: firm.trim(),
        contact_name: contact || null,
        license_number: license || null,
        email: email || null,
      });
    } catch {
      /* best-effort */
    }
  }

  async function submit() {
    const missing = missingRequired();
    if (missing.length) {
      setShowErrors(true);
      update("step", missing[0].step);
      toast.error(
        `${missing.length} required field${missing.length > 1 ? "s" : ""} still empty: ${missing
          .map((m) => m.label)
          .join(", ")}`,
      );
      return;
    }

    setSaving(true);
    try {
      for (const s of filledSubs) {
        const exists = savedSubs.find(
          (x) => x.company_name.trim().toLowerCase() === s.companyName.trim().toLowerCase(),
        );
        if (!exists) {
          await createSub({
            company_name: s.companyName,
            trade: s.trade,
            qualifier_name: s.contactName || null,
            license_number: s.licenseNumber || null,
            email: s.contactEmail || null,
          }).catch(() => {});
        }
      }

      await maybeSaveDesignPro(
        "architect",
        saveArchitectToContacts,
        form.architectFirm,
        form.architectContact,
        form.architectLicense,
        form.architectEmail,
      );
      await maybeSaveDesignPro(
        "engineer",
        saveEngineerToContacts,
        form.engineerFirm,
        form.engineerContact,
        form.engineerLicense,
        form.engineerEmail,
      );

      const documents: PermitDoc[] = checklist.map((d) => {
        const s = form.docs[d.key] ?? { uploaded: null, na: false, deferred: false };
        const status: PermitDoc["status"] = s.uploaded
          ? "uploaded"
          : s.deferred
            ? "pending"
            : s.na
              ? "not_applicable"
              : "missing";
        return { key: d.key, label: d.label, required: d.required, status, filename: s.uploaded };
      });

      const priorSubs = (originalRow?.subs ?? []) as PermitSub[];
      const subs: PermitSub[] = filledSubs.map((s) => {
        // Preserve existing per-sub state (accessToken, confirmed) when
        // this permit is being edited and the same company reappears.
        const prior = priorSubs.find(
          (p) => (p.companyName ?? "").trim().toLowerCase() === s.companyName.trim().toLowerCase(),
        );
        return {
          trade: s.trade,
          companyName: s.companyName,
          qualifierName: s.contactName,
          licenseNumber: s.licenseNumber,
          contactEmail: s.contactEmail,
          accessToken: prior?.accessToken ?? crypto.randomUUID(),
          confirmed: prior?.confirmed ?? false,
          confirmedAt: prior?.confirmedAt,
          ...(s.marketplaceSubId ? { marketplaceSubId: s.marketplaceSubId } : {}),
        };
      });

      const priorPayload = (originalRow?.intake_payload ?? {}) as Record<string, unknown>;
      const intake_payload: Record<string, unknown> = {
        ...priorPayload,
        architect: {
          firm: form.architectFirm || "",
          contact: form.architectContact || "",
          license: form.architectLicense || "",
          email: form.architectEmail || "",
        },
        engineer: {
          firm: form.engineerFirm || "",
          contact: form.engineerContact || "",
          license: form.engineerLicense || "",
          email: form.engineerEmail || "",
        },
      };
      intake_payload.municipality_registered = form.municipalityRegistered === "yes";
      intake_payload.different_qualifier = form.differentQualifier;
      if (wantBundle) intake_payload.bundle = bundleFromSubs(subs);
      if (isEditing) intake_payload.last_edited_at = new Date().toISOString();
      if (dispatch) {
        intake_payload.dispatch = dispatch;
        if (dispatchConfirmed) intake_payload.dispatch_confirmed_at = new Date().toISOString();
      }
      // Snapshot the compliance docs the GC chose to attach to this submittal.
      // Persist even an empty array so a later "cleared all" reflects on the permit.
      intake_payload.compliance_submittal = submittalPackage;

      const permitPatch = {
        project_name: form.projectName,
        job_address: form.address,
        municipality: form.municipality || null,
        permit_type: form.scopes.join(" · ") || "Other",
        description: form.description || null,
        additional_notes: form.additionalNotes || null,
        owner_name: form.ownerName || null,
        owner_entity: form.ownerEntity || null,
        contractor_company: form.contractorCompany || null,
        contractor_qualifier: form.contractorQualifier || null,
        company_address: form.companyAddress || null,
        poc: form.poc || null,
        poc_phone: form.pocPhone || null,
        poc_email: form.pocEmail || null,
        license_number: form.licenseNumber || null,
        signer_phone: form.signerPhone || null,
        signer_email: form.signerEmail || null,
        submitted_date: form.submittedDate || null,
        subs,
        documents,
        extra_docs: form.extraDocs,
        intake_payload,
        total_project_value_cents: form.totalProjectValue
          ? Math.round(Number(form.totalProjectValue) * 100)
          : null,
      };

      let rowId: string;
      if (isEditing && editId) {
        const updated = await updatePermit(editId, permitPatch);
        rowId = updated.id;
        try {
          await triggerNotification({
            kind: "submission_received",
            title: `Permit submission updated — ${updated.project_name}`,
            body: `${form.contractorCompany || "GC"} updated permit submission on ${new Date().toLocaleDateString()}. Review changes.`,
            permit_id: updated.id,
          });
        } catch {
          /* best-effort */
        }
        toast.success("Submission updated");
        navigate({ to: "/portal/permits/$id", params: { id: rowId } });
      } else {
        const row = await createPermit({ ...permitPatch, status: "submitted" });
        rowId = row.id;
        // Auto-generate internal NTBO (hidden from GC). Best-effort.
        void import("@/lib/ntbo-auto").then((m) => m.autoGenerateNTBOForPermit(row));
        // Auto-generate NOC (Palm Beach County std form) pre-filled from
        // permit data — surfaces in the permit detail as "Review & Sign".
        void import("@/lib/noc-auto").then((m) => m.autoGenerateNOCForPermit(row));
        // Log to Victoria's intelligence pool.
        void logPermitIntelligence({
          tenantId: (row as unknown as { tenant_id?: string | null }).tenant_id ?? null,
          permitId: row.id,
          municipalityName: form.municipality || null,
          trades: form.scopes,
          scopeOfWork: form.description || null,
          submittedDate: form.submittedDate ? new Date(form.submittedDate).toISOString() : null,
        });

        toast.success(wantBundle ? "Bundle permit created" : "Permit created");
        if (wantBundle) navigate({ to: "/portal/permits/$id/bundle", params: { id: rowId } });
        else navigate({ to: "/portal/permits/$id", params: { id: rowId } });
      }
    } catch (e) {
      toast.error(
        (isEditing ? "Failed to update permit: " : "Failed to create permit: ") +
          (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]";
  const labelCls =
    "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";
  const sectionCls = "text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Permit Intake</div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="display-serif text-4xl sm:text-5xl text-obsidian">
              {isEditing ? "Edit Submission" : "New Permit"}
            </h1>
            <Link
              to="/my-permits"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian"
            >
              Cancel
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-3">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 grid place-items-center rounded-full font-mono text-[11px] ${form.step >= n ? "bg-obsidian text-paper" : "bg-obsidian/10 text-obsidian/50"}`}
                >
                  {n}
                </div>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.14em] ${form.step === n ? "text-obsidian" : "text-obsidian/45"}`}
                >
                  {n === 1 ? "Project Details" : "Contact & Documents"}
                </span>
                {n === 1 && <div className="w-8 h-px bg-obsidian/15" />}
              </div>
            ))}
          </div>
        </div>

        {form.step === 1 ? (
          <div className="mt-6 space-y-6 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Project Name *</label>
                <input
                  required
                  className={inputCls + invalidCls("Project Name")}
                  value={form.projectName}
                  onChange={(e) => update("projectName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Property Address *</label>
                <AddressLookupField
                  required
                  className={inputCls + invalidCls("Property Address")}
                  value={form.address}
                  onChange={(v) => update("address", v)}
                  onResolved={(r) => handleAddressResolved(r)}
                />
                <p className="mt-1 text-[11px] text-obsidian/45 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {activeProvider() === "google"
                    ? "Florida addresses only — city auto-selects the municipality below."
                    : "Florida addresses only — enter the full address, then press Look up to auto-fill the municipality."}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Municipality / City *</label>
                <ComboboxInput
                  value={form.municipality}
                  onChange={(v) => update("municipality", v)}
                  options={MUNICIPALITIES.map((m) => ({
                    value: m.name,
                    label: m.name,
                    sublabel: m.note,
                  }))}
                  placeholder="Type to search or enter freeform…"
                  allowFreeform
                />
                {showErrors && missingLabels.has("Municipality / City") && (
                  <p className="mt-1 text-[11px] text-red-600">Municipality is required.</p>
                )}
              </div>

              {/* Registration status with the municipality — captured only, no workflow yet. */}
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Are you currently registered with this municipality? *
                </label>
                <div className="flex items-center gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => update("municipalityRegistered", v)}
                      className={`px-4 py-1.5 rounded-[3px] text-[12px] border transition-colors ${
                        form.municipalityRegistered === v
                          ? "bg-obsidian text-white border-obsidian"
                          : "bg-white text-obsidian/70 border-obsidian/20 hover:border-obsidian/40"
                      }`}
                    >
                      {v === "yes" ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
                {showErrors && missingLabels.has("Registered with this municipality?") && (
                  <p className="mt-1 text-[11px] text-red-600">Please answer Yes or No.</p>
                )}
              </div>
            </div>

            {dispatch && (
              <DispatchCard
                data={dispatch}
                confirmed={dispatchConfirmed}
                onConfirm={() => setDispatchConfirmed(true)}
              />
            )}

            {form.municipality && (
              <MunicipalityReadinessPanel
                municipality={form.municipality}
                initialSelectedKeys={initialSubmittalKeys}
                onSubmittalChange={setSubmittalPackage}
              />
            )}

            {/* Total Project Value + live service fee estimate */}
            <div className="pt-2 space-y-2">
              <label className={labelCls}>Total Project Value (USD) *</label>
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={form.totalProjectValue}
                onChange={(e) => update("totalProjectValue", e.target.value)}
                placeholder="e.g. 1250000"
                className={`w-full h-11 px-3 rounded-[3px] border border-obsidian/20 bg-white text-sm focus:outline-none focus:border-obsidian${invalidCls(
                  "Total Project Value",
                )}`}
              />
              {(() => {
                const v = Number(form.totalProjectValue || 0);
                if (!v || v <= 0) {
                  return (
                    <p className="text-[11px] text-obsidian/50">
                      Cleard service fee = 1% under $1M · 0.5% at $1M and above. All permit
                      administration, plan review, inspections, and C.O. coordination bundled — no à
                      la carte.
                    </p>
                  );
                }
                const rate = v >= 1_000_000 ? 0.005 : 0.01;
                const fee = Math.round(v * rate);
                const fmt = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                });
                return (
                  <div className="rounded-[3px] border border-obsidian/15 bg-[#153157]/[0.03] px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-obsidian/60">
                      Estimated Cleard service fee
                    </div>
                    <div className="display-serif text-2xl text-obsidian mt-1">
                      {fmt.format(fee)}
                      <span className="ml-2 text-[11px] font-mono uppercase tracking-[0.15em] text-obsidian/50">
                        · {(rate * 100).toFixed(1)}% of project value
                      </span>
                    </div>
                    <div className="text-[11px] text-obsidian/60 mt-1.5 leading-relaxed">
                      Invoiced when this permit reaches <em>Cleared for Takeoff</em>. All services
                      bundled — permit administration, plan review, inspections, C.O. coordination,
                      and Victoria AI.
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Scope multi-select — searchable dropdown with removable chips */}
            <div className="pt-2 space-y-3">
              <label className={labelCls}>Scope of Work (search and select all that apply)</label>
              <MultiSelectCombobox
                values={form.scopes}
                onToggle={toggleScope}
                options={SCOPE_OPTIONS as unknown as string[]}
                placeholder="Type to search scopes…"
                hint={(s: string) =>
                  s === "Structural"
                    ? "Includes pergolas, outdoor kitchens, summer kitchens, shade structures, retaining walls, and hardscape extensions."
                    : undefined
                }
              />
              {showErrors && missingLabels.has("Scope of Work") && (
                <p className="text-[11px] text-red-600">Select at least one scope.</p>
              )}
              {form.scopes.includes("Structural") && (
                <p className="text-[11px] text-obsidian/60 leading-relaxed">
                  <span className="font-mono uppercase tracking-[0.14em] text-obsidian/50">
                    Structural includes:
                  </span>{" "}
                  pergolas, outdoor kitchens, summer kitchens, shade structures, retaining walls,
                  and hardscape extensions.
                </p>
              )}


              {/* Scope Narrative — the written description of the work itself.
                  Distinct from the per-trade sub capture below. */}
              <div className="pt-4 border-t border-obsidian/10">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <label className={labelCls}>Scope Narrative</label>
                    <p className="-mt-1 mb-1.5 text-[12px] text-obsidian/60">
                      Describe the work itself. This is not where subcontractors go.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={scopeDrafting || form.description.trim().length < 12}
                    onClick={runScopeDraft}
                    className="mb-1.5 inline-flex items-center gap-1.5 rounded-[3px] border border-obsidian/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70 transition hover:border-obsidian/40 hover:text-obsidian disabled:opacity-40"
                  >
                    <Sparkles className="h-3 w-3" />
                    {scopeDrafting ? "Drafting…" : "Draft formal scope"}
                  </button>
                </div>
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the work in more detail…"
                />
                {scopeDraft && (
                  <div className="mt-3 space-y-3 rounded-[3px] border border-obsidian/12 bg-obsidian/[0.02] p-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                        Application scope (concise)
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-obsidian">
                        {scopeDraft.concise}
                      </p>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                        Detailed scope
                      </div>
                      <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-obsidian/80">
                        {scopeDraft.detailed}
                      </p>
                    </div>
                    {scopeDraft.code_sections.length > 0 && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                        Cited: {scopeDraft.code_sections.join(" · ")}
                      </div>
                    )}
                    {scopeDraft.missing_information.length > 0 && (
                      <div className="border-l-2 border-amber-600/40 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                        Still needed: {scopeDraft.missing_information.join("; ")}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => update("description", scopeDraft.detailed)}
                      className="rounded-[3px] bg-[#153157] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white"
                    >
                      Use detailed scope
                    </button>
                  </div>
                )}
              </div>

              {/* Inline subcontractor row per selected scope */}
              {form.scopes.length > 0 && (
                <div className="pt-4 space-y-4 border-t border-obsidian/10">
                  <div className={sectionCls}>Subcontractor per Trade</div>
                  <p className="text-[12px] text-obsidian/60 -mt-2">
                    Who is doing each trade — company, licence and contact. The{" "}
                    <strong>Other</strong> row is for a subcontractor whose trade isn't in the list
                    above; it is not where you describe the work (that's Scope Narrative).
                  </p>
                  {form.subs.map((s) => {
                    const idx = form.subs.findIndex((x) => x.scope === s.scope);
                    const reuse = reuseCandidateFor(idx);
                    const optional = OPTIONAL_SCOPES.has(s.scope);
                    return (
                      <div key={s.scope} className="space-y-2">
                        {reuse && !s.skipped && (
                          <div className="flex items-start gap-3 border border-[#153157]/30 bg-[#B6DAEA]/15 rounded-[3px] px-4 py-3">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#153157]" />
                            <div className="flex-1 text-[13px] text-obsidian/85">
                              <div className="text-obsidian font-medium">
                                {s.trade} is already on this job — {reuse.companyName} is handling
                                it.
                              </div>
                              <div className="mt-0.5 text-obsidian/60 text-[12px]">
                                Reuse the same contractor to avoid a redundant sub entry.
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => applyReuse(idx, reuse)}
                                className="inline-flex items-center justify-center bg-obsidian px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]"
                              >
                                Use{" "}
                                {reuse.companyName.length > 22
                                  ? reuse.companyName.slice(0, 20) + "…"
                                  : reuse.companyName}
                              </button>
                              <button
                                type="button"
                                onClick={() => dismissReuse(idx)}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 hover:text-obsidian"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        )}
                        <div
                          className={`border rounded-[3px] p-4 space-y-3 ${s.skipped ? "border-dashed border-obsidian/15 bg-obsidian/[0.02]" : "border-obsidian/12"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center bg-[#153157] text-white px-2 py-0.5 rounded-[3px] text-[10px] font-mono uppercase tracking-[0.12em]">
                                {s.trade}
                              </span>
                              {optional && (
                                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-obsidian/45">
                                  Optional
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {rosterUnlocked && !s.skipped && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPickerScope(pickerScope === s.scope ? null : s.scope)
                                  }
                                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#153157] hover:text-obsidian underline underline-offset-2"
                                >
                                  <Store className="h-3 w-3" />
                                  {s.marketplaceSubId
                                    ? "Change marketplace sub"
                                    : "Use a Cleard sub"}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleSubSkip(s.scope)}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian underline underline-offset-2"
                              >
                                {s.skipped ? "Add sub info" : "Skip for now"}
                              </button>
                            </div>
                          </div>

                          {pickerScope === s.scope && (
                            <div className="border border-[#153157]/30 rounded-[3px] divide-y divide-obsidian/10">
                              {roster.length === 0 ? (
                                <div className="px-3 py-3 text-[12px] text-obsidian/60">
                                  No subs listed on the marketplace yet.
                                </div>
                              ) : (
                                roster.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => pickMarketplaceSub(s.scope, m)}
                                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-obsidian/[0.03]"
                                  >
                                    <span className="text-[13px] text-obsidian">
                                      {m.company_name}
                                      <span className="ml-2 text-[11px] text-obsidian/55">
                                        {m.trade ?? "—"}
                                      </span>
                                    </span>
                                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                                      {coverageGaps(m, insuranceRequirements).length
                                        ? "Coverage gaps"
                                        : "Meets requirements"}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                          {!s.skipped && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <label className={labelCls}>
                                  Choose from your subcontractors
                                </label>
                                <select
                                  className={inputCls}
                                  value=""
                                  onChange={(e) => {
                                    const pick = savedSubs.find((x) => x.id === e.target.value);
                                    if (!pick) return;
                                    pickSavedSub(s.scope, pick);
                                  }}
                                >
                                  <option value="">
                                    {savedSubs.length
                                      ? "Select a saved subcontractor…"
                                      : "No saved subcontractors yet"}
                                  </option>
                                  {savedSubs
                                    .slice()
                                    .sort((a, b) => {
                                      const at = (a.trade ?? "").toLowerCase() === s.trade.toLowerCase() ? 0 : 1;
                                      const bt = (b.trade ?? "").toLowerCase() === s.trade.toLowerCase() ? 0 : 1;
                                      return at - bt || a.company_name.localeCompare(b.company_name);
                                    })
                                    .map((x) => (
                                      <option key={x.id} value={x.id}>
                                        {x.company_name}
                                        {x.trade ? ` — ${x.trade}` : ""}
                                        {x.license_number ? ` (${x.license_number})` : ""}
                                      </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-[11px] text-obsidian/50">
                                  Selecting one fills the fields below automatically. You can still
                                  edit them or type a new sub.
                                </p>
                              </div>

                              <div>
                                <label className={labelCls}>Company Name</label>
                                <input
                                  className={inputCls}
                                  value={s.companyName}
                                  onChange={(e) =>
                                    updateSubByScope(s.scope, { companyName: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>License #</label>
                                <input
                                  className={inputCls}
                                  value={s.licenseNumber}
                                  onChange={(e) =>
                                    updateSubByScope(s.scope, { licenseNumber: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Contact Name</label>
                                <input
                                  className={inputCls}
                                  value={s.contactName}
                                  onChange={(e) =>
                                    updateSubByScope(s.scope, { contactName: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Contact Email</label>
                                <input
                                  type="email"
                                  className={inputCls}
                                  value={s.contactEmail}
                                  onChange={(e) =>
                                    updateSubByScope(s.scope, { contactEmail: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                          )}

                          {!s.skipped &&
                            s.marketplaceSubId &&
                            (() => {
                              const gaps = gapsForRow(s);
                              if (!gaps.length) return null;
                              return (
                                <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 rounded-[3px] px-4 py-3">
                                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                                  <div className="flex-1 text-[13px] text-amber-900">
                                    <div className="font-medium">
                                      This subcontractor may not meet all your insurance
                                      requirements
                                    </div>
                                    <ul className="mt-1 list-disc pl-4 text-[12px] text-amber-900/85">
                                      {gaps.map((g) => (
                                        <li key={g.field + g.message}>{g.message}</li>
                                      ))}
                                    </ul>
                                    <div className="mt-2 text-[12px] text-amber-900/70">
                                      You can still proceed with this sub.
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={coverageAsked.includes(s.scope)}
                                    onClick={() => askForCoverageUpgrade(s, gaps)}
                                    className="shrink-0 rounded-[3px] bg-amber-700 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white disabled:opacity-50"
                                  >
                                    {coverageAsked.includes(s.scope)
                                      ? "Request sent"
                                      : "Ask to upgrade coverage"}
                                  </button>
                                </div>
                              );
                            })()}

                          {!s.skipped && !s.marketplaceSubId && s.companyName.trim() && (
                            <div className="flex items-start gap-3 border border-[#153157]/25 bg-[#B6DAEA]/15 rounded-[3px] px-4 py-3">
                              <Store className="mt-0.5 h-4 w-4 shrink-0 text-[#153157]" />
                              <div className="flex-1 text-[13px] text-obsidian/85">
                                <div className="text-obsidian font-medium">
                                  {rosterCount === 1
                                    ? "Cleard has 1 other qualified contractor that meets your requirements"
                                    : `Cleard has ${rosterCount} other qualified contractors that meet your requirements`}{" "}
                                  — want a bid?
                                </div>
                                <div className="mt-0.5 text-[12px] text-obsidian/60">
                                  {rosterUnlocked
                                    ? "Compare against your own sub before you commit."
                                    : "Unlock the Cleard marketplace to see them."}
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col gap-1.5">
                                <Link
                                  to="/portal/bid-review"
                                  className="inline-flex items-center justify-center bg-obsidian px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]"
                                >
                                  Request a bid
                                </Link>
                                <Link
                                  to="/portal/subcontractors"
                                  className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian"
                                >
                                  {rosterUnlocked ? "Browse roster" : "See marketplace"}
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filledSubs.length > 0 && (
                    <div className="border-l-2 border-[#153157] bg-obsidian/[0.03] px-4 py-3 text-[12px] text-obsidian/80">
                      {wantBundle ? (
                        <>
                          This submission will cover <strong>{filledSubs.length} trades</strong>{" "}
                          under one GC permit (auto-bundled).
                        </>
                      ) : (
                        <>1 trade added — add more scopes to bundle under a single GC permit.</>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Architect / Engineer — from shared contacts */}
            <div className="grid gap-5 sm:grid-cols-2 pt-2">
              <ProContactBlock
                role="architect"
                label="Architect of Record"
                options={savedPros.filter((p) => p.role === "architect")}
                firm={form.architectFirm}
                contact={form.architectContact}
                license={form.architectLicense}
                email={form.architectEmail}
                onFirm={(v) => update("architectFirm", v)}
                onContact={(v) => update("architectContact", v)}
                onLicense={(v) => update("architectLicense", v)}
                onEmail={(v) => update("architectEmail", v)}
                onPick={(p) =>
                  setForm((f) => ({
                    ...f,
                    architectFirm: p.firm_name,
                    architectContact: p.contact_name ?? "",
                    architectLicense: p.license_number ?? "",
                    architectEmail: p.email ?? "",
                  }))
                }
                saveNew={saveArchitectToContacts}
                onSaveNew={setSaveArchitectToContacts}
                inputCls={inputCls}
                labelCls={labelCls}
              />
              <ProContactBlock
                role="engineer"
                label="Engineer"
                options={savedPros.filter((p) => p.role === "engineer")}
                firm={form.engineerFirm}
                contact={form.engineerContact}
                license={form.engineerLicense}
                email={form.engineerEmail}
                onFirm={(v) => update("engineerFirm", v)}
                onContact={(v) => update("engineerContact", v)}
                onLicense={(v) => update("engineerLicense", v)}
                onEmail={(v) => update("engineerEmail", v)}
                onPick={(p) =>
                  setForm((f) => ({
                    ...f,
                    engineerFirm: p.firm_name,
                    engineerContact: p.contact_name ?? "",
                    engineerLicense: p.license_number ?? "",
                    engineerEmail: p.email ?? "",
                  }))
                }
                saveNew={saveEngineerToContacts}
                onSaveNew={setSaveEngineerToContacts}
                inputCls={inputCls}
                labelCls={labelCls}
              />
            </div>

            {hasNoc && <NocAwarenessRibbon scopeKey={`permits:${editId ?? "new"}`} />}

            {jobTrades.length > 0 && (
              <TradesOnJobPanel
                trades={jobTrades}
                title="Trades on this Job"
                emptyLabel="No trades added yet."
              />
            )}

            <div>
              <label className={labelCls}>Submitted Date</label>
              <input
                type="date"
                className={`${inputCls} max-w-xs`}
                value={form.submittedDate}
                onChange={(e) => update("submittedDate", e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-obsidian/10">
              <button
                type="button"
                onClick={() => update("step", 2)}
                className="inline-flex items-center gap-2 bg-obsidian px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]"
              >
                Next: Contact & Documents
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8 space-y-5">
              <div className={sectionCls}>Contractor Information</div>
              <p className="-mt-3 text-[12px] text-obsidian/60">
                Pre-filled with Cleard's details. Every field is editable.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Contractor Company Name *</label>
                  <input
                    required
                    className={inputCls + invalidCls("Contractor Company Name")}
                    value={form.contractorCompany}
                    onChange={(e) => update("contractorCompany", e.target.value)}
                  />
                  <label className="mt-2 flex items-center gap-2 text-[12px] text-obsidian/70">
                    <input
                      type="checkbox"
                      checked={form.differentQualifier}
                      onChange={(e) => toggleDifferentQualifier(e.target.checked)}
                    />
                    Using a different qualifier?
                  </label>
                  <p className="mt-1 text-[11px] text-obsidian/45">
                    {form.differentQualifier
                      ? "Cleard's defaults cleared — enter the qualifier's own details."
                      : "Unchecked: Cleard's qualifier details are used."}
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Contractor Qualifier Name *</label>
                  <input
                    required
                    className={inputCls + invalidCls("Contractor Qualifier Name")}
                    value={form.contractorQualifier}
                    onChange={(e) => update("contractorQualifier", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Company Address *</label>
                  <input
                    required
                    className={inputCls + invalidCls("Company Address")}
                    value={form.companyAddress}
                    onChange={(e) => update("companyAddress", e.target.value)}
                  />
                  {isPlaceholderValue("companyAddress", form.companyAddress) && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Placeholder — replace with Cleard's real company address.
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Point of Contact *</label>
                  <input
                    required
                    className={inputCls + invalidCls("Point of Contact")}
                    value={form.poc}
                    onChange={(e) => update("poc", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>POC Phone *</label>
                  <input
                    required
                    className={inputCls + invalidCls("POC Phone")}
                    value={form.pocPhone}
                    onChange={(e) => update("pocPhone", e.target.value)}
                    placeholder="Not on file — enter a phone number"
                  />
                </div>
                <div>
                  <label className={labelCls}>POC Email *</label>
                  <input
                    type="email"
                    required
                    className={inputCls + invalidCls("POC Email")}
                    value={form.pocEmail}
                    onChange={(e) => update("pocEmail", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>License Number *</label>
                  <input
                    required
                    className={inputCls + invalidCls("License Number")}
                    value={form.licenseNumber}
                    onChange={(e) => update("licenseNumber", e.target.value)}
                  />
                  {isPlaceholderValue("licenseNumber", form.licenseNumber) && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Placeholder — replace with the real state license number.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8 space-y-5">
              <div className={sectionCls}>Property Owner Information</div>
              <div>
                <label className={labelCls}>Name of Owner</label>
                <input
                  className={inputCls}
                  value={form.ownerName}
                  onChange={(e) => update("ownerName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Name of Trust / Corp / LLC</label>
                <input
                  className={inputCls}
                  value={form.ownerEntity}
                  onChange={(e) => update("ownerEntity", e.target.value)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Signer Phone</label>
                  <input
                    className={inputCls}
                    value={form.signerPhone}
                    onChange={(e) => update("signerPhone", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Signer Email</label>
                  <input
                    type="email"
                    className={inputCls + invalidCls("Signer Email is not a valid email")}
                    value={form.signerEmail}
                    onChange={(e) => update("signerEmail", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8 space-y-5">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <div className={sectionCls}>Upload Documents</div>
                  <p className="mt-1 text-[12px] text-obsidian/60">
                    Drawings can be uploaded after intake.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {!docsSkipped && (
                    <div className="text-right">
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                        {docsComplete} of {checklist.length} complete
                      </div>
                      <div className="mt-1.5 h-1.5 w-40 bg-obsidian/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${checklist.length ? (docsComplete / checklist.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setDocsSkipped((v) => !v)}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian underline underline-offset-2"
                  >
                    {docsSkipped ? "Undo skip" : "Skip for now"}
                  </button>
                </div>
              </div>

              {docsSkipped ? (
                <div className="text-[12px] text-obsidian/60 bg-obsidian/[0.03] border border-obsidian/10 rounded-[3px] p-3">
                  Skipped — you can upload documents later from the project dashboard.
                </div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {checklist.map((d) => {
                      const s = form.docs[d.key] ?? { uploaded: null, na: false, deferred: false };
                      const done = s.uploaded || s.na || s.deferred;
                      return (
                        <li key={d.key} className="border border-obsidian/10 rounded-[3px] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {done ? (
                                  <Check className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <FileText className="h-4 w-4 text-obsidian/40" />
                                )}
                                <span className="text-sm font-medium text-obsidian">{d.label}</span>
                                <span
                                  className={`font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded ${d.required ? "bg-red-50 text-red-700" : "bg-obsidian/8 text-obsidian/60"}`}
                                >
                                  {d.required ? "Required" : "Optional"}
                                </span>
                                {s.deferred && (
                                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                    Pending — upload later
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[12px] text-obsidian/60">{d.desc}</p>
                            </div>
                          </div>

                          {s.uploaded ? (
                            <div className="flex items-center justify-between gap-2 text-[12px] text-obsidian/80 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-[3px]">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                                <span className="truncate">{s.uploaded}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateDoc(d.key, { uploaded: null })}
                                className="text-obsidian/50 hover:text-obsidian shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : s.deferred ? (
                            <div className="flex items-center justify-between gap-2 text-[12px] text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 rounded-[3px]">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                                Marked as pending — you'll upload later.
                              </div>
                              <button
                                type="button"
                                onClick={() => updateDoc(d.key, { deferred: false })}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800 hover:text-amber-900"
                              >
                                Undo
                              </button>
                            </div>
                          ) : (
                            <div
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDrop(d.key, e)}
                              className="border-2 border-dashed border-obsidian/20 hover:border-obsidian/40 bg-obsidian/[0.02] rounded-[3px] px-4 py-5 text-center transition-colors"
                            >
                              <Upload
                                className="mx-auto h-5 w-5 text-obsidian/40"
                                strokeWidth={1.5}
                              />
                              <p className="mt-2 text-[12px] text-obsidian/65">
                                Drag & drop a PDF here, or{" "}
                                <label className="text-obsidian font-medium underline cursor-pointer">
                                  browse
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => handleFile(d.key, e)}
                                  />
                                </label>
                              </p>
                              <CloudUploadButtons />
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-4 flex-wrap">
                            {!d.required && !s.uploaded && (
                              <label className="flex items-center gap-1.5 text-[11px] text-obsidian/70">
                                <input
                                  type="checkbox"
                                  checked={s.na}
                                  onChange={(e) =>
                                    updateDoc(d.key, {
                                      na: e.target.checked,
                                      uploaded: null,
                                      deferred: false,
                                    })
                                  }
                                />
                                Does not apply
                              </label>
                            )}
                            {d.canDefer && !s.uploaded && (
                              <label className="flex items-center gap-1.5 text-[11px] text-amber-800">
                                <input
                                  type="checkbox"
                                  checked={s.deferred}
                                  onChange={(e) =>
                                    updateDoc(d.key, {
                                      deferred: e.target.checked,
                                      na: false,
                                      uploaded: null,
                                    })
                                  }
                                />
                                I'll upload this later
                              </label>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="pt-2">
                    <div className={sectionCls}>Additional Documents</div>
                    <label className="mt-3 inline-flex items-center gap-2 cursor-pointer border border-obsidian/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
                      <Upload className="h-3.5 w-3.5" /> Add PDFs ({form.extraDocs.length}/30)
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="hidden"
                        onChange={handleExtraFiles}
                      />
                    </label>
                    {form.extraDocs.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {form.extraDocs.map((name, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between gap-2 text-[12px] text-obsidian/70 bg-obsidian/5 px-2 py-1 rounded-[3px]"
                          >
                            <span className="truncate">{name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                update(
                                  "extraDocs",
                                  form.extraDocs.filter((_, j) => j !== i),
                                )
                              }
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className={labelCls}>Additional Notes</label>
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.additionalNotes}
                  onChange={(e) => update("additionalNotes", e.target.value)}
                />
              </div>
            </div>

            {showErrors && missingNow.length > 0 && (
              <div className="border border-red-300 bg-red-50 rounded-[3px] px-4 py-3 text-[13px] text-red-800">
                <div className="font-medium">Cannot submit — required fields are empty:</div>
                <ul className="mt-1 list-disc pl-5 text-[12px]">
                  {missingNow.map((m) => (
                    <li key={m.label}>
                      {m.label} <span className="text-red-700/60">(step {m.step})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => update("step", 1)}
                className="inline-flex items-center gap-2 border border-obsidian/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={submit}
                className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] disabled:opacity-60"
                style={{ backgroundColor: "#E4B93B" }}
              >
                <Send className="h-3.5 w-3.5" />{" "}
                {saving ? "Saving…" : isEditing ? "Save Changes" : "Submit Permit Intake"}
              </button>
            </div>
          </div>
        )}
      </div>
      <VictoriaIntelligencePanel
        mode="permit"
        municipality={form.municipality}
        trades={form.scopes}
        docsProvided={docsComplete}
        docsRequired={checklist.length}
        className="lg:sticky lg:top-6 self-start"
      />
    </div>
  );
}

function ProContactBlock(props: {
  role: DesignProRole;
  label: string;
  options: DesignProRow[];
  firm: string;
  contact: string;
  license: string;
  email: string;
  onFirm: (v: string) => void;
  onContact: (v: string) => void;
  onLicense: (v: string) => void;
  onEmail: (v: string) => void;
  onPick: (p: DesignProRow) => void;
  saveNew: boolean;
  onSaveNew: (v: boolean) => void;
  inputCls: string;
  labelCls: string;
}) {
  const { options, inputCls, labelCls } = props;
  const knownMatch = options.find(
    (p) => p.firm_name.trim().toLowerCase() === props.firm.trim().toLowerCase(),
  );
  return (
    <div className="space-y-2 border border-obsidian/10 rounded-[3px] p-3">
      <label className={labelCls}>{props.label}</label>
      <ComboboxInput
        value={props.firm}
        onChange={(v, opt) => {
          props.onFirm(v);
          if (opt) {
            const picked = options.find((p) => p.firm_name === opt.value);
            if (picked) props.onPick(picked);
          }
        }}
        options={options.map((p) => ({
          value: p.firm_name,
          label: p.firm_name,
          sublabel: [p.contact_name, p.license_number].filter(Boolean).join(" · ") || undefined,
        }))}
        placeholder="Search firm or enter new…"
        allowFreeform
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className={inputCls}
          value={props.contact}
          onChange={(e) => props.onContact(e.target.value)}
          placeholder="Contact name"
        />
        <input
          className={inputCls}
          value={props.license}
          onChange={(e) => props.onLicense(e.target.value)}
          placeholder="License #"
        />
        <input
          className={`${inputCls} sm:col-span-2`}
          type="email"
          value={props.email}
          onChange={(e) => props.onEmail(e.target.value)}
          placeholder="Email"
        />
      </div>
      {props.firm.trim() && !knownMatch && (
        <label className="flex items-center gap-2 text-[11px] text-obsidian/70 pt-1">
          <input
            type="checkbox"
            checked={props.saveNew}
            onChange={(e) => props.onSaveNew(e.target.checked)}
          />
          Save to contacts for future permits
        </label>
      )}
    </div>
  );
}
