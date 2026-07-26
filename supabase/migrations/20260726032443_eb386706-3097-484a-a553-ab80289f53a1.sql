
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR tenant_id = public.current_tenant_id() OR public.is_admin());
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE TABLE public.service_fee_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid REFERENCES public.permits(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_value_cents bigint NOT NULL,
  fee_cents bigint NOT NULL,
  processing_fee_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  environment text NOT NULL DEFAULT 'sandbox',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_service_fee_invoices_permit ON public.service_fee_invoices(permit_id);
CREATE INDEX idx_service_fee_invoices_tenant ON public.service_fee_invoices(tenant_id);

GRANT SELECT ON public.service_fee_invoices TO authenticated;
GRANT ALL ON public.service_fee_invoices TO service_role;
ALTER TABLE public.service_fee_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant views own service fee invoices" ON public.service_fee_invoices
  FOR SELECT USING (tenant_id = public.current_tenant_id() OR public.is_admin());
CREATE POLICY "Service role manages service fee invoices" ON public.service_fee_invoices
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER trg_subscriptions_touch BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_service_fee_invoices_touch BEFORE UPDATE ON public.service_fee_invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.permits ADD COLUMN IF NOT EXISTS total_project_value_cents bigint;
