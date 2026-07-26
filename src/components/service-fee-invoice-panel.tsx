import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createServiceFeeCheckout } from "@/lib/payments.functions";
import {
  calculateServiceFeeCents,
  formatUsd,
  getStripeEnvironment,
  isPaymentsConfigured,
  stripeProcessingFeeCents,
} from "@/lib/stripe";
import { StripeEmbedded } from "@/components/stripe-embedded";
import { CreditCard, CheckCircle2, Clock } from "lucide-react";

type Row = {
  id: string;
  status: string;
  fee_cents: number;
  processing_fee_cents: number;
  project_value_cents: number;
  paid_at: string | null;
  created_at: string;
};

export function ServiceFeeInvoicePanel({
  permitId,
  projectAddress,
  totalProjectValueCents,
  permitStatus,
}: {
  permitId: string;
  projectAddress: string;
  totalProjectValueCents: number | null;
  permitStatus: string;
}) {
  const startCheckout = useServerFn(createServiceFeeCheckout);
  const [invoice, setInvoice] = useState<Row | null>(null);
  const [openCheckout, setOpenCheckout] = useState(false);

  const projectValueUsd = totalProjectValueCents ? totalProjectValueCents / 100 : 0;
  const estFeeCents = calculateServiceFeeCents(projectValueUsd);
  const estProcCents = stripeProcessingFeeCents(estFeeCents);
  const totalWithProcessing = estFeeCents + estProcCents;

  const env = isPaymentsConfigured() ? getStripeEnvironment() : null;
  const readyToInvoice = permitStatus === "approved" || permitStatus === "permit_issued";

  async function refetch() {
    if (!env) return;
    const { data } = await (supabase.from("service_fee_invoices" as any) as any)
      .select("id, status, fee_cents, processing_fee_cents, project_value_cents, paid_at, created_at")
      .eq("permit_id", permitId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setInvoice((data as any) ?? null);
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permitId, env]);

  async function fetchClientSecret(): Promise<string> {
    if (!env) throw new Error("Checkout unavailable");
    const result = await startCheckout({
      data: {
        permitId,
        projectAddress: projectAddress || "Cleard project",
        projectValueUsd,
        returnUrl: `${window.location.origin}/portal/permits/${permitId}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
        environment: env,
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  }

  if (!isPaymentsConfigured()) return null;

  const paid = invoice?.status === "paid";

  return (
    <section className="rounded-[3px] border border-obsidian/15 bg-white p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/50">
            Cleard Service Fee · Per Project
          </div>
          <h3 className="display-serif text-2xl mt-2 text-obsidian">
            {paid ? "Service fee paid" : "Bundled service fee"}
          </h3>
        </div>
        {paid ? (
          <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-emerald-50 text-emerald-800 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.15em]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Paid
          </span>
        ) : readyToInvoice ? (
          <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-blue-50 text-blue-800 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.15em]">
            <Clock className="h-3.5 w-3.5" /> Ready to invoice
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-obsidian/5 text-obsidian/60 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.15em]">
            Pending · Invoice at Cleared for Takeoff
          </span>
        )}
      </div>

      {projectValueUsd <= 0 ? (
        <div className="mt-5 text-sm text-obsidian/70">
          Add a <em>Total Project Value</em> on this permit to see the service fee estimate.
        </div>
      ) : (
        <div className="mt-5 grid md:grid-cols-3 gap-4">
          <div className="rounded-[3px] border border-obsidian/10 p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-obsidian/50">
              Project value
            </div>
            <div className="display-serif text-2xl mt-1 text-obsidian">
              {formatUsd(totalProjectValueCents ?? 0)}
            </div>
            <div className="text-[11px] text-obsidian/50 mt-1">
              Rate: {projectValueUsd >= 1_000_000 ? "0.5%" : "1%"}
            </div>
          </div>
          <div className="rounded-[3px] border border-obsidian/10 p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-obsidian/50">
              Service fee
            </div>
            <div className="display-serif text-2xl mt-1 text-obsidian">
              {formatUsd(invoice?.fee_cents ?? estFeeCents)}
            </div>
            <div className="text-[11px] text-obsidian/50 mt-1">All services bundled</div>
          </div>
          <div className="rounded-[3px] border border-obsidian/10 p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-obsidian/50">
              Total w/ processing
            </div>
            <div className="display-serif text-2xl mt-1 text-obsidian">
              {formatUsd((invoice?.fee_cents ?? estFeeCents) + (invoice?.processing_fee_cents ?? estProcCents))}
            </div>
            <div className="text-[11px] text-obsidian/50 mt-1">
              Stripe 2.9% + $0.30 pass-through
            </div>
          </div>
        </div>
      )}

      {!paid && projectValueUsd > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (!readyToInvoice) {
                toast.info("This permit isn't at Cleared for Takeoff yet. You can still pay early.");
              }
              setOpenCheckout(true);
            }}
            className="h-11 px-5 rounded-[3px] bg-obsidian text-white font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-obsidian/90 inline-flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Pay {formatUsd(totalWithProcessing)}
          </button>
          <span className="text-[11px] text-obsidian/50">
            Covers permit administration, plan review, inspections, C.O., Victoria AI, and municipal follow-up.
          </span>
        </div>
      )}

      {openCheckout && (
        <StripeEmbedded
          fetchClientSecret={fetchClientSecret}
          onClose={() => {
            setOpenCheckout(false);
            refetch();
          }}
        />
      )}
    </section>
  );
}
