import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSignature, ShieldCheck, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  PAA_BODY, PAA_DRAFT_NOTICE, PAA_TITLE, PAA_VERSION,
  downloadPaa, loadPaa, savePaa, type PaaRecord,
} from "@/lib/paa";

export function PaaDraftBanner() {
  return (
    <div className="flex items-start gap-2 border border-amber-600/30 bg-amber-50 px-4 py-3 rounded-[3px]">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800">
        {PAA_DRAFT_NOTICE}
      </div>
    </div>
  );
}

/** Inline PAA document body. */
export function PaaDocument() {
  return (
    <div className="space-y-4">
      <PaaDraftBanner />
      <div className="border border-obsidian/12 bg-white p-6 rounded-[3px] max-h-[46vh] overflow-y-auto">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
          Cléared · {PAA_VERSION}
        </div>
        <h2 className="display-serif mt-2 text-2xl text-obsidian">{PAA_TITLE}</h2>
        <div className="mt-5 space-y-4">
          {PAA_BODY.map((s) => (
            <div key={s.heading}>
              <div className="text-sm font-semibold text-obsidian">{s.heading}</div>
              <p className="mt-1 text-sm leading-relaxed text-obsidian/75">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Onboarding gate — GC cannot proceed until the PAA is signed.
 * `onSigned` fires once the SignWell flow completes.
 */
export function PaaSignStep({
  defaultName, defaultEmail, onSigned,
}: { defaultName?: string; defaultEmail?: string; onSigned?: (rec: PaaRecord) => void }) {
  const [rec, setRec] = useState<PaaRecord | null>(null);
  const [name, setName] = useState(defaultName ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { setRec(loadPaa()); }, []);
  useEffect(() => { if (defaultName && !name) setName(defaultName); }, [defaultName]);
  useEffect(() => { if (defaultEmail && !email) setEmail(defaultEmail); }, [defaultEmail]);

  async function sign() {
    if (!name.trim()) return toast.error("Enter the signer's full legal name");
    if (!agree) return toast.error("Confirm you are authorized to sign for the firm");
    setSending(true);
    // SignWell e-signature flow. Replace with the provider redirect/embed when the
    // SignWell account is connected; the completion callback saves the same record.
    await new Promise((r) => setTimeout(r, 700));
    const saved = savePaa({ signerName: name, signerEmail: email });
    setRec(saved);
    setSending(false);
    toast.success("Permit Agent Authorization signed");
    onSigned?.(saved);
  }

  if (rec) return <PaaSignedCard rec={rec} />;

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Required step</div>
        <h1 className="display-serif mt-1 text-3xl text-obsidian">Sign Your Permit Agent Authorization</h1>
        <p className="mt-2 text-sm text-obsidian/65">
          This one-time authorization lets Cléared file NTBOs, submit permit applications as your
          authorized agent, communicate with building departments, and receive issued permits on your behalf.
        </p>
      </div>

      <PaaDocument />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Signer full legal name</Label>
          <Input className="mt-1.5 rounded-[3px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Javier Mendez" />
        </div>
        <div>
          <Label className="text-xs">Signer email</Label>
          <Input className="mt-1.5 rounded-[3px]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourfirm.com" />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-obsidian/75">
        <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} className="mt-0.5" />
        <span>
          I am the licensed qualifier or an officer authorized to bind the firm, and I authorize Cléared
          to act as permit agent under the terms above.
        </span>
      </label>

      <Button variant="dark" className="rounded-[3px] gap-2" disabled={sending} onClick={sign}>
        <FileSignature className="h-4 w-4" />
        {sending ? "Opening SignWell…" : "Sign Document"}
      </Button>
    </div>
  );
}

export function PaaSignedCard({ rec }: { rec: PaaRecord }) {
  return (
    <div className="space-y-4">
      <PaaDraftBanner />
      <div className="border border-emerald-600/25 bg-emerald-50/60 p-5 rounded-[3px]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <div className="text-sm font-semibold text-obsidian">Permit Agent Authorization signed</div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <Meta label="Signed date" value={new Date(rec.signedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
          <Meta label="Signer" value={rec.signerName} />
          <Meta label="Version" value={rec.version} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-[3px] gap-1.5" onClick={() => downloadPaa(rec)}>
            <Download className="h-3.5 w-3.5" /> Download signed PAA
          </Button>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/55">
            <ShieldCheck className="h-3 w-3" /> {rec.provider} · {rec.envelopeId}
          </span>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">{label}</div>
      <div className="mt-0.5 text-sm text-obsidian">{value}</div>
    </div>
  );
}
