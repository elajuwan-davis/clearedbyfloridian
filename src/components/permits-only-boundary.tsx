import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  isPermitsOnlyEmail,
  isPermitsOnlyPathAllowed,
  isProtectedAppPath,
  PERMITS_ONLY_HOME,
} from "@/lib/permits-only";

export function PermitsOnlyBoundary({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [checking, setChecking] = useState(() => isProtectedAppPath(pathname));
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isProtectedAppPath(pathname) || isPermitsOnlyPathAllowed(pathname)) {
      setBlocked(false);
      setChecking(false);
      return () => {
        cancelled = true;
      };
    }

    setChecking(true);
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const shouldBlock = isPermitsOnlyEmail(data.user?.email);
      setBlocked(shouldBlock);
      setChecking(false);
      if (shouldBlock) {
        navigate({ to: PERMITS_ONLY_HOME as never, replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, pathname]);

  if (blocked || checking) {
    return (
      <div className="portal-ui dark grid min-h-screen place-items-center bg-background">
        <div className="text-[13px] text-muted-foreground">
          {blocked ? "Taking you to Permits…" : "Verifying access…"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}