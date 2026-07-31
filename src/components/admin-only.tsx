// Client-side admin gate for admin-only pages that don't render inside
// PortalShell (which has its own /admin guard). Data access is already
// enforced server-side (RLS + assertAdmin); this prevents a non-admin from
// reaching the UI by typing a URL.

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/use-session";

export function AdminOnly({ children }: { children: ReactNode }) {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session.loading && !session.isAdmin) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [session.loading, session.isAdmin, navigate]);

  if (session.loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Verifying access…
        </div>
      </div>
    );
  }

  if (!session.isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6">
        <div className="max-w-sm text-center">
          <div className="label-eyebrow text-muted-foreground">Restricted</div>
          <h1 className="mt-3 display-serif text-3xl">Admin only.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is limited to Cleard staff.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.14em] underline underline-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
