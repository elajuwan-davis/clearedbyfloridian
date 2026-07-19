import { useEffect, useState } from "react";
import { computeAlerts, type Alert } from "@/lib/expiration-alerts";
import { LIB_KEY } from "@/lib/subcontractor-library";

export function useExpirationAlerts(): Alert[] {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const recompute = () => setAlerts(computeAlerts());
    recompute();

    const onStorage = (e: StorageEvent) => {
      if (e.key === LIB_KEY || e.key === null) recompute();
    };
    const onCustom = () => recompute();
    window.addEventListener("storage", onStorage);
    window.addEventListener("cleared:subs-updated", onCustom);
    // Recompute daily boundary changes
    const t = window.setInterval(recompute, 60 * 60 * 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cleared:subs-updated", onCustom);
      window.clearInterval(t);
    };
  }, []);

  return alerts;
}
