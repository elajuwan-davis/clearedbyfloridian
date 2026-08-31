/**
 * View mode: Cleard staff can switch the portal between the full admin backend
 * and a scoped client view (currently Flōridian). Persisted in localStorage so
 * the choice survives navigation and reloads.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FLORIDIAN_TENANT_ID,
  resolveActiveTenantId,
  type ViewMode,
} from "@/lib/tenant-scope";

export type { ViewMode };
export { FLORIDIAN_TENANT_ID };

const STORAGE_KEY = "cleard_view_mode";

type ViewModeContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  /** Tenant the client view is scoped to; null in admin mode. */
  activeTenantId: string | null;
  /** Admin-mode client filter. null = no client picked yet. */
  selectedTenantId: string | null;
  setSelectedTenantId: (id: string | null) => void;
};

const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: "admin",
  setViewMode: () => {},
  activeTenantId: null,
  selectedTenantId: null,
  setSelectedTenantId: () => {},
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("admin");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

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
      selectedTenantId,
      setSelectedTenantId,
    }),
    [viewMode, selectedTenantId],
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  return useContext(ViewModeContext);
}

/**
 * Tenant id the current view is scoped to. In admin mode with no client picked
 * this is the `"__none__"` sentinel, which data helpers read as "show nothing".
 */
export function useActiveTenantId(): string | null {
  const { viewMode, selectedTenantId } = useViewMode();
  return resolveActiveTenantId(viewMode, selectedTenantId);
}
