/**
 * View mode: Cleard staff can switch the portal between the full admin backend
 * and a scoped client view (currently Flōridian). Persisted in localStorage so
 * the choice survives navigation and reloads.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ViewMode = "admin" | "client";

export const FLORIDIAN_TENANT_ID = "3e137bde-7c3b-46b6-bcf9-57b703fd5592";

const STORAGE_KEY = "cleard_view_mode";

type ViewModeContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  /** Tenant the client view is scoped to; null in admin mode. */
  activeTenantId: string | null;
};

const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: "admin",
  setViewMode: () => {},
  activeTenantId: null,
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("admin");

  // Read after mount so SSR and hydration agree.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "client" || stored === "admin") setViewModeState(stored);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<ViewModeContextValue>(
    () => ({
      viewMode,
      setViewMode: (mode: ViewMode) => {
        setViewModeState(mode);
        try {
          localStorage.setItem(STORAGE_KEY, mode);
        } catch {
          /* storage unavailable */
        }
      },
      activeTenantId: viewMode === "client" ? FLORIDIAN_TENANT_ID : null,
    }),
    [viewMode],
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  return useContext(ViewModeContext);
}

/** Tenant id the current view is scoped to (null = unscoped admin view). */
export function useActiveTenantId(): string | null {
  return useViewMode().activeTenantId;
}
