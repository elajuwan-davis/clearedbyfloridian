import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ShieldCheck,
  PenLine,
  RotateCcw,
  Lock,
  FileSignature,
} from "lucide-react";

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
  const [hasSig, setHasSig] = useState(false);

  const sigRef = useRef<SignaturePadHandle>(null);

  const canSign = name.trim() && title.trim() && license.trim() && ack1 && ack2 && hasSig;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSign) return;
    navigate({ to: "/projects" });
  };

  return (
    <PortalShell>
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55 transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Projects
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
                  LPOA · Document Rev. 2026.06
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                Effective {TODAY}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 text-[15px] leading-[1.75] text-obsidian/85">
            <h2 className="display-serif text-2xl text-obsidian">
              Affidavit of Agency &amp; Limited Power of Attorney
            </h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
              Under FL Statute 553.791 — Private Provider Inspection &amp; Plans Review
            </p>

            <p className="mt-6">
              The undersigned, being the duly authorized qualifying agent for the licensed General
              Contractor of record, does hereby designate and appoint{" "}
              <strong className="text-obsidian">Cleard</strong> as the{" "}
              <em>private provider of record</em> for permit applications submitted through this
              portal.
            </p>

            <ol className="mt-6 space-y-4 [counter-reset:lpoa] list-none pl-0">
              <Clause n={1} title="Scope of Authority">
                Cleard is empowered to prepare, sign, and submit the affidavit of compliance under
                FL Statute 553.791; to perform plans review and inspections to verify compliance
                with the Florida Building Code; and to issue the certificate of compliance to the
                authority having jurisdiction.
              </Clause>
              <Clause n={2} title="Statutory Deadlines Acknowledged">
                I acknowledge that filing the affidavit obligates the AHJ to issue the permit or
                written citation within{" "}
                <strong className="text-obsidian">10 business days</strong>, and that the
                certificate of compliance obligates the AHJ to issue the certificate of occupancy
                for residential work within{" "}
                <strong className="text-obsidian">2 business days</strong>.
              </Clause>
              <Clause n={3} title="Inspections">
                Cleard may perform inspections directly or through duly licensed inspectors
                operating under its supervision. Real-time virtual inspections are conducted with a
                48-hour correction window per round.
              </Clause>
              <Clause n={4} title="Fees">
                I acknowledge that Cleard's fees — a permitting fee equal to{" "}
                <strong className="text-obsidian">1.5% of construction value</strong> and a flat
                private-provider administration fee of{" "}
                <strong className="text-obsidian">$8,856.00</strong> per filing — are invoiced
                automatically upon submission of the affidavit, and that county fees, if any, are
                separate and pass through to the AHJ.
              </Clause>
              <Clause n={5} title="Revocation">
                This authorization remains in effect until revoked in writing. Revocation does not
                relieve the GC of liability for filings made while this LPOA was effective and does
                not affect inspections or certificates already issued.
              </Clause>
              <Clause n={6} title="Indemnification">
                Cleard shall be indemnified against losses arising from materially false or
                incomplete information supplied by the GC, its design professionals, or its
                subcontractors. Cleard remains liable for its own negligent acts in performing
                plans review and inspections to the extent provided by Florida law.
              </Clause>
            </ol>

            <p className="mt-8 text-sm text-obsidian/65">
              By signing below under penalty of perjury, I affirm that I am the qualifying agent
              authorized to bind the General Contractor identified on this account, and that all
              information provided in connection with this LPOA is true and correct to the best of
              my knowledge.
            </p>
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

          {/* Signature Pad */}
          <div className="border-t border-obsidian/10 px-8 py-7">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
                  Signature
                </div>
                <div className="mt-1 text-xs text-obsidian/55">
                  Sign in the field below using mouse, stylus, or touch.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sigRef.current?.clear();
                  setHasSig(false);
                }}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/60 transition-opacity hover:opacity-70"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </button>
            </div>

            <SignaturePad
              ref={sigRef}
              onChange={(empty) => setHasSig(!empty)}
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                <span className="text-obsidian/65">/s/</span> {name || "—"} · {TODAY}
              </div>
              <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                <Lock className="h-3 w-3 text-sky/70" />
                Signature hashed &amp; timestamped
              </div>
            </div>
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
        </article>

        {/* Footer Actions */}
        <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-obsidian/10 pt-8 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
            <ShieldCheck className="h-3.5 w-3.5 text-sky" />
            Bank-grade encryption · Audit log retained 7 years
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="rounded-[3px]">
              <Link to="/projects">Cancel</Link>
            </Button>
            <Button type="submit" variant="dark" disabled={!canSign}>
              <PenLine className="mr-2 h-4 w-4" />
              Execute LPOA
            </Button>
          </div>
        </div>
      </form>
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

/* ─────────────── signature pad ─────────────── */

type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
};

const SignaturePad = forwardRef<
  SignaturePadHandle,
  { onChange?: (empty: boolean) => void }
>(function SignaturePad({ onChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const empty = useRef(true);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#16161a";
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    empty.current = true;
    onChange?.(true);
  };

  useImperativeHandle(ref, () => ({ clear, isEmpty: () => empty.current }));

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    last.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
    if (empty.current) {
      empty.current = false;
      onChange?.(false);
    }
  };

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    last.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="mt-4 relative border border-obsidian/20 bg-paper-warm/30">
      <div
        aria-hidden
        className="pointer-events-none absolute left-6 right-6 bottom-9 border-t border-obsidian/25 border-dashed"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-6 bottom-3 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/35"
      >
        Sign Above
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 bottom-3 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/35"
      >
        X
      </span>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="block h-48 w-full cursor-crosshair touch-none"
      />
    </div>
  );
});

