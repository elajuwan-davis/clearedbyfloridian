import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const authed = z.object({ password: z.string() });

export const investorAdminData = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => authed.parse(data))
  .handler(async ({ data }) => {
    const { assertAdmin, loadAdminData } = await import("./investor-admin.server");
    assertAdmin(data.password);
    return loadAdminData();
  });

export const investorAddDomain = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    authed.extend({ label: z.string().trim().min(1).max(120), domain: z.string().trim().min(3).max(120) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { assertAdmin, addDomain } = await import("./investor-admin.server");
    assertAdmin(data.password);
    return addDomain(data.label, data.domain);
  });

export const investorRemoveDomain = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => authed.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { assertAdmin, removeDomain } = await import("./investor-admin.server");
    assertAdmin(data.password);
    return removeDomain(data.id);
  });

export const investorGenerateCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    authed
      .extend({
        label: z.string().trim().min(1).max(160),
        expiresAt: z.string().trim().max(40).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { assertAdmin, generateCode } = await import("./investor-admin.server");
    assertAdmin(data.password);
    return generateCode(data.label, data.expiresAt ?? null);
  });
