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
import { PageShell, Split, Panel, KV, StatusChip } from "@/components/ui-kit";

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
  const tone = status === "active" ? "success" : status === "expired" ? "danger" : "neutral";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusChip tone={tone}>DBPR: {status}</StatusChip>
      {verified ? (
        <StatusChip tone="info">
          <BadgeCheck className="h-3 w-3" /> Verified
        </StatusChip>
      ) : (
        <StatusChip tone="warning">
          <ShieldQuestion className="h-3 w-3" /> Unverified
        </StatusChip>
      )}
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          className="w-full"
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
      <div className="flex items-end pb-0.5">
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="sm:col-span-2 lg:col-span-3">
        <Label>Certificate of Insurance</Label>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <label className="p-btn p-btn-ghost cursor-pointer">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
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
          <span className="truncate text-[12px] text-muted-foreground">
            {policy.certificateFileName || "No file uploaded"}
          </span>
          {policy.certificateFilePath && (
            <button
              type="button"
              onClick={() => void openDoc()}
              disabled={opening}
              className="p-btn p-btn-quiet p-btn-sm"
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
        <PageShell title="Company Profile">
          <div className="flex items-center gap-2 px-1 py-10 text-[12.5px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading company profile…
          </div>
        </PageShell>
      </PortalShell>
    );
  }

  if (!session.effectiveTenantId) {
    return (
      <PortalShell>
        <PageShell title="Company Profile">
          <div className="px-1 py-10 text-[12.5px] text-muted-foreground">
            No tenant assigned to this account yet.
          </div>
        </PageShell>
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
      <PageShell
        crumbs={[{ label: "Workspace" }, { label: "Company Profile" }]}
        title={profile.legalName || "Company Profile"}
        meta="License, qualifiers, insurance and bond information"
        actions={
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Company Profile
          </Button>
        }
      >
        <Split
          asideWidth={300}
          main={
            <div className="space-y-4">
              <Panel title="Company">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div>
                    <Label>Entity Type</Label>
                    <Input
                      value={profile.entityType}
                      onChange={(e) => update({ entityType: e.target.value })}
                    />
                  </div>
                </div>
              </Panel>

              <Panel title="Primary Qualifier" meta="Auto-validate on save — live DBPR license check">
                <QualifierFields
                  qualifier={profile.primaryQualifier}
                  onChange={(q) => update({ primaryQualifier: q })}
                />
              </Panel>

              <Panel
                title="Secondary Qualifier"
                action={
                  profile.secondaryQualifier ? (
                    <button
                      onClick={() => update({ secondaryQualifier: null })}
                      className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-[var(--p-danger)]"
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  ) : undefined
                }
              >
                {profile.secondaryQualifier ? (
                  <QualifierFields
                    qualifier={profile.secondaryQualifier}
                    onChange={(q) => update({ secondaryQualifier: q })}
                  />
                ) : (
                  <button onClick={addSecondaryQualifier} className="p-btn p-btn-ghost">
                    <Plus className="h-3.5 w-3.5" /> Add Secondary Qualifier
                  </button>
                )}
              </Panel>

              <Panel
                title="General Liability Insurance"
                meta={`Coverage on file: ${formatCents(profile.generalLiability.coverageAmountCents)}`}
              >
                <InsuranceFields
                  policy={profile.generalLiability}
                  onChange={(p) => update({ generalLiability: p })}
                  tenantId={tenantId}
                  kind="gl"
                />
              </Panel>

              <Panel
                title="Workers Compensation Insurance"
                meta={`Coverage on file: ${formatCents(profile.workersComp.coverageAmountCents)}`}
              >
                <InsuranceFields
                  policy={profile.workersComp}
                  onChange={(p) => update({ workersComp: p })}
                  tenantId={tenantId}
                  kind="wc"
                />
              </Panel>

              <Panel
                title="Surety Bond"
                action={
                  profile.bond ? (
                    <button
                      onClick={() => update({ bond: null })}
                      className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-[var(--p-danger)]"
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  ) : undefined
                }
              >
                {profile.bond ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                ) : (
                  <button onClick={addBond} className="p-btn p-btn-ghost">
                    <Plus className="h-3.5 w-3.5" /> Add Bond Information
                  </button>
                )}
              </Panel>
            </div>
          }
          aside={
            <>
              {flags.length > 0 && <CompanyComplianceBanner profile={profile} />}
              <Panel title="Summary">
                <div className="grid grid-cols-2 gap-3">
                  <KV label="Entity Type">{profile.entityType || "—"}</KV>
                  <KV label="DBA">{profile.dba || "—"}</KV>
                  <KV label="Primary License">{profile.primaryQualifier.licenseNumber || "—"}</KV>
                  <KV label="Qualifier Status">
                    <StatusChip tone={profile.primaryQualifier.dbprStatus === "active" ? "success" : "danger"}>
                      {profile.primaryQualifier.dbprStatus}
                    </StatusChip>
                  </KV>
                  <KV label="GL Coverage">{formatCents(profile.generalLiability.coverageAmountCents)}</KV>
                  <KV label="WC Coverage">{formatCents(profile.workersComp.coverageAmountCents)}</KV>
                </div>
              </Panel>
            </>
          }
        />
      </PageShell>
    </PortalShell>
  );
}
