// Agent 4 — "Route for Signatures" action + the Submit gate it unlocks.
//
// Routing for signatures creates a real SignWell document (embedded signing) and triggers
// pre-submission-check; Submit to Municipality stays disabled until that check comes back
// with a full pass, and every blocked item shows its own specific reason.
//
// There is no "mark signed" affordance: only SignWell's HMAC-verified document_completed
// webhook can confirm a signature, and the gate requires that confirmation.

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PenLine,
  Send,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { EmbeddedSigningDialog } from "@/components/embedded-signing-dialog";
import { sendForSignature, type SignatureRequest } from "@/lib/signature-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/use-session";
import type { PermitRow } from "@/lib/permits-api";
import {
  listSignatureRequestRows,
  loadPreSubmissionReport,
  runPreSubmissionCheck,
  type PreSubmissionReport,
  type SignatureRequestRow,
} from "@/lib/pre-submission";

type Props = {
  permit: PermitRow;
  /**
   * Optional shortcut to the municipality submission card below the gate. Submitting is
   * that card's job — it drafts and waits for staff approval — so this only scrolls.
   */
  onSubmitToMunicipality?: () => void;
};

export function PreSubmissionGate({ permit, onSubmitToMunicipality }: Props) {
  const { isAdmin, loading } = useSession();
  const [report, setReport] = useState<PreSubmissionReport | null>(null);
  const [sigs, setSigs] = useState<SignatureRequestRow[]>([]);
  const [running, setRunning] = useState(false);
  const [email, setEmail] = useState("");
  const [docName, setDocName] = useState("Permit application package");
  const [signing, setSigning] = useState<SignatureRequest | null>(null);

  const refresh = useCallback(async () => {
    const [r, s] = await Promise.all([
      loadPreSubmissionReport(permit.id),
      listSignatureRequestRows(permit.id),
    ]);
    setReport(r);
    setSigs(s);
  }, [permit.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading || !isAdmin) return null;

  async function routeForSignatures() {
    setRunning(true);
    try {
      if (email.trim()) {
        const req = await sendForSignature({
          permitId: permit.id,
          documentName: docName.trim() || "Permit application package",
          recipientEmail: email.trim(),
          recipientRole: "General Contractor",
        });
        setEmail("");
        if (req.embeddedSigningUrl) setSigning(req);
      }
      const result = await runPreSubmissionCheck(permit.id);
      setReport(result);
      await refresh();
      toast[result.status === "pass" ? "success" : "warning"](
        result.status === "pass"
          ? "Pre-submission check passed — Submit is enabled"
          : `Blocked: ${result.blocking_reasons.length} item(s) outstanding`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pre-submission check failed");
    } finally {
      setRunning(false);
    }
  }

  const passed = report?.status === "pass";

  return (
    <div className="rounded-[3px] border border-obsidian/12 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-obsidian">Pre-submission completeness</div>
        {report && (
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] ${
              passed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            {passed ? "pass" : "blocked"}
          </span>
        )}
        {report && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
            checked {new Date(report.checked_at).toLocaleString()}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
            Document to route
          </label>
          <Input
            className="mt-1.5 rounded-[3px]"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
            Signer email (optional)
          </label>
          <Input
            className="mt-1.5 rounded-[3px]"
            type="email"
            placeholder="qualifier@gc.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button
          variant="dark"
          className="rounded-[3px]"
          onClick={routeForSignatures}
          disabled={running}
        >
          {running ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PenLine className="h-4 w-4 mr-2" />
          )}
          Route for Signatures
        </Button>
        <Button
          variant="outline"
          className="rounded-[3px]"
          disabled={!passed}
          title={
            passed
              ? "Submit to the municipality"
              : "Blocked until every pre-submission check passes"
          }
          onClick={() =>
            onSubmitToMunicipality
              ? onSubmitToMunicipality()
              : document
                  .getElementById("municipality-submission")
                  ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Send className="h-4 w-4 mr-2" /> Submit to Municipality
        </Button>
      </div>

      {report && (
        <ul className="mt-4 space-y-1.5">
          {report.checks.map((c) => (
            <li key={c.key} className="flex gap-2 text-xs">
              {c.pass ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
              )}
              <span className="text-obsidian">
                <span className="font-semibold">{c.label}:</span>{" "}
                <span className="text-obsidian/70">{c.reason}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {report && !report.signwell_configured && (
        <div className="mt-3 flex gap-2 rounded-[3px] border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          SIGNWELL_API_KEY is not set on the edge functions, so documents cannot be routed for
          signature and no signature can reach provider-confirmed.
        </div>
      )}

      {sigs.length > 0 && (
        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
            Signature ledger
          </div>
          <ul className="mt-2 space-y-1.5">
            {sigs.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs text-obsidian/80">
                <Upload className="h-3.5 w-3.5 shrink-0 text-obsidian/40" />
                <span className="truncate">
                  {s.document_name} → {s.recipient_email}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-obsidian/50">
                  {s.status}
                </span>
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] ${
                    s.status_source === "provider_confirmed"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                  title={
                    s.status_source === "provider_confirmed"
                      ? `SignWell confirmed ${s.completed_at ?? ""}`
                      : "Awaiting SignWell document_completed"
                  }
                >
                  {s.status_source === "provider_confirmed" ? "SignWell confirmed" : "unconfirmed"}
                </span>
                {s.embedded_signing_url && s.status !== "signed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-6 rounded-[3px] text-[10px]"
                    onClick={() =>
                      setSigning({
                        id: s.id,
                        projectId: s.permit_id,
                        permitId: s.permit_id,
                        docId: s.document_key ?? undefined,
                        documentName: s.document_name,
                        recipientEmail: s.recipient_email,
                        recipientRole: "General Contractor",
                        status: s.status,
                        statusSource: s.status_source,
                        createdAt: s.sent_at ?? new Date().toISOString(),
                        embeddedSigningUrl: s.embedded_signing_url ?? undefined,
                        testMode: Boolean(s.test_mode),
                      })
                    }
                  >
                    Open signing
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {signing && (
        <EmbeddedSigningDialog
          open={!!signing}
          onOpenChange={(v) => !v && setSigning(null)}
          request={signing}
          onCompleted={() => void refresh()}
        />
      )}
    </div>
  );
}
