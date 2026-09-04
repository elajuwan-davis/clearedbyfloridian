import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { saveMyCrmFn } from "@/lib/crm.functions";
import {
  CRM_OPTIONS,
  CRM_OTHER,
  CRM_QUESTION,
  isCrmAnswerComplete,
} from "@/lib/crm-options";

const INK = "#2F4F4F";
const OAT = "#FAF3E6";
const BORDER = "#E0D3BC";
const SERIF = "'Instrument Sans', sans-serif";

/**
 * The only place a Google-auth account is asked which tool it runs.
 * Non-dismissible: no overlay click-out, no close button — an answer is required
 * (including "None / We don't use one") before onboarding continues.
 */
export function CrmCaptureDialog({ onDone }: { onDone: () => void }) {
  const save = useServerFn(saveMyCrmFn);
  const [crm, setCrm] = useState("");
  const [other, setOther] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = isCrmAnswerComplete(crm, other);

  async function submit() {
    if (!ready) return;
    setSaving(true);
    setError(null);
    try {
      await save({
        data: {
          crm,
          crm_other: crm === CRM_OTHER ? other.trim() : null,
          source: "google",
        },
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answer.");
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crm-capture-title"
      className="fixed inset-0 z-[300] flex items-center justify-center px-5"
      style={{ background: "rgba(47,79,79,0.55)" }}
    >
      <div
        className="w-full max-w-md p-8"
        style={{ background: OAT, border: `1px solid ${BORDER}`, borderRadius: 0 }}
      >
        <h2
          id="crm-capture-title"
          className="text-[26px] leading-tight"
          style={{ fontFamily: SERIF, color: INK, fontWeight: 600 }}
        >
          One quick question
        </h2>
        <p className="mt-3 text-[14px]" style={{ color: "#7A5C68" }}>
          {CRM_QUESTION}
        </p>

        <select
          value={crm}
          onChange={(e) => setCrm(e.target.value)}
          className="mt-6 w-full bg-transparent px-3 py-3 text-[15px] outline-none"
          style={{ color: INK, border: `1px solid ${BORDER}`, borderRadius: 0 }}
        >
          <option value="">Select one…</option>
          {CRM_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        {crm === CRM_OTHER && (
          <input
            autoFocus
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Which tool do you use?"
            className="mt-3 w-full bg-transparent px-3 py-3 text-[15px] outline-none"
            style={{ color: INK, border: `1px solid ${BORDER}`, borderRadius: 0 }}
          />
        )}

        {error && (
          <div className="mt-4 text-[12.5px]" style={{ color: "#8c3b3b" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!ready || saving}
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-85 disabled:opacity-45"
          style={{ background: INK, color: OAT, borderRadius: 0 }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
        </button>
      </div>
    </div>
  );
}
