# Operating rules
1. Framework: Flare, stack = next (Next.js 16, Neon Postgres, Prisma 7). Never
   introduce Cloudflare Workers, D1, Durable Objects or Drizzle.
2. Generate before you hand-write: use `npx flare gen ...`. Never edit inside
   Flare's generated marker blocks. Put custom code outside them or under lib/catalog.
3. Docs first: at the start of each day, read the listed Flare docs pages. If docs
   contradict PLAN.md, the docs win. Record the deviation in docs/DEVIATIONS.md.
4. Domain logic is pure TypeScript in lib/catalog, no I/O, fully unit tested.
5. Strict TS, Zod at boundaries, no `any`, no unchecked env access (central env.ts).
6. Security: sanitize all markdown, https-only URLs, secret scan on free text,
   server-side policy enforcement, security headers. Never log secrets.
7. Quality gate before any commit: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
8. Do not ask the user anything. Use the Default Decisions table. If truly blocked
   by something only a human can supply (credentials, account login), write
   BLOCKED-HUMAN in PROGRESS.md with the exact unblock steps and continue with
   everything that is not blocked.
9. Small commits, conventional messages: feat:, fix:, test:, docs:, chore:.
10. Update PROGRESS.md after every task: status, evidence (command output or
    screenshot path), next step.
11. Pin the Flare version in package.json (no ^ range on @flaredev/*).
12. If a Flare generator drifts or errors, re-read the CLI reference, fix the
    descriptor, and re-run. Do not hand-patch generated blocks.
