import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCurrentGcCompanyProfile,
  saveCurrentGcCompanyProfileWithDbpr,
  complianceFlags,
  formatCents,
  emptyGcCompanyProfile,
  type GcCompanyProfile,
  type Qualifier,
  type InsurancePolicy,
  type DbprStatus,
} from "@/lib/gc-company";
import {
  createCompanyDocUploadUrlFn,
  getCompanyDocUrlFn,
} from "@/lib/company-docs.functions";
import { CompanyComplianceBanner } from "@/components/company-compliance-banner";
import { useSession } from "@/lib/use-session";
import { BadgeCheck, ShieldQuestion, Upload, Plus, X, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/company")({
  head: () => ({
    meta: [
      { title: "Company Profile — Cleard" },
      {
        name: "description",
        content: "Manage your GC company license, qualifiers, insurance and bond information.",
      },
      { property: "og:title", content: "Company Profile — Cleard" },
      { property: "og:description", content: "License and insurance tracking for your GC firm." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompanyProfilePage,
});

function DbprBadge({ status, verified }: { status: DbprStatus; verified: boolean }) {
  const color =
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "expired"
        ? "bg-red-100 text-red-700"
        : "bg-obsidian/10 text-obsidian/60";
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px] ${color}`}
      >
        DBPR: {status}
      </span>
      {verified ? (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px] bg-sky-100 text-sky-700">
          <BadgeCheck className="h-3 w-3" /> Verified
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px] bg-amber-100 text-amber-800">
          <ShieldQuestion className="h-3 w-3" /> Unverified
        </span>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-obsidian/10 bg-white rounded-[3px] p-5 sm:p-6 space-y-4">
      <h2
        className="font-space text-lg text-obsidian"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function QualifierFields({
  qualifier,
  onChange,
}: {
  qualifier: Qualifier;
  onChange: (q: Qualifier) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <Label>Qualifier Name</Label>
        <Input
          value={qualifier.name}
          onChange={(e) => onChange({ ...qualifier, name: e.target.value })}
        />
      </div>
      <div>
        <Label>License Type</Label>
        <Input
          value={qualifier.licenseType}
          onChange={(e) => onChange({ ...qualifier, licenseType: e.target.value })}
          placeholder="Certified General Contractor (CGC)"
        />
      </div>
      <div>
        <Label>License Number</Label>
        <Input
          value={qualifier.licenseNumber}
          onChange={(e) => onChange({ ...qualifier, licenseNumber: e.target.value })}
          placeholder="CGC1523401"
        />
      </div>
      <div>
        <Label>Expiration Date</Label>
        <Input
          type="date"
          value={qualifier.expiration}
          onChange={(e) => onChange({ ...qualifier, expiration: e.target.value })}
        />
      </div>
      <div>
        <Label>DBPR Status</Label>
        <select
          className="w-full h-11 border border-obsidian/20 rounded-[3px] px-3 text-sm bg-white"
          value={qualifier.dbprStatus}
          onChange={(e) =>
            onChange({ ...qualifier, dbprStatus: e.target.value as DbprStatus })
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <div className="flex items-end pb-2">
        <DbprBadge status={qualifier.dbprStatus} verified={qualifier.verified} />
      </div>
    </div>
  );
}

function InsuranceFields({
  policy,
  onChange,
  tenantId,
  kind,
}: {
  policy: InsurancePolicy;
  onChange: (p: InsurancePolicy) => void;
  tenantId: string;
  kind: "gl" | "wc";
}) {
  const createUpload = useServerFn(createCompanyDocUploadUrlFn);
  const getUrl = useServerFn(getCompanyDocUrlFn);
  const [uploading, setUploading] = useState(false);
  const [opening, setOpening] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file || !tenantId) return;
    setUploading(true);
    try {
      const signed = await createUpload({
        data: { filename: file.name, kind, tenantId },
      });
      const put = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      onChange({
        ...policy,
        certificateFileName: file.name,
        certificateFilePath: signed.path,
      });
      toast.success("Certificate uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function openDoc() {
    if (!policy.certificateFilePath || !tenantId) return;
    setOpening(true);
    try {
      const res = await getUrl({
        data: { path: policy.certificateFilePath, tenantId },
      });
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open file");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <Label>Carrier</Label>
        <Input
          value={policy.carrier}
          onChange={(e) => onChange({ ...policy, carrier: e.target.value })}
        />
      </div>
      <div>
        <Label>Policy Number</Label>
        <Input
          value={policy.policyNumber}
          onChange={(e) => onChange({ ...policy, policyNumber: e.target.value })}
        />
      </div>
      <div>
        <Label>Coverage Amount</Label>
        <Input
          type="number"
          value={policy.coverageAmountCents / 100}
          onChange={(e) =>
            onChange({
              ...policy,
              coverageAmountCents: Math.round(Number(e.target.value || 0) * 100),
            })
          }
        />
      </div>
      <div>
        <Label>Expiration Date</Label>
        <Input
          type="date"
          value={policy.expiration}
          onChange={(e) => onChange({ ...policy, expiration: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Certificate of Insurance</Label>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <label className="inline-flex items-center gap-2 min-h-[44px] px-3 border border-obsidian/20 rounded-[3px] text-sm cursor-pointer hover:bg-obsidian/5">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              disabled={uploading || !tenantId}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
          <span className="text-xs text-obsidian/60 truncate">
            {policy.certificateFileName || "No file uploaded"}
          </span>
          {policy.certificateFilePath && (
            <button
              type="button"
              onClick={() => void openDoc()}
              disabled={opening}
              className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline min-h-[44px]"
            >
              {opening ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              Open
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyProfilePage() {
  const session = useSession();
  const [profile, setProfile] = useState<GcCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session.loading) return;
    const tenantId = session.effectiveTenantId;
    if (!tenantId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getCurrentGcCompanyProfile(tenantId, session.tenantName)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Failed to load company profile");
        if (!cancelled) setProfile(emptyGcCompanyProfile(tenantId, session.tenantName ?? ""));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session.loading, session.effectiveTenantId, session.tenantName]);

  if (session.loading || loading) {
    return (
      <PortalShell>
        <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-obsidian/50 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading company profile…
        </div>
      </PortalShell>
    );
  }

  if (!session.effectiveTenantId) {
    return (
      <PortalShell>
        <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-obsidian/60">
          No tenant assigned to this account yet.
        </div>
      </PortalShell>
    );
  }

  if (!profile) return null;

  function update(patch: Partial<GcCompanyProfile>) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const saved = await saveCurrentGcCompanyProfileWithDbpr(profile);
      setProfile(saved);
      toast.success("Company profile saved", {
        description: "Qualifiers auto-validated against DBPR.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function addSecondaryQualifier() {
    update({
      secondaryQualifier: {
        name: "",
        licenseNumber: "",
        licenseType: "Certified Building Contractor (CBC)",
        expiration: "",
        dbprStatus: "active",
        verified: false,
      },
    });
  }

  function addBond() {
    update({
      bond: { surety: "", bondNumber: "", amountCents: 0, expiration: "" },
    });
  }

  const flags = complianceFlags(profile);
  const tenantId = session.effectiveTenantId;

  return (
    <PortalShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <header className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50 mb-2">
            Company Profile
          </div>
          <h1 className="display-serif text-4xl text-obsidian">{profile.legalName || "Company Profile"}</h1>
          <p className="text-obsidian/60 mt-2 text-sm max-w-2xl">
            Keep your license, qualifiers, insurance, and bond information current. This drives
            compliance checks across every permit submission.
          </p>
        </header>

        {flags.length > 0 && <CompanyComplianceBanner profile={profile} />}

        <div className="space-y-6">
          <Section title="Company">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Legal Name</Label>
                <Input
                  value={profile.legalName}
                  onChange={(e) => update({ legalName: e.target.value })}
                />
              </div>
              <div>
                <Label>DBA</Label>
                <Input value={profile.dba} onChange={(e) => update({ dba: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Entity Type</Label>
                <Input
                  value={profile.entityType}
                  onChange={(e) => update({ entityType: e.target.value })}
                />
              </div>
            </div>
          </Section>

          <Section title="Primary Qualifier">
            <p className="text-xs text-obsidian/50 -mt-2">
              Auto-validate on save — live DBPR license check
            </p>
            <QualifierFields
              qualifier={profile.primaryQualifier}
              onChange={(q) => update({ primaryQualifier: q })}
            />
          </Section>

          <Section title="Secondary Qualifier">
            {profile.secondaryQualifier ? (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={() => update({ secondaryQualifier: null })}
                    className="inline-flex items-center gap-1 text-xs text-obsidian/50 hover:text-red-600 min-h-[44px]"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <QualifierFields
                  qualifier={profile.secondaryQualifier}
                  onChange={(q) => update({ secondaryQualifier: q })}
                />
              </>
            ) : (
              <button
                onClick={addSecondaryQualifier}
                className="inline-flex items-center gap-2 min-h-[44px] px-3 font-mono text-[10px] uppercase tracking-[0.14em] border border-obsidian/20 rounded-[3px] hover:bg-obsidian/5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Secondary Qualifier
              </button>
            )}
          </Section>

          <Section title="General Liability Insurance">
            <InsuranceFields
              policy={profile.generalLiability}
              onChange={(p) => update({ generalLiability: p })}
              tenantId={tenantId}
              kind="gl"
            />
            <div className="text-xs text-obsidian/50">
              Coverage on file: {formatCents(profile.generalLiability.coverageAmountCents)}
            </div>
          </Section>

          <Section title="Workers Compensation Insurance">
            <InsuranceFields
              policy={profile.workersComp}
              onChange={(p) => update({ workersComp: p })}
              tenantId={tenantId}
              kind="wc"
            />
            <div className="text-xs text-obsidian/50">
              Coverage on file: {formatCents(profile.workersComp.coverageAmountCents)}
            </div>
          </Section>

          <Section title="Surety Bond">
            {profile.bond ? (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={() => update({ bond: null })}
                    className="inline-flex items-center gap-1 text-xs text-obsidian/50 hover:text-red-600 min-h-[44px]"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Surety</Label>
                    <Input
                      value={profile.bond.surety}
                      onChange={(e) =>
                        update({ bond: { ...profile.bond!, surety: e.target.value } })
                      }
                    />
                  </div>
                  <div>
                    <Label>Bond Number</Label>
                    <Input
                      value={profile.bond.bondNumber}
                      onChange={(e) =>
                        update({ bond: { ...profile.bond!, bondNumber: e.target.value } })
                      }
                    />
                  </div>
                  <div>
                    <Label>Bond Amount</Label>
                    <Input
                      type="number"
                      value={profile.bond.amountCents / 100}
                      onChange={(e) =>
                        update({
                          bond: {
                            ...profile.bond!,
                            amountCents: Math.round(Number(e.target.value || 0) * 100),
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <Input
                      type="date"
                      value={profile.bond.expiration}
                      onChange={(e) =>
                        update({ bond: { ...profile.bond!, expiration: e.target.value } })
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={addBond}
                className="inline-flex items-center gap-2 min-h-[44px] px-3 font-mono text-[10px] uppercase tracking-[0.14em] border border-obsidian/20 rounded-[3px] hover:bg-obsidian/5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Bond Information
              </button>
            )}
          </Section>

          <div className="flex justify-end">
            <Button onClick={() => void save()} className="min-h-[44px]" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Company Profile
            </Button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
