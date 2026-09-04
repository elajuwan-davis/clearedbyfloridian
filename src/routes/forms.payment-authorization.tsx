import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbedded } from "@/components/stripe-embedded";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, FileSignature, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  PAYMENT_AUTH_TERMS,
  createPaymentAuthDraft,
  generatePaymentAuthPdf,
  isPaymentAuthSigned,
  loadPaymentAuth,
  type PaymentAuthRecord,
} from "@/lib/payment-auth";
import { EmbeddedSigningDialog } from "@/components/embedded-signing-dialog";
import { sendAgreementForSignature, type SignatureRequest } from "@/lib/signature-requests";
import { supabase } from "@/integrations/supabase/client";
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
  const [sending, setSending] = useState(false);
  const [signerEmail, setSignerEmail] = useState<string | null>(null);
  const [signing, setSigning] = useState<
    (SignatureRequest & { embeddedSigningUrl?: string }) | null
  >(null);

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

  const refreshAuth = useCallback(async () => {
    setOnFile(await loadPaymentAuth());
  }, []);

  useEffect(() => {
    void refreshAuth();
    void refreshMethods();
    void supabase.auth.getUser().then(({ data }) => setSignerEmail(data?.user?.email ?? null));
  }, [refreshAuth, refreshMethods]);

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
    if (!signerEmail) {
      toast.error("Sign in to sign the authorization");
      return false;
    }
    return true;
  }

  /** Real SignWell document generated from the terms rendered above. */
  async function signAuthorization() {
    if (!validate()) return;
    setSending(true);
    try {
      const draft = await createPaymentAuthDraft({
        accountHolder: form.cardholder,
        billingAddress: form.billingAddress,
        authorizationDate: form.authDate,
      });
      const pdf = await generatePaymentAuthPdf({
        accountHolder: form.cardholder,
        billingAddress: form.billingAddress,
        authorizationDate: form.authDate,
      });
      const req = await sendAgreementForSignature({
        contextKind: "payment_authorization",
        contextId: draft.id,
        documentName: "Payment Authorization",
        pdf,
        recipientEmail: signerEmail ?? "",
        recipientName: form.cardholder,
        subject: "Signature required — Payment Authorization",
      });
      setSigning(req);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  /** Only the webhook can make this signed; the iframe closing means nothing. */
  async function afterSigning() {
    const fresh = await loadPaymentAuth();
    setOnFile(fresh);
    if (isPaymentAuthSigned(fresh)) toast.success("Payment authorization signed");
    else toast.message("Waiting on SignWell to confirm the signature.");
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
    if (!isPaymentsConfigured()) {
      toast.error("Stripe is not configured for this build yet.");
      return;
    }
    if (!isPaymentAuthSigned(onFile)) {
      toast.error("Sign the authorization first — SignWell has to confirm it.");
      return;
    }
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
          <h1 className="mt-2 text-[22px] font-bold tracking-tight text-obsidian">Payment Authorization</h1>
          <p className="mt-3 text-sm text-obsidian/55">
            Card and bank details are collected and stored by Stripe. Cleard never sees or stores
            your payment credentials.
          </p>
        </div>

        <section className="mt-8 space-y-3">
          <h2 className="text-[16px] font-semibold tracking-tight text-obsidian">Payment methods on file</h2>
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
          {onFile && isPaymentAuthSigned(onFile) && onFile.completedAt && (
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-obsidian/50">
              Authorization signed {new Date(onFile.completedAt).toLocaleDateString()} by{" "}
              {onFile.accountHolder} · SignWell confirmed
            </p>
          )}
          {onFile && !isPaymentAuthSigned(onFile) && onFile.status !== "draft" && (
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-amber-700">
              Authorization sent to SignWell — awaiting confirmation
            </p>
          )}
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-[16px] font-semibold tracking-tight text-obsidian">Authorized account holder</h2>

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

        <section className="mt-8 space-y-3">
          <h2 className="text-[16px] font-semibold tracking-tight text-obsidian">Terms and Conditions</h2>
          {/* Rendered from the same list the signed PDF is built from. */}
          <div className="border border-obsidian/15 bg-paper-warm rounded-[3px] p-5 text-sm text-obsidian/75 leading-relaxed max-h-72 overflow-y-auto space-y-3">
            {PAYMENT_AUTH_TERMS.map((t) => (
              <p key={t.heading ?? t.body.slice(0, 24)}>
                {t.heading && <strong>{t.heading}:</strong>} {t.body}
              </p>
            ))}
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
          <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
            Signature — signed through SignWell
          </Label>
          <p className="text-sm text-obsidian/60">
            The authorization above is generated as a PDF and signed inside this page through
            SignWell. It counts as signed only once SignWell confirms it.
          </p>
          <Button
            variant="dark"
            className="rounded-[3px] gap-2"
            disabled={sending || isPaymentAuthSigned(onFile)}
            onClick={() => void signAuthorization()}
          >
            <FileSignature className="h-4 w-4" />
            {isPaymentAuthSigned(onFile)
              ? "Authorization signed"
              : sending
                ? "Opening SignWell…"
                : "Sign authorization"}
          </Button>
        </section>

        <div className="mt-10 pt-6 border-t border-obsidian/10 space-y-3">
          <Button
            variant="dark"
            className="rounded-[3px] w-full sm:w-auto"
            disabled={!isPaymentAuthSigned(onFile)}
            onClick={openCheckout}
          >
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
