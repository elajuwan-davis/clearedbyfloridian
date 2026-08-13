import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ShieldCheck, PenLine, FileSignature } from "lucide-react";
import { toast } from "sonner";
import { IdUpload, EMPTY_ID_UPLOAD, type IdUploadValue } from "@/components/id-upload";
import { EmbeddedSigningDialog } from "@/components/embedded-signing-dialog";
import { sendAgreementForSignature, type SignatureRequest } from "@/lib/signature-requests";
import { supabase } from "@/integrations/supabase/client";
import {
  LPOA_ATTESTATION,
  LPOA_CLAUSES,
  LPOA_PREAMBLE,
  LPOA_REVISION,
  LPOA_SUBTITLE,
  LPOA_TITLE,
  createLpoaDraft,
  generateLpoaPdf,
  isLpoaSigned,
  loadLpoa,
  type LpoaRecord,
} from "@/lib/lpoa";


export const Route = createFileRoute("/lpoa-signing")({
  head: () => ({
    meta: [
      { title: "LPOA Signing — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LpoaSigningPage,
});

const TODAY = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function LpoaSigningPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("Marcus Hale");
  const [title, setTitle] = useState("Qualifying Agent");
  const [license, setLicense] = useState("CGC1523847");
  const [ack1, setAck1] = useState(false);
  const [ack2, setAck2] = useState(false);
  const [idDoc, setIdDoc] = useState<IdUploadValue>(EMPTY_ID_UPLOAD);
  const [idComplete, setIdComplete] = useState(false);
  const [sigUnlocked, setSigUnlocked] = useState(false);
  const [sending, setSending] = useState(false);
  const [record, setRecord] = useState<LpoaRecord | null>(null);
  const [signerEmail, setSignerEmail] = useState<string | null>(null);
  const [signing, setSigning] = useState<
    (SignatureRequest & { embeddedSigningUrl?: string }) | null
  >(null);

  useEffect(() => {
    void loadLpoa().then(setRecord);
    void supabase.auth.getUser().then(({ data }) => setSignerEmail(data?.user?.email ?? null));
  }, []);

  const canSign = Boolean(
    name.trim() && title.trim() && license.trim() && idComplete && ack1 && ack2 && signerEmail,
  );

  /** Executing means sending the real document; SignWell decides when it is signed. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSign || sending) return;
    setSending(true);
    try {
      const draft = await createLpoaDraft({
        signerName: name,
        signerTitle: title,
        licenseNumber: license,
        signerEmail,
      });
      const pdf = await generateLpoaPdf({
        signerName: name,
        signerTitle: title,
        licenseNumber: license,
        executionDate: TODAY,
      });
      const req = await sendAgreementForSignature({
        contextKind: "lpoa",
        contextId: draft.id,
        documentName: `${LPOA_TITLE} — Rev. ${LPOA_REVISION}`,
        pdf,
        recipientEmail: signerEmail ?? "",
        recipientName: name,
        subject: "Signature required — Limited Power of Attorney",
      });
      setSigning(req);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  /** Navigation waits on the webhook — closing the iframe is not completion. */
  async function afterSigning() {
    const fresh = await loadLpoa();
    setRecord(fresh);
    if (isLpoaSigned(fresh)) {
      toast.success("LPOA executed — SignWell confirmed");
      navigate({ to: "/portal/permits" });
    } else {
      toast.message("Waiting on SignWell to confirm the signature.");
    }
  }

  return (
    <PortalShell>
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back */}
        <Link
          to="/portal/permits"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55 transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Permits
        </Link>

        {/* Header */}
        <div className="mt-6 border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50">FL Statute 553.791 · Affidavit of Agency</div>
          <h1 className="display-serif mt-3 text-5xl text-obsidian">
            Limited Power <em>of Attorney</em>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-obsidian/60">
            Authorizes Cleard to act as your firm's private provider of record on
            permits filed through this account.
          </p>
        </div>

        {/* Document */}
        <article className="mt-10 border border-obsidian/15 bg-white">
          {/* Document header */}
          <div className="border-b border-obsidian/10 bg-paper-warm px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <FileSignature className="h-4 w-4 text-sky" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
                  LPOA · Document Rev. {LPOA_REVISION}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                Effective {TODAY}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 text-[15px] leading-[1.75] text-obsidian/85">
            {/* Rendered from LPOA_CLAUSES — the same text the signed PDF is generated from. */}
            <h2 className="display-serif text-2xl text-obsidian">{LPOA_TITLE}</h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
              {LPOA_SUBTITLE}
            </p>

            <p className="mt-6">{LPOA_PREAMBLE}</p>

            <ol className="mt-6 space-y-4 [counter-reset:lpoa] list-none pl-0">
              {LPOA_CLAUSES.map((c, i) => (
                <Clause key={c.title} n={i + 1} title={c.title}>
                  {c.body}
                </Clause>
              ))}
            </ol>

            <p className="mt-8 text-sm text-obsidian/65">{LPOA_ATTESTATION}</p>
          </div>

          {/* Signer Block */}
          <div className="border-t border-obsidian/10 bg-paper-warm/40 px-8 py-7">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
              Signer Information
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Full Legal Name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Title / Role" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </Field>
              <Field label="FL Contractor License No." required>
                <Input
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="font-mono tabular-nums"
                  required
                />
              </Field>
              <Field label="Date of Execution">
                <Input value={TODAY} readOnly className="bg-paper-warm/60 font-mono text-obsidian/70" />
              </Field>
            </div>
          </div>

          {/* Identity Verification — gates the signature step */}
          <div className="border-t border-obsidian/10 px-8 py-7">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
                  Identity Verification
                </div>
                <div className="mt-1 text-xs text-obsidian/55">
                  Upload a valid government-issued photo ID before signing.
                </div>
              </div>
              {idComplete && (
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            <div className="mt-5">
              <IdUpload
                mode={{ kind: "authenticated" }}
                value={idDoc}
                onChange={setIdDoc}
                onCompleteChange={setIdComplete}
              />
            </div>

            {!sigUnlocked && (
              <div className="mt-6 flex items-center gap-3">
                <span title={idComplete ? undefined : "Upload a valid government ID to continue"}>
                  <Button
                    type="button"
                    variant="dark"
                    disabled={!idComplete}
                    onClick={() => setSigUnlocked(true)}
                  >
                    <PenLine className="mr-2 h-4 w-4" />
                    Continue to Sign
                  </Button>
                </span>
                {!idComplete && (
                  <span className="text-xs text-obsidian/50">
                    Upload a valid government ID to continue.
                  </span>
                )}
              </div>
            )}
          </div>

          {sigUnlocked && (
          <>
          <div className="border-t border-obsidian/10 px-8 py-7">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
              Signature
            </div>
            <p className="mt-1 text-xs text-obsidian/55">
              Executing generates this document as a PDF and opens SignWell inside this page. The
              LPOA is in effect only once SignWell confirms the signature.
            </p>
            {record && record.status !== "draft" && !isLpoaSigned(record) && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-700">
                Sent to SignWell — awaiting confirmation
              </p>
            )}
            {isLpoaSigned(record) && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-700">
                Executed · SignWell confirmed
              </p>
            )}
          </div>

          {/* Acknowledgments */}
          <div className="border-t border-obsidian/10 bg-paper-warm/40 px-8 py-6 space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={ack1}
                onCheckedChange={(v) => setAck1(v === true)}
                className="mt-0.5 rounded-[2px]"
              />
              <span className="text-sm text-obsidian">
                I am the qualifying agent and have authority to bind the General Contractor
                identified above.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={ack2}
                onCheckedChange={(v) => setAck2(v === true)}
                className="mt-0.5 rounded-[2px]"
              />
              <span className="text-sm text-obsidian">
                I authorize Cleard to act as private provider under FL Statute
                553.791, including filing affidavits of compliance and certificates of compliance
                with the AHJ on this firm's behalf.
              </span>
            </label>
          </div>
          </>
          )}
        </article>


        {/* Footer Actions */}
        <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-obsidian/10 pt-8 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
            <ShieldCheck className="h-3.5 w-3.5 text-sky" />
            Bank-grade encryption · Audit log retained 7 years
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="rounded-[3px]">
              <Link to="/portal/permits">Cancel</Link>
            </Button>
            <Button type="submit" variant="dark" disabled={!canSign || sending}>
              <PenLine className="mr-2 h-4 w-4" />
              {sending ? "Opening SignWell…" : "Execute LPOA"}
            </Button>
          </div>
        </div>
      </form>

      {signing && (
        <EmbeddedSigningDialog
          open
          onOpenChange={(v) => {
            if (!v) {
              setSigning(null);
              void afterSigning();
            }
          }}
          request={signing}
          onCompleted={() => void afterSigning()}
        />
      )}
    </PortalShell>
  );
}

/* ─────────────── helpers ─────────────── */

function Clause({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-sky tabular-nums shrink-0 pt-1">
        {String(n).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <div className="font-medium text-obsidian">{title}</div>
        <div className="mt-1 text-[15px] leading-[1.7] text-obsidian/80">{children}</div>
      </div>
    </li>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
        {label}
        {required && <span className="ml-1 text-oxblood">*</span>}
      </Label>
      {children}
    </div>
  );
}
