import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { PermitRow } from "@/lib/permits-api";
import { downloadPdf } from "@/lib/private-provider-forms";
import {
  ASSUMPTION_OF_DUTIES_TEXT,
  JURISDICTION_HELPER_NOTE,
  emptyChangeOfProviderFields,
  generateChangeOfProviderPdf,
  queueRecordingRequest,
  type ChangeOfProviderFields,
} from "@/lib/change-of-private-provider";

const LABEL_CLASS =
  "block text-[10px] font-semibold uppercase tracking-[0.08em] text-black/60 mb-1";
const INPUT_CLASS =
  "w-full rounded-[3px] border border-black/20 bg-white px-2.5 py-1.5 text-[13px] text-black outline-none focus:border-black/50";

function Text({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className={LABEL_CLASS}>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          rows={2}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASS}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASS}
        />
      )}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 border-b border-black pb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-black">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ChangeOfProviderFormDialog({
  open,
  onOpenChange,
  permits,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  permits: PermitRow[];
}) {
  const [permitId, setPermitId] = useState("");
  const [f, setF] = useState<ChangeOfProviderFields>(emptyChangeOfProviderFields);
  const [busy, setBusy] = useState<"pdf" | "queue" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof ChangeOfProviderFields>(k: K, v: ChangeOfProviderFields[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setF(emptyChangeOfProviderFields());
    setSubmitted(false);
    setPermitId(permits[0]?.id ?? "");
  }, [open, permits]);

  const permit = useMemo(() => permits.find((p) => p.id === permitId), [permits, permitId]);

  useEffect(() => {
    if (!permit) return;
    setF((prev) => ({
      ...prev,
      projectAddress: prev.projectAddress || permit.job_address || "",
      permitNumbers: prev.permitNumbers || permit.permit_number || "",
      jurisdiction: prev.jurisdiction || permit.municipality || "",
    }));
  }, [permit]);

  async function download() {
    setBusy("pdf");
    try {
      const bytes = await generateChangeOfProviderPdf(f);
      downloadPdf(bytes, "Notice_of_Change_of_Private_Provider.pdf");
    } catch {
      toast.error("Could not generate that form");
    } finally {
      setBusy(null);
    }
  }

  function requestRecording() {
    if (!permitId) {
      toast.error("Select the permit this form belongs to first");
      return;
    }
    setBusy("queue");
    queueRecordingRequest(permitId);
    setBusy(null);
    setSubmitted(true);
    toast.success(
      "Your recording request has been submitted. Our team will file this with the appropriate municipality.",
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-[3px] bg-white">
        <DialogTitle className="text-center text-[15px] font-bold uppercase tracking-[0.06em] text-black">
          Notice of Change of Private Provider
        </DialogTitle>
        <DialogDescription className="text-center text-[12px] text-black/70">
          Pursuant to Section 553.791, Florida Statutes
        </DialogDescription>

        <p className="text-[11px] leading-relaxed text-black/50">{JURISDICTION_HELPER_NOTE}</p>

        <div className="mt-1 space-y-5">
          <label className="block">
            <span className={LABEL_CLASS}>Permit / project this form belongs to</span>
            <select
              value={permitId}
              onChange={(e) => setPermitId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Select a permit…</option>
              {permits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name} — {p.job_address}
                </option>
              ))}
            </select>
          </label>

          <Section title="Project Information">
            <Text
              label="Project Address"
              value={f.projectAddress}
              onChange={(v) => set("projectAddress", v)}
            />
            <Text
              label="Permit Number(s)"
              value={f.permitNumbers}
              onChange={(v) => set("permitNumbers", v)}
            />
            <Text
              label="Jurisdiction / Building Department"
              value={f.jurisdiction}
              onChange={(v) => set("jurisdiction", v)}
            />
            <Text
              label="Property Owner Name"
              value={f.propertyOwnerName}
              onChange={(v) => set("propertyOwnerName", v)}
            />
            <Text
              label="Legal Description / Parcel ID"
              value={f.legalDescription}
              onChange={(v) => set("legalDescription", v)}
            />
          </Section>

          <Section title="Previous Private Provider">
            <Text
              label="Firm / Individual Name"
              value={f.prevFirmName}
              onChange={(v) => set("prevFirmName", v)}
            />
            <Text
              label="License Number"
              value={f.prevLicenseNumber}
              onChange={(v) => set("prevLicenseNumber", v)}
            />
            <Text
              label="Date Services Terminated"
              type="date"
              value={f.prevTerminationDate}
              onChange={(v) => set("prevTerminationDate", v)}
            />
            <Text
              label="Reason for Change (optional)"
              value={f.prevReasonForChange}
              onChange={(v) => set("prevReasonForChange", v)}
            />
          </Section>

          <Section title="New Private Provider">
            <Text
              label="Firm / Individual Name"
              value={f.newFirmName}
              onChange={(v) => set("newFirmName", v)}
            />
            <Text
              label="License Number (PE / RA / Certified Inspector)"
              value={f.newLicenseNumber}
              onChange={(v) => set("newLicenseNumber", v)}
            />
            <Text label="Address" value={f.newAddress} onChange={(v) => set("newAddress", v)} />
            <Text
              label="Phone / Email"
              value={f.newPhoneEmail}
              onChange={(v) => set("newPhoneEmail", v)}
            />
            <Text
              label="Effective Date of New Provider"
              type="date"
              value={f.newEffectiveDate}
              onChange={(v) => set("newEffectiveDate", v)}
            />
            <Text
              label="Scope of Services Assumed"
              textarea
              value={f.newScopeOfServices}
              onChange={(v) => set("newScopeOfServices", v)}
            />
          </Section>

          <section>
            <h3 className="mb-2 border-b border-black pb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-black">
              Statement of Assumption of Duties
            </h3>
            <p className="text-[12.5px] leading-relaxed text-black">
              {ASSUMPTION_OF_DUTIES_TEXT}
            </p>
          </section>

          <Section title="Signatures">
            <div className="sm:col-span-2">
              <div className={LABEL_CLASS}>Permit Holder / Owner — Signature</div>
              <div className="grid h-16 place-items-center rounded-[3px] border border-dashed border-black/25 text-[11px] text-black/40">
                Signature
              </div>
            </div>
            <Text
              label="Printed Name"
              value={f.ownerPrintedName}
              onChange={(v) => set("ownerPrintedName", v)}
            />
            <Text label="Date" type="date" value={f.ownerDate} onChange={(v) => set("ownerDate", v)} />

            <div className="sm:col-span-2">
              <div className={LABEL_CLASS}>New Private Provider — Signature</div>
              <div className="grid h-16 place-items-center rounded-[3px] border border-dashed border-black/25 text-[11px] text-black/40">
                Signature
              </div>
            </div>
            <Text
              label="Printed Name / License #"
              value={f.providerPrintedName}
              onChange={(v) => set("providerPrintedName", v)}
            />
            <Text
              label="Date"
              type="date"
              value={f.providerDate}
              onChange={(v) => set("providerDate", v)}
            />
          </Section>

          <section
            aria-disabled
            className="rounded-[3px] border border-black/15 bg-black/[0.04] p-3 opacity-70"
          >
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-black/60">
              For Local Building Official Use Only
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL_CLASS}>Received By</span>
                <input disabled className={INPUT_CLASS} />
              </label>
              <label className="block">
                <span className={LABEL_CLASS}>Date Received</span>
                <input disabled className={INPUT_CLASS} />
              </label>
            </div>
          </section>

          {submitted && (
            <p className="rounded-[3px] border border-black/15 bg-black/[0.03] p-3 text-[12.5px] text-black">
              Your recording request has been submitted. Our team will file this with the
              appropriate municipality.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              className="p-btn p-btn-ghost"
              onClick={download}
              disabled={busy !== null}
            >
              {busy === "pdf" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              Download PDF
            </button>
            <button
              type="button"
              className="p-btn p-btn-primary"
              onClick={requestRecording}
              disabled={busy !== null || submitted}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
              Request Recording
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
