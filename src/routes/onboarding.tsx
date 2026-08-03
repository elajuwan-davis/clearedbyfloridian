import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { updateMyTenantFn } from "@/lib/tenants.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { PaaSignStep } from "@/components/paa-sign-dialog";


export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Complete setup — Cleard" },
      { name: "description", content: "Finish setting up your Cleard account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const updateTenant = useServerFn(updateMyTenantFn);
  const [step, setStep] = useState<"password" | "company" | "paa" | "checking">("checking");
  const [signerEmail, setSignerEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify we have an authenticated invited user
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError("Invite link expired or invalid. Please contact info@cleard.com.");
        setStep("password");
        return;
      }
      setSignerEmail(data.session.user.email ?? "");
      setStep("password");

    });
  }, []);

  async function submitPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(err.message);
    // Prefill company name from tenant if we can read it
    const { data: member } = await (supabase.from("tenant_members" as any) as any)
      .select("tenants:tenant_id ( name, license_number )")
      .maybeSingle();
    const t = (member as any)?.tenants;
    if (t?.name) setTenantName(t.name);
    if (t?.license_number) setLicenseNumber(t.license_number);
    setStep("company");
  }

  async function submitCompany(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateTenant({
        data: {
          name: tenantName.trim(),
          license_number: licenseNumber.trim() || null,
        },
      });
      setStep("paa");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="wordmark text-4xl" style={{ color: "var(--obsidian)" }}>
            Cleard
          </div>
          <div className="wordmark-subline mt-2"></div>
        </div>

        {step === "checking" && (
          <div className="text-center font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
            Verifying invite…
          </div>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword} className="space-y-5">
            <div className="space-y-2">
              <div className="label-eyebrow">Step 1 of 3</div>
              <h1 className="display-serif text-3xl leading-tight">Set your password.</h1>
              <p className="text-sm text-muted-foreground">
                Choose a password to secure your account.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-[3px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11 rounded-[3px]"
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[3px] gap-2"
              style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}

        {step === "company" && (
          <form onSubmit={submitCompany} className="space-y-5">
            <div className="space-y-2">
              <div className="label-eyebrow">Step 2 of 3</div>
              <h1 className="display-serif text-3xl leading-tight">Confirm your company.</h1>
              <p className="text-sm text-muted-foreground">
                We'll set up your portal with this information.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="h-11 rounded-[3px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="license">Florida GC license (CGC/CBC)</Label>
              <Input
                id="license"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="h-11 rounded-[3px]"
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button
              type="submit"
              disabled={loading || !tenantName.trim()}
              className="w-full h-11 rounded-[3px] gap-2"
              style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}

        {step === "paa" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="label-eyebrow">Step 3 of 3</div>
              <h1 className="display-serif text-3xl leading-tight">Sign your Permit Agent Authorization.</h1>
              <p className="text-sm text-muted-foreground">
                Required before we can file on your behalf. You cannot enter the portal until this is signed.
              </p>
            </div>
            <PaaSignStep
              defaultName={tenantName}
              defaultEmail={signerEmail}
              onSigned={() => navigate({ to: "/portal", replace: true })}
            />
          </div>
        )}
      </div>

    </div>
  );
}
