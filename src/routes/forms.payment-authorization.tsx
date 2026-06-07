import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { savePaymentAuth, detectCardBrand, type PaymentAuthRecord } from "@/lib/payment-auth";

export const Route = createFileRoute("/forms/payment-authorization")({
  head: () => ({ meta: [{ title: "Payment Authorization — Cleared" }, { name: "robots", content: "noindex" }] }),
  component: PaymentAuthPage,
});

function PaymentAuthPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    cardholder: "",
    billingAddress: "",
    cardType: "Credit" as "Credit" | "Debit" | "ACH",
    cardNumber: "",
    expiry: "",
    cvv: "",
    authDate: today,
  });
  const [agreed, setAgreed] = useState(false);
  const brand = detectCardBrand(form.cardNumber);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = "#111827";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    ctx.beginPath(); ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    ctx.lineTo(x, y); ctx.stroke();
    hasInk.current = true;
    if (!signed) setSigned(true);
  }

  function end() { drawing.current = false; }

  function clearSig() {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    hasInk.current = false;
    setSigned(false);
  }

  function submit() {
    if (!form.cardholder.trim()) return toast.error("Cardholder Name is required");
    if (!form.billingAddress.trim()) return toast.error("Billing Address is required");
    const digits = form.cardNumber.replace(/\s/g, "");
    if (digits.length < 8) return toast.error("Enter a valid card / account number");
    if (form.cardType !== "ACH" && !/^\d{2}\/\d{2}$/.test(form.expiry)) return toast.error("Expiry must be MM/YY");
    if (form.cardType !== "ACH" && !/^\d{3,4}$/.test(form.cvv)) return toast.error("Enter a valid CVV");
    if (!agreed) return toast.error("You must agree to the terms");
    if (!signed) return toast.error("Please sign to authorize");

    const sigDataUrl = canvasRef.current?.toDataURL("image/png") ?? "";
    const record: PaymentAuthRecord = {
      cardholder: form.cardholder,
      billingAddress: form.billingAddress,
      cardType: form.cardType,
      brand: form.cardType === "ACH" ? "ACH" : brand,
      last4: digits.slice(-4),
      expiry: form.cardType === "ACH" ? "" : form.expiry,
      authorizedAt: new Date().toISOString(),
      authorizationDate: form.authDate,
      signatureDataUrl: sigDataUrl,
    };
    savePaymentAuth(record);
    toast.success("Payment authorization saved and on file.");
    navigate({ to: "/profile" });
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <button onClick={() => navigate({ to: "/forms" })} className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian mb-6">
          <ArrowLeft className="h-3 w-3" /> All forms
        </button>

        <div className="border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Form / 03 — Payment Authorization</div>
          <h1 className="display-serif mt-3 text-4xl text-obsidian">Payment Authorization</h1>
        </div>

        <section className="mt-10 space-y-6">
          <h2 className="display-serif text-2xl text-obsidian">Payment Information</h2>

          <Field label="Cardholder Name" required>
            <Input className="rounded-[3px]" value={form.cardholder} onChange={(e) => update("cardholder", e.target.value)} />
          </Field>

          <Field label="Billing Address" required>
            <Textarea className="rounded-[3px] min-h-[88px]" value={form.billingAddress} onChange={(e) => update("billingAddress", e.target.value)} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type of Card / Payment" required>
              <Select value={form.cardType} onValueChange={(v) => update("cardType", v as typeof form.cardType)}>
                <SelectTrigger className="rounded-[3px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Debit">Debit</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Authorization Date" required>
              <Input type="date" className="rounded-[3px]" value={form.authDate} onChange={(e) => update("authDate", e.target.value)} />
            </Field>
          </div>

          <Field label={form.cardType === "ACH" ? "Account Number" : "Card Number"} required>
            <div className="relative">
              <Input
                className="rounded-[3px] font-mono pr-24"
                inputMode="numeric"
                value={form.cardNumber}
                onChange={(e) => update("cardNumber", e.target.value.replace(/[^\d\s]/g, ""))}
                placeholder={form.cardType === "ACH" ? "Routing / Account" : "•••• •••• •••• ••••"}
              />
              {form.cardType !== "ACH" && form.cardNumber && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono uppercase tracking-[0.14em] text-obsidian/60">
                  {brand}
                </span>
              )}
            </div>
          </Field>

          {form.cardType !== "ACH" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Expiration Date (MM/YY)" required>
                <Input className="rounded-[3px] font-mono" value={form.expiry} onChange={(e) => update("expiry", e.target.value)} placeholder="08/27" maxLength={5} />
              </Field>
              <Field label="CVV" required>
                <Input className="rounded-[3px] font-mono" value={form.cvv} onChange={(e) => update("cvv", e.target.value.replace(/\D/g, ""))} maxLength={4} />
              </Field>
            </div>
          )}
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="display-serif text-2xl text-obsidian">Terms and Conditions</h2>
          <div className="border border-obsidian/15 bg-paper-warm rounded-[3px] p-5 text-sm text-obsidian/75 leading-relaxed max-h-72 overflow-y-auto space-y-3">
            <p>
              By submitting this payment authorization form, I give full authorization to Cleared by Flōridian and its associates for payment of services, permit fees, and any other charges associated with any project under the contractor.
            </p>
            <p>
              <strong>ACH Payment Notice:</strong> If submitting an ACH payment for Payment of Services, a Debit or Credit card must be on file for payment of municipality permit fees.
            </p>
            <p>
              <strong>Scope of Services:</strong> Cleared acts solely as a liaison between the Client and government permitting agencies.
            </p>
            <p>
              <strong>Limitation of Liability:</strong> The Client agrees to indemnify, defend, and hold harmless Cleared, its owners, and employees from any claims arising out of or related to the project, including agency decisions, project delays, and work product accuracy.
            </p>
            <p>
              <strong>No Guarantee of Timelines:</strong> Turnaround estimates are based on past experience and do not constitute a guarantee.
            </p>
            <p>
              <strong>Strict No-Refund Policy:</strong> Once the permitting process has commenced, no refunds shall be issued for any reason. A $100 decline fee is assessed if declined payment is not rectified within two business days. All projects cease until payment is made and a 10% fee accrues on the total owed until rectified.
            </p>
            <p>This authorization remains in effect until cancelled in writing.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="rounded-[3px] mt-0.5" />
            <span className="text-sm text-obsidian">I acknowledge that I have read and agree to these terms and conditions.</span>
          </label>
        </section>

        <section className="mt-10 space-y-3">
          <div className="flex items-baseline justify-between">
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
              Signature — Please sign below to authorize this payment method
            </Label>
            <button type="button" onClick={clearSig} className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/55 hover:text-oxblood">
              Clear signature
            </button>
          </div>
          <canvas
            ref={canvasRef}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
            className="w-full h-44 bg-white border border-obsidian/25 rounded-[3px] touch-none cursor-crosshair"
            aria-label="Signature pad"
          />
        </section>

        <div className="mt-10 pt-6 border-t border-obsidian/10">
          <Button variant="dark" className="rounded-[3px] w-full sm:w-auto" onClick={submit}>
            Submit Payment Authorization
          </Button>
        </div>
      </div>
    </PortalShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
        {label}{required && <span className="text-oxblood ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
