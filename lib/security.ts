// Dummy security implementation for Next.js stack
import { getDb } from "./db";
import { Prisma } from "./generated/prisma/client";

export interface SecurityContext {
  waitUntil(promise: Promise<unknown>): void;
}

export function security() {
  return {
    protect: async (_req: Request, _ctx: unknown, next: () => Promise<Response>) => next(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ban: async (..._args: unknown[]) => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unban: async (..._args: unknown[]) => {}
  };
}

export function zoneClient() {
  return null;
}

export async function logSecurityEvent(event: Prisma.SecurityEventCreateInput): Promise<void> {
  await getDb().securityEvent.create({ data: event });
}

export function protect(request: Request, _env: unknown, ctx: SecurityContext, next: () => Promise<Response>): Promise<Response> {
  return security().protect(request, ctx, next);
}

