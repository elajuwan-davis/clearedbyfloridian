const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-red-100 border-b border-red-300 px-4 py-2 text-center text-xs font-mono uppercase tracking-[0.15em] text-red-800">
        Production checkout is not configured. Complete Stripe go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs font-mono uppercase tracking-[0.15em] text-orange-800">
        Preview checkout is in test mode — use card 4242 4242 4242 4242.
      </div>
    );
  }
  return null;
}
