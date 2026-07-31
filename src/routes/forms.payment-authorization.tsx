import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbedded } from "@/components/stripe-embedded";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { savePaymentAuth, loadPaymentAuth, type PaymentAuthRecord } from "@/lib/payment-auth";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { createPaymentAuthSetup, listSavedPaymentMethods } from "@/lib/payments.functions";

export const Route = createFileRoute("/forms/payment-authorization")({
  head: () => ({
    meta: [
      { title: "Payment Authorization — Cleard" },
      {
        name: "description",
        content: "Authorize Cleard to charge a card or bank account on file for services and permit fees.",
      },
      { property: "og:title", content: "Payment Authorization — Cleard" },
      {
        property: "og:description",
        content: "Authorize Cleard to charge a card or bank account on file for services and permit fees.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentAuthPage,
});

type SavedMethod = {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
};

function PaymentAuthPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    cardholder: "",
    billingAddress: "",
    authDate: today,
  });
  const [agreed, setAgreed] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [methods, setMethods] = useState<SavedMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [onFile, setOnFile] = useState<PaymentAuthRecord | null>(null);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const refreshMethods = useCallback(async () => {
    if (!isPaymentsConfigured()) {
      setLoadingMethods(false);
      return;
    }
    try {
      const res = await listSavedPaymentMethods({
        data: { environment: getStripeEnvironment() },
      });
      if ("error" in res) throw new Error(res.error);
      setMethods(res.methods);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMethods(false);
    }
  }, []);

  useEffect(() => {
    setOnFile(loadPaymentAuth());
    void refreshMethods();
  }, [refreshMethods]);

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
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
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!signed) setSigned(true);
  }
  function end() {
    drawing.current = false;
  }
  function clearSig() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setSigned(false);
  }

  function validate(): boolean {
    if (!form.cardholder.trim()) {
      toast.error("Account holder name is required");
      return false;
    }
    if (!form.billingAddress.trim()) {
      toast.error("Billing address is required");
      return false;
    }
    if (!agreed) {
      toast.error("You must agree to the terms");
      return false;
    }
    if (!signed) {
      toast.error("Please sign to authorize");
      return false;
    }
    return true;
  }

  const fetchClientSecret = useCallback(async () => {
    const res = await createPaymentAuthSetup({
      data: {
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/forms/payment-authorization?setup=complete`,
      },
    });
    if ("error" in res) throw new Error(res.error);
    if (!res.clientSecret) throw new Error("Stripe did not return a client secret");
    return res.clientSecret;
  }, []);

  function openCheckout() {
    if (!validate()) return;
    if (!isPaymentsConfigured()) {
      toast.error("Stripe is not configured for this build yet.");
      return;
    }
    const record: PaymentAuthRecord = {
      cardholder: form.cardholder,
      billingAddress: form.billingAddress,
      cardType: "Credit",
      brand: "Stripe",
      last4: "",
      expiry: "",
      authorizedAt: new Date().toISOString(),
      authorizationDate: form.authDate,
      signatureDataUrl: canvasRef.current?.toDataURL("image/png") ?? "",
    };
    savePaymentAuth(record);
    setOnFile(record);
    setCheckoutOpen(true);
  }

  // Returning from Stripe.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("setup") === "complete") {
      toast.success("Payment method saved securely with Stripe.");
      void refreshMethods();
    }
  }, [refreshMethods]);

  return (
    <PortalShell>
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Payment Authorization</div>
          <h1 className="display-serif mt-3 text-4xl text-obsidian">Payment Authorization</h1>
          <p className="mt-3 text-sm text-obsidian/55">
            Card and bank details are collected and stored by Stripe. Cleard never sees or stores
            your payment credentials.
          </p>
        </div>

        <section className="mt-10 space-y-4">
          <h2 className="display-serif text-2xl text-obsidian">Payment methods on file</h2>
          {loadingMethods ? (
            <p className="text-sm text-obsidian/55">Loading…</p>
          ) : methods.length === 0 ? (
            <div className="border border-obsidian/15 rounded-[3px] p-5 text-sm text-obsidian/60">
              No payment method on file yet. Complete the authorization below to add one.
            </div>
          ) : (
            <ul className="border border-obsidian/15 rounded-[3px] divide-y divide-obsidian/10">
              {methods.map((m) => (
                <li key={m.id} className="flex items-center gap-4 p-4">
                  <CreditCard className="h-4 w-4 text-obsidian/60" strokeWidth={1.5} />
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-obsidian">
                    {m.brand} •••• {m.last4}
                  </span>
                  {m.expMonth && m.expYear && (
                    <span className="ml-auto font-mono text-[11px] text-obsidian/55">
                      {String(m.expMonth).padStart(2, "0")}/{String(m.expYear).slice(-2)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {onFile && (
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-obsidian/50">
              Authorization signed {new Date(onFile.authorizedAt).toLocaleDateString()} by{" "}
              {onFile.cardholder}
            </p>
          )}
        </section>

        <section className="mt-12 space-y-6">
          <h2 className="display-serif text-2xl text-obsidian">Authorized account holder</h2>

          <Field label="Account Holder Name" required>
            <Input
              className="rounded-[3px]"
              value={form.cardholder}
              onChange={(e) => update("cardholder", e.target.value)}
            />
          </Field>

          <Field label="Billing Address" required>
            <Textarea
              className="rounded-[3px] min-h-[88px]"
              value={form.billingAddress}
              onChange={(e) => update("billingAddress", e.target.value)}
            />
          </Field>

          <Field label="Authorization Date" required>
            <Input
              type="date"
              className="rounded-[3px]"
              value={form.authDate}
              onChange={(e) => update("authDate", e.target.value)}
            />
          </Field>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="display-serif text-2xl text-obsidian">Terms and Conditions</h2>
          <div className="border border-obsidian/15 bg-paper-warm rounded-[3px] p-5 text-sm text-obsidian/75 leading-relaxed max-h-72 overflow-y-auto space-y-3">
            <p>
              By submitting this payment authorization form, I give full authorization to Cleard and
              its associates for payment of services, permit fees, and any other charges associated
              with any project under the contractor.
            </p>
            <p>
              <strong>ACH Payment Notice:</strong> If submitting an ACH payment for Payment of
              Services, a Debit or Credit card must be on file for payment of municipality permit
              fees.
            </p>
            <p>
              <strong>Scope of Services:</strong> Cleard acts solely as a liaison between the Client
              and government permitting agencies.
            </p>
            <p>
              <strong>Limitation of Liability:</strong> The Client agrees to indemnify, defend, and
              hold harmless Cleard, its owners, and employees from any claims arising out of or
              related to the project, including agency decisions, project delays, and work product
              accuracy.
            </p>
            <p>
              <strong>No Guarantee of Timelines:</strong> Turnaround estimates are based on past
              experience and do not constitute a guarantee.
            </p>
            <p>
              <strong>Strict No-Refund Policy:</strong> Once the permitting process has commenced,
              no refunds shall be issued for any reason. A $100 decline fee is assessed if declined
              payment is not rectified within two business days. All projects cease until payment is
              made and a 10% fee accrues on the total owed until rectified.
            </p>
            <p>This authorization remains in effect until cancelled in writing.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="rounded-[3px] mt-0.5"
            />
            <span className="text-sm text-obsidian">
              I acknowledge that I have read and agree to these terms and conditions.
            </span>
          </label>
        </section>

        <section className="mt-10 space-y-3">
          <div className="flex items-baseline justify-between">
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
              Signature — Please sign below to authorize this payment method
            </Label>
            <button
              type="button"
              onClick={clearSig}
              className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/55 hover:text-oxblood"
            >
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

        <div className="mt-10 pt-6 border-t border-obsidian/10 space-y-3">
          <Button variant="dark" className="rounded-[3px] w-full sm:w-auto" onClick={openCheckout}>
            Continue to secure Stripe checkout
          </Button>
          <p className="flex items-center gap-2 text-xs text-obsidian/55">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            Payment details are entered directly on Stripe's PCI-compliant checkout.
          </p>
          <button
            onClick={() => navigate({ to: "/profile" })}
            className="text-xs font-mono uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian"
          >
            Back to profile
          </button>
        </div>
      </div>

      {checkoutOpen && (
        <StripeEmbedded
          fetchClientSecret={fetchClientSecret}
          onClose={() => {
            setCheckoutOpen(false);
            void refreshMethods();
          }}
        />
      )}
    </PortalShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
        {label}
        {required && <span className="text-oxblood ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
