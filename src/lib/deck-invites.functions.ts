import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().trim().min(8).max(64) });

export const createDeckInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ password: z.string(), label: z.string().trim().min(1).max(160) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { assertDeckAdmin, createInvite } = await import("./deck-invites.server");
    assertDeckAdmin(data.password);
    return createInvite(data.label);
  });

export const listDeckInvites = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { assertDeckAdmin, listInvites } = await import("./deck-invites.server");
    assertDeckAdmin(data.password);
    return listInvites();
  });

export const revokeDeckInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string(), id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { assertDeckAdmin, revokeInvite } = await import("./deck-invites.server");
    assertDeckAdmin(data.password);
    return revokeInvite(data.id);
  });

export const peekDeckInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { peekInvite } = await import("./deck-invites.server");
    return peekInvite(data.token);
  });

export const verifyDeckInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.extend({ passcode: z.string().trim().max(64) }).parse(data))
  .handler(async ({ data }) => {
    const { verifyInvite } = await import("./deck-invites.server");
    return verifyInvite(data.token, data.passcode);
  });
