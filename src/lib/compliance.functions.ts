import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ScanInput = z.object({ subId: z.string().uuid() });

export const scanCoiFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScanInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertSubAccess } = await import("./compliance-access.server");
    await assertSubAccess(context.supabase, data.subId);
    const { runScanCoi } = await import("./compliance-core.server");
    return runScanCoi(data);
  });

export const scanW9Fn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScanInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertSubAccess } = await import("./compliance-access.server");
    await assertSubAccess(context.supabase, data.subId);
    const { runScanW9 } = await import("./compliance-core.server");
    return runScanW9(data);
  });

export const verifyLicenseFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScanInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertSubAccess } = await import("./compliance-access.server");
    await assertSubAccess(context.supabase, data.subId);
    const { runVerifyLicense } = await import("./compliance-core.server");
    return runVerifyLicense(data);
  });
