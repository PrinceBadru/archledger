# ArchLedger: System Catalog & Decision Log
### Panel plan + autonomous execution playbook for Antigravity

**Locked constraints:** Flare (https://flare-docs.codetotech.com/) is the primary framework. Stack is **Next.js on Vercel** (`--stack next`: Next.js 16, Neon Postgres, Prisma 7, Upstash Redis cache). No Cloudflare-only features (no Durable Objects realtime, no D1, no Workers).

---

# PART 1. THE PANEL'S AGREED DESIGN

Panel: system architect, theory-of-computation scientist, software engineer, networking engineer, cloud engineer, cybersecurity specialist, solutions architect.

## 1.1 Problem statement
Teams lose architectural knowledge in slide decks and chat threads. ArchLedger is one place that answers four questions:
1. **What exists?** Systems, components, owners, environments.
2. **How is it connected?** Dependencies, protocols, trust zones, data classes.
3. **Why is it this way?** Architecture Decision Records (ADRs) with alternatives, status lifecycle, and supersession history.
4. **What breaks if X changes?** Impact analysis, cycle and single-point-of-failure detection, and automated architecture "fitness" checks.

## 1.2 Panel positions and what each contributed

**Solutions architect.** Insisted on a small, opinionated model rather than a generic graph database: Domain → System → Component, plus Dependency, Environment/Deployment, Decision, Risk, and Quality Requirement. ADRs follow the MADR shape (context, drivers, options, outcome, consequences). C4 levels are used as a *lens* (Context, Container, Component), not as separate drawings people must maintain.

**Theory-of-computation scientist.** Pushed for formal underpinnings so the "smart" features are correct, not heuristic:
- The catalog is a directed multigraph G = (V, E) with typed nodes and edges. All analyses are standard graph algorithms with known complexity, implemented as **pure, deterministic functions** with no I/O.
- **Cycle detection** via Tarjan's strongly connected components, O(V+E). A non-trivial SCC is a dependency cycle. Cycles are *warnings* for sync edges and *allowed* for async edges (event loops are legitimate).
- **Layering** via topological sort on the condensation DAG (SCCs collapsed), giving a stable top-to-bottom layout and a "depth from edge" metric.
- **Blast radius** = reverse reachability (BFS over reversed edges) from a changed node, with hop distance. **Dependency closure** = forward reachability.
- **Single points of failure** = articulation points in the undirected projection of the production sub-graph, filtered to components with no redundancy (replicas < 2).
- **Decision lifecycle is a finite automaton.** States: `proposed`, `accepted`, `rejected`, `deprecated`, `superseded`. Allowed transitions are an explicit table, enforced server-side, so illegal states are unrepresentable. `rejected` and `superseded` are terminal. The `supersedes` relation must stay **acyclic** (checked on write via ancestor walk), forming a chain/forest.
- **Fitness rules are predicates** over (graph, attributes) returning typed findings. They are composable, side-effect-free, and unit-testable.
- Seeding is **idempotent** (upsert by stable slug) so repeated runs converge to the same state.

**Software engineer.** Insisted on a clean split between *generated* and *handwritten* code, using Flare's contract (generated code inside marked blocks; everything outside is ours). Handwritten domain logic lives in `lib/catalog/**` as pure TypeScript with Vitest coverage. UI never computes graph results; it calls those functions server-side. Strict TypeScript, Zod at every boundary, no `any`.

**Networking engineer.** Asked that connectivity be first-class data, not free text:
- **Network zones** with a trust level (`internet`, `dmz`, `internal`, `restricted`) and optional CIDR.
- Every dependency records **protocol** (`https`, `grpc`, `tcp`, `amqp`, `kafka`, `sql`, `ws`, `smtp`, `other`), **port**, **direction/style** (sync or async), and **transport security** (`tls`, `mtls`, `none`).
- A "Network lens" groups the graph by zone and highlights flows that cross trust boundaries, and flags any cross-zone flow with `none` transport security.

**Cloud engineer.** Modeled runtime reality separately from logical design:
- **Environment** (dev, staging, prod, dr) with provider (`aws`, `gcp`, `azure`, `vercel`, `neon`, `cloudflare`, `on_prem`, `other`) and region.
- **Deployment** joins Component × Environment with version, replicas, URL, and estimated monthly cost.
- Cost rollups per System/Environment, a region-residency view, and a rule that flags prod components with a single replica or no DR deployment when the system tier is critical.
- The app's own deployment is Vercel + Neon. Preview deployments per branch are used for verification.

**Cybersecurity specialist.** Two scopes:
1. *The catalog describes security*: data classification (`public`, `internal`, `confidential`, `restricted`) on components and dependencies; a lightweight **STRIDE** Risk resource per component (category, severity, mitigation, status); rules such as "restricted data over a non-mTLS edge" and "internet-facing component without a recorded authN decision."
2. *The catalog is itself secured*: roles enforced server-side by Flare policies, 2FA available (mandatory for admins), audit trail of every write and every decision transition, markdown sanitization (ADR bodies are an XSS vector), strict security headers/CSP, https-only URL fields, **a secret-scanner that rejects pasted credentials** in free-text fields, rate limiting on mutating endpoints, `pnpm audit` gate.

## 1.3 Agreed feature set

**MVP (must ship):**
1. Auth (email+password, magic link, Google/GitHub when credentials exist) via Flare/Better Auth. Roles: `admin`, `architect`, `engineer`, `viewer`.
2. Catalog CRUD (generated admin + custom polished UI): Domain, Team, System, Component, Environment, NetworkZone, Deployment, Dependency.
3. Decision log: ADRs with options, lifecycle automaton, supersession chain, links to affected components, review verdicts, MADR markdown export.
4. Risk register (STRIDE) and Quality Requirements (NFR scenarios).
5. **Graph Explorer** with lenses: Logical (C4-ish), Network (by zone), Deployment (by environment), plus filtering and node details.
6. **Impact Analysis**: pick a component, see blast radius and dependency closure with hop distance.
7. **Fitness Report**: cycles, SPOFs, orphans, security-rule findings, stale decisions, missing owners, with severity and a catalog health score.
8. Global search + command palette.
9. Dashboard: counts, health score, recent decisions, open findings, cost by environment.
10. Exports: ADR → Markdown (MADR), graph → Mermaid, catalog → JSON.
11. Audit log viewer (admin).
12. Seeded demo dataset (fictional company *Northwind Freight*) with deliberate cycle, SPOF, and insecure edge so every rule has something to find.
13. OpenAPI reference exposed (Flare generates it), linked from the UI.
14. Deployed on Vercel with Neon, CI checks, README with architecture and demo script.

**Stretch (only after MVP gates pass; each behind an env flag):**
- Billing tiers via `flare gen billing` in Stripe **test mode** (free: 25 components; pro: unlimited).
- File attachments (diagrams) if Flare's storage guide supports a Vercel-compatible adapter; otherwise URL-only attachments.
- Saved graph views, ADR templates, import from JSON.
- Public read-only share links for a System (signed, expiring).

**Explicit non-goals:** realtime co-editing, free-form drawing canvas, auto-discovery from cloud accounts, AI generation features.

## 1.4 Architecture decisions made by the panel (the project's own ADR-000 set)
| # | Decision | Reason |
|---|----------|--------|
| 000-1 | Flare `--stack next` | Real Postgres/Node, Vercel preview deploys, matches user constraint |
| 000-2 | Generated CRUD + handwritten pure-TS domain engine | Maximizes framework showcase while keeping logic testable |
| 000-3 | Graph analytics computed server-side from DB snapshot, cached by tag | Correctness and consistency; Upstash cache revalidated on write |
| 000-4 | React Flow (`@xyflow/react`) + `dagre` layout | Mature, SSR-safe enough, controllable |
| 000-5 | Decision lifecycle enforced in a write hook via transition table | Illegal states unrepresentable |
| 000-6 | Markdown rendered with sanitization (`react-markdown` + `rehype-sanitize`) | ADR text is user input |
| 000-7 | Vitest for domain logic, Playwright for E2E | Fast unit loop, real-browser verification |
| 000-8 | No realtime; optimistic refresh on navigation | Not available on Next stack |

---

# PART 2. DOMAIN MODEL (Flare resources)

Create each with `npx flare gen resource <Name> --fields "..."`, then refine the descriptor in `resources/<name>.resource.ts` and re-run the generator. **Confirm exact field-type names against the Field Grammar page in the docs** before generating (v0.9.1 added money, percent, rating, timezone, currency and more). Use the confirmed forms below as the baseline: `string`, `int`, `enum`, `radio`, `email`, `belongsTo`.

| Resource | Key fields | Relations |
|---|---|---|
| **Team** | name, slug, contactEmail (email), onCallUrl | |
| **Domain** | name, slug, description | ownerTeam → Team |
| **System** | name, slug, summary, lifecycle enum(ideation,active,deprecated,retired), tier enum(tier1,tier2,tier3), c4Level enum(context,container) | domain → Domain, ownerTeam → Team |
| **Component** | name, slug, kind enum(service,frontend,database,queue,cache,gateway,job,external,storage), techStack, repoUrl, lifecycle enum, dataClass enum(public,internal,confidential,restricted), internetFacing (boolean) | system → System, ownerTeam → Team |
| **NetworkZone** | name, trustLevel enum(internet,dmz,internal,restricted), cidr (optional) | |
| **Environment** | name, kind enum(dev,staging,prod,dr), provider enum, region | |
| **Deployment** | version, replicas int, url (https only), monthlyCost (money type if available else int cents) | component → Component, environment → Environment, zone → NetworkZone |
| **Dependency** | protocol enum, port int(optional), style enum(sync,async), transport enum(tls,mtls,none), dataClass enum, criticality enum(hard,soft), description | from → Component, to → Component |
| **Decision** | number int (auto), title, status enum(proposed,accepted,rejected,deprecated,superseded), context, drivers, outcome, consequences, decidedAt, reviewDueAt | system → System, deciderTeam → Team, supersedes → Decision (nullable) |
| **DecisionOption** | title, pros, cons, chosen (boolean) | decision → Decision |
| **DecisionComponent** | note | decision → Decision, component → Component |
| **DecisionReview** | verdict enum(approve,concerns,reject), comment | decision → Decision, reviewer (user) |
| **Risk** | stride enum(spoofing,tampering,repudiation,disclosure,dos,elevation), severity enum(low,medium,high,critical), description, mitigation, status enum(open,mitigated,accepted) | component → Component |
| **QualityRequirement** | attribute enum(availability,latency,throughput,durability,security,cost,operability), scenario, target | system → System |
| **Attachment** | title, url, kind enum(diagram,doc,runbook) | system or component (nullable) |
| **AuditEvent** | actor, action, entity, entityId, summary, createdAt | generated by `flare gen security` plus custom hook writes |

Uniqueness: slugs unique per table; Dependency unique on (from, to, protocol, port); no self-dependency (validator); Decision.number unique per System.

## Roles and policy matrix (via `npx flare gen policy`)
| Resource group | read | create | update | delete |
|---|---|---|---|---|
| Catalog (Team, Domain, System, Component, Env, Zone, Deployment, Dependency, Attachment) | all signed-in | admin, architect, engineer | admin, architect, engineer (engineer only for components their team owns, enforced in hook) | admin, architect |
| Decision, Option, DecisionComponent | all signed-in | admin, architect, engineer | admin, architect (author may edit while `proposed`) | admin |
| DecisionReview | all signed-in | admin, architect | author only | admin |
| Risk, QualityRequirement | all signed-in | admin, architect | admin, architect | admin |
| AuditEvent | admin | system only | none | none |
Admins must enrol 2FA before accessing Audit and user management.

---

# PART 3. HANDWRITTEN CODE LAYOUT (everything outside Flare's generated blocks)

```
lib/catalog/
  graph/            build.ts  scc.ts  topo.ts  reach.ts  articulation.ts  index.ts
  rules/            registry.ts  cycles.ts  spof.ts  orphans.ts  security.ts
                    network.ts  ownership.ts  staleDecisions.ts  resilience.ts
  decisions/        lifecycle.ts (transition table)  supersession.ts  madrExport.ts
  security/         secretScan.ts  sanitize.ts  headers.ts
  export/           mermaid.ts  json.ts
  health.ts         (score from findings)
  cache.ts          (tag-based cache helpers, per Flare caching guide)
app/(catalog)/      dashboard/  graph/  impact/  fitness/  decisions/  search/
components/catalog/ GraphCanvas  LensSwitcher  NodePanel  FindingList  DecisionTimeline  CommandPalette
tests/unit/         *.test.ts  (Vitest)
tests/e2e/          *.spec.ts  (Playwright)
docs/               ARCHITECTURE.md  ADR-000-*.md  DEVIATIONS.md  DEMO.md
PROGRESS.md         (agent-maintained ledger)
AGENTS.md           (this playbook's operating rules)
```

## Algorithms: required behaviour
- `buildGraph(snapshot)`: nodes = Components, edges = Dependencies; carries kind, tier, zone, env, replicas.
- `scc(graph)`: Tarjan iterative (no recursion depth issues); returns components of size > 1 or self-loops.
- `topoLayers(condensation)`: layer index per node.
- `blastRadius(graph, id, maxHops?)` / `closure(graph, id)`: BFS with hop distance, handles cycles.
- `articulationPoints(undirectedProd)`: Tarjan lowlink, iterative.
- Every function: pure, deterministic ordering (sort by id for stable output), tested with property-style cases (random DAGs vs known answers, cycles, disconnected graphs, empty graph, single node, 2k-node performance under 200 ms).

## Fitness rules (each returns `{ruleId, severity, entity, message, fixHint}`)
1. `cycle.sync`: sync-edge SCC (high). Async-only cycles are info.
2. `spof.prod`: articulation point with replicas < 2 in prod (high if tier1).
3. `orphan.component`: no inbound and no outbound edges, not `external` (low).
4. `ownership.missing`: System/Component without ownerTeam (medium).
5. `security.restricted-plaintext`: restricted/confidential data over `transport = none` (critical).
6. `security.internet-facing-no-authn-decision`: internetFacing component with no accepted Decision linked whose title/context matches auth terms (medium).
7. `network.cross-zone-no-tls`: edge crossing zones with `none` transport (high).
8. `network.zone-skip`: internet-zone component depending directly on a restricted-zone component (high).
9. `resilience.no-dr`: tier1 system with prod deployment and no dr deployment (medium).
10. `decision.stale`: accepted decision past `reviewDueAt` (low).
11. `decision.no-consequences`: accepted decision with empty consequences (medium).
12. `decision.superseded-still-linked`: components still linked to a superseded decision with no link to its successor (medium).
13. `tier.inversion`: tier1 hard-depends on a tier3 component (medium).
Health score = 100 − weighted sum of findings (critical 15, high 8, medium 3, low 1), floored at 0, shown with the top contributors.

---

# PART 4. AUTONOMOUS EXECUTION PLAYBOOK FOR ANTIGRAVITY

## 4.0 How to run this
1. Create an empty folder. Save this file as `PLAN.md` inside it.
2. Open it in Antigravity. In the Agent Manager, start one agent with the prompt in **§4.1**. Allow terminal commands to run without per-command approval for this workspace (the agent only runs project-local commands), and keep the agent in the browser-verification-enabled mode so it can check the running app.
3. Leave it. It must never wait for you. Anything it cannot do alone gets logged as `BLOCKED-HUMAN` and it moves on.

### One-time human prerequisites (do these *before* starting; otherwise the agent falls back as noted)
| Need | Fallback if missing |
|---|---|
| Node 20+ and pnpm installed | Agent installs pnpm via corepack |
| `vercel login` done on this machine | Agent builds and tests locally, marks deploy tasks `BLOCKED-HUMAN`, continues |
| A Neon database (Vercel Marketplace integration or `DATABASE_URL`) | Agent uses Flare's local dev database and marks remote migration `BLOCKED-HUMAN` |
| Optional: Resend key, Google/GitHub OAuth, Stripe test keys | Features stay off (flagged), app still fully works |

## 4.1 Kickoff prompt (paste once)
```
You are the sole engineer building "ArchLedger" end to end from PLAN.md.
Read PLAN.md fully, then create AGENTS.md from section 4.2 and PROGRESS.md.
Execute Day 1 through Day 10 in order. Never ask me questions. Resolve every
ambiguity using the Default Decisions table (4.3). Use the Flare docs at
https://flare-docs.codetotech.com/ as the source of truth for framework usage:
read the pages listed in each day's "Read first" before writing code. Stack is
Next.js on Vercel (flare --stack next). Pass each day's Gate before starting the
next day. Commit at the end of each day. Keep PROGRESS.md current. When all
days pass, produce the final walkthrough artifact and stop.
```

## 4.2 AGENTS.md (operating rules the agent writes to the repo root)
```
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
```

## 4.3 Default Decisions table (so the agent never asks)
| Question | Decision |
|---|---|
| App name / package name | `archledger` |
| Package manager | pnpm |
| Theme | `mono` (clean, serious look); switch via `flare theme mono` |
| Auth methods at create | email+password, magic links, 2FA; Google/GitHub only if env creds exist |
| First user | The first registered user becomes `admin` through the seed/bootstrap script (documented) |
| Date/time | Store UTC, display in viewer timezone |
| IDs | Whatever Flare generates; slugs for human keys |
| Graph lib | `@xyflow/react` + `dagre` |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-sanitize` |
| Icons / UI primitives | `lucide-react`; use Flare's generated components and theme tokens first, Tailwind utilities for custom UI |
| Command palette | `cmdk` |
| Tests | Vitest (unit), Playwright (E2E) |
| Cache | Flare's caching guide with the Next stack's Redis; if unavailable at runtime, fall back to no-cache without failing |
| File storage | Use Flare storage guide only if it documents a Vercel-compatible adapter; else URL-only attachments |
| Billing | Stretch only; Stripe test mode; behind `FEATURE_BILLING` |
| Missing optional env | Feature flag off, UI hides it, no crash |
| Ambiguous UI detail | Choose the simpler, accessible option; log in DEVIATIONS.md |
| Failing gate | Fix root cause; never skip, disable, or delete a test to pass |

## 4.4 Per-day loop (every day follows this exactly)
1. **Orient:** re-read PLAN.md day section + PROGRESS.md.
2. **Read first:** read the day's Flare docs pages (starting from the docs home and its sidebar to locate each guide).
3. **Plan:** write a short implementation plan artifact listing tasks in order.
4. **Build:** generators first, then handwritten code.
5. **Verify:** run the gate commands, then drive the running app with the browser tool and capture screenshots for the stated acceptance checks.
6. **Record:** update PROGRESS.md, commit, tag `day-N-done`.
7. **Proceed** to the next day without waiting.

---

## DAY 1. Foundation, auth, theme, deploy skeleton
**Read first (Flare docs):** Quickstart, Installation, Stacks (Next.js on Vercel section), Authentication guide, Themes, Migrations & seeds, CLI reference, Generated files concept.
**Tasks**
1. Scaffold: `pnpm create flare-framework archledger -- --stack next` (pick theme `default` or `mono`, enable email+password, magic links, email codes, passkeys, 2FA; social only if creds exist). Pin Flare versions.
2. `flare dev` runs locally; verify home, sign-in, account pages.
3. Add tooling: Vitest, Playwright, ESLint/Prettier config, `pnpm typecheck|lint|test|e2e` scripts, `env.ts` central validation, GitHub Actions CI running the gate.
4. Apply `flare theme mono`; add app shell (sidebar: Dashboard, Catalog, Graph, Impact, Decisions, Fitness, Search; header with command palette placeholder).
5. Write `docs/ARCHITECTURE.md` skeleton and the ADR-000 set from §1.4 as markdown files (they'll later be seeded as real Decisions too).
6. Deploy skeleton: if Vercel/Neon prerequisites exist, run `npx flare deploy` (or Vercel CLI path it wraps), set env vars, confirm the live URL signs a user up. Else mark `BLOCKED-HUMAN`.
**Gate:** local app boots; sign-up and sign-in work in browser; `pnpm typecheck && lint && test && build` green; CI file present; PROGRESS.md and AGENTS.md exist; deploy either verified or logged.

## DAY 2. Org structure + Systems + Components
**Read first:** Field Grammar (all field types, relationships), Resources/Generated files, Dashboard guide, Roles & policies.
**Tasks**
1. Generate **Team, Domain, System, Component** per §2 using `npx flare gen resource`. Use real enums and `belongsTo`.
2. Refine descriptors (required flags, formats, min/max, help text), regenerate, confirm migrations are readable and applied.
3. Add validators outside generated blocks for: unique slug, https-only `repoUrl`, secret-scan on free text (`lib/catalog/security/secretScan.ts` with tests: AWS key shapes, private key headers, `password=`/`token=` patterns, high-entropy long strings).
4. Custom UI under `app/(catalog)/catalog/`: System list with filters (tier, lifecycle, domain, team), System detail page (summary, components table, linked decisions placeholder), Component detail page (properties, deps placeholders).
5. Unit tests for validators/secretScan.
**Gate:** create a Team, Domain, System, Component through the admin UI and the custom UI; slug uniqueness enforced; secret-like text rejected with a clear message; tests green.

## DAY 3. Connectivity + runtime model
**Read first:** Field Grammar (money, rating, etc.), Relationships documentation, Migrations & seeds, API reference (OpenAPI) guide.
**Tasks**
1. Generate **NetworkZone, Environment, Deployment, Dependency**.
2. Validators: no self-dependency; unique (from,to,protocol,port); port range 1–65535; deployment URL https-only; replicas ≥ 0.
3. Component detail page: inbound/outbound dependency tables, deployments table, zone chips.
4. Dependency editor UX: choose from/to via searchable select, protocol/transport/style fields, inline warning when transport = none and dataClass is confidential/restricted (preview of the future rule).
5. Cost rollup helper (`lib/catalog/cost.ts`) summing deployment monthly cost by System/Environment, with tests.
**Gate:** can model a 5-component system with dependencies across two zones and two environments; validators block bad input; cost rollup test passes; OpenAPI reference reachable and shows the new resources for an admin.

## DAY 4. Decision log + lifecycle automaton
**Read first:** Hooks documentation (Flare hooks/lifecycle), Roles & policies, Generated files concept.
**Tasks**
1. Generate **Decision, DecisionOption, DecisionComponent, DecisionReview**.
2. `lib/catalog/decisions/lifecycle.ts`: transition table: proposed→accepted|rejected; accepted→deprecated|superseded; deprecated→superseded; rejected and superseded terminal. Pure function `canTransition(from,to)` plus `explain(from,to)`.
3. Server-side enforcement via Flare hook on update: reject illegal transitions with a clear error; set `decidedAt` on acceptance; require ≥1 option and non-empty consequences to accept.
4. `supersession.ts`: creating a decision with `supersedes` atomically marks the old one `superseded`, and rejects cycles (ancestor walk). Per-System auto-incrementing `number`.
5. UI: Decision list (filters by status/system/component/team), detail page with markdown (sanitized), options comparison table (chosen highlighted), review panel, **timeline** showing the supersession chain, status action buttons showing only legal next states.
6. `madrExport.ts`: produce a MADR-format markdown string; download button.
7. Tests: exhaustive 5×5 transition matrix; supersession cycle rejection; MADR snapshot; sanitize test with `<script>`, `javascript:` links, `onerror` attributes.
**Gate:** in the browser, walk a decision proposed→accepted→superseded by a new decision; illegal clicks are impossible and illegal API calls return 4xx; markdown XSS payload renders inert; export downloads valid markdown.

## DAY 5. Roles, policies, audit, hardening
**Read first:** Roles & policies, Security generator (`flare gen security`), Auth guide (2FA, sessions), Mail guide.
**Tasks**
1. Apply the policy matrix from §2 with `npx flare gen policy <Resource> --roles ... --delete-roles ...` per resource group.
2. Run `npx flare gen security`; review `security.config.ts`, the admin security page, and the security-event resource; enable rate limiting and lockout settings it offers.
3. Team-scoped engineer edit rule via hook: engineers may update Components only if their team owns them (map user→team via a `TeamMember` link or user attribute; choose the simplest Flare-supported approach and document it).
4. Audit: write `AuditEvent` rows from hooks for all create/update/delete and every decision transition (actor, action, entity, summary). Admin-only Audit viewer with filters.
5. Require 2FA for admin role (middleware check + banner). 
6. Headers: strict CSP (allow only needed sources), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame-ancestors none, HSTS on production. Place in `next.config` / middleware per Next 16 conventions.
7. Run `pnpm audit`; fix or document each high/critical finding.
8. Tests: policy matrix tests that call the API as each role for each group (allowed and forbidden); audit-row emission tests.
**Gate:** a table of role × resource × action results (auto-generated by the test run) matches §2 exactly; viewer cannot mutate via UI *or* direct API; audit shows entries; headers verified with a request test; `pnpm audit` has no unaddressed high/critical.

## DAY 6. Graph engine + fitness rules (pure logic)
**Read first:** Caching guide (tag-based cache + revalidate on write), Queries section of the docs (`getDb()` usage), Generated clients.
**Tasks**
1. Implement everything in "Algorithms" and "Fitness rules" (Part 3) under `lib/catalog/graph` and `lib/catalog/rules` with a rule registry that a runner executes over a snapshot.
2. `snapshot.ts`: loads catalog data with Prisma (via Flare's DB helper) in as few queries as possible; returns a plain serializable `CatalogSnapshot`.
3. `health.ts` score + top contributors.
4. Cached server functions `getFindings()`, `getGraph()`, `getImpact(id)` using tag-based caching revalidated by writes to relevant resources.
5. Tests: ≥ 60 unit tests. Include: SCC on known graphs, topological layering, blast radius with cycles, articulation points on path/star/bridge graphs, each rule with a minimal positive and negative fixture, 2,000-node/6,000-edge performance test (< 200 ms for SCC+topo), determinism test (shuffle input → identical output).
**Gate:** `pnpm test` shows all engine tests green with coverage ≥ 90% on `lib/catalog/graph` and `lib/catalog/rules`; no I/O inside those folders (add an ESLint `no-restricted-imports` rule enforcing it).

## DAY 7. Visualization: Graph Explorer, Impact, Fitness UI
**Read first:** Dashboard guide (to stay consistent with Flare's UI patterns), Themes (tokens).
**Tasks**
1. `GraphCanvas` using `@xyflow/react` + `dagre`: node cards by kind (icon, tier badge, owner), edge styling by style (solid sync, dashed async), color by transport (red = none), minimap, zoom, fit view, keyboard accessible.
2. **Lenses** via `LensSwitcher`: *Logical* (grouped by System), *Network* (grouped by zone, boundary-crossing edges emphasized), *Deployment* (choose environment; show replicas/regions).
3. Filters: system, domain, kind, tier, data class, environment; URL-synced state so views are shareable.
4. `NodePanel`: properties, inbound/outbound lists, linked decisions, risks, findings for that node, "Analyze impact" button.
5. **Impact page**: pick a component → blast radius and closure rendered as highlighted subgraph with hop-distance rings and a table; export Mermaid of the subgraph.
6. **Fitness page**: findings grouped by severity/rule/system, each with fix hint and deep link to the entity; health score gauge and trend (store daily snapshot score in a small `HealthSnapshot` resource via cron-free approach: write on first load per day).
7. Large-graph safety: if nodes > 300, auto-collapse to System-level and offer drill-in.
8. `mermaid.ts` + `json.ts` exports with tests.
**Gate:** with the Day-3-style sample data, all three lenses render; clicking a node opens the panel; impact highlights the correct set (compare against the unit-tested function for 3 nodes); Mermaid export parses (validate with the `mermaid` parser in a test); keyboard-only navigation reaches nodes and panel; no console errors.

## DAY 8. Product surface: dashboard, search, onboarding, polish
**Read first:** Dashboard guide (stats/import/export), CLI reference (`flare gen` options), Mail guide.
**Tasks**
1. Dashboard: totals (systems, components, decisions by status), health score, top 5 findings, recent decisions, cost by environment chart, "decisions due for review".
2. Global search: use Postgres full-text if Flare's Next stack docs show ranked search support, otherwise `ILIKE` with trigram index via a migration; search across Systems, Components, Decisions, Risks; grouped results. 
3. `CommandPalette` (`cmdk`, Ctrl/⌘K): navigate, search, "New decision", "New component", "Analyze impact of…".
4. Risk and QualityRequirement pages with STRIDE grid per component and NFR list per system; link NFRs to decisions in the Decision detail UI.
5. Empty states, loading skeletons, error boundaries, toasts, responsive layout down to tablet, dark/light parity through Flare theme tokens, accessible labels and focus rings.
6. Email: decision review request and status-change notifications via Resend when `RESEND_API_KEY` exists (otherwise log and skip).
7. Import/export screens: catalog JSON export (admin), JSON import with Zod validation and dry-run preview (stretch if time).
**Gate:** every nav item loads without errors for each role; palette opens and navigates; search finds seeded entities in < 500 ms locally; axe-core check on 5 key pages reports no serious/critical violations.

## DAY 9. Demo dataset, E2E, performance, optional stretch
**Read first:** Migrations & seeds, Sharing local app (tunnels) guide, Billing guide (only if doing stretch).
**Tasks**
1. Idempotent seed (Flare seeds mechanism) for **Northwind Freight**: 4 domains, 6 teams, 8 systems, ~45 components, ~80 dependencies, 4 zones, 4 environments, ~55 deployments, ~16 decisions including one 3-link supersession chain and one stale accepted decision, ~20 risks, ~15 NFRs. Plant: one sync cycle (order ↔ inventory ↔ pricing), one SPOF (single-replica prod gateway), one `restricted` over `none` edge, one internet→restricted zone skip, one tier-1 → tier-3 dependency. Create demo users per role (documented credentials for local/demo only; disabled in production unless `ALLOW_DEMO_USERS=true`).
2. Playwright E2E suite (≥ 12 tests): sign-in per role; create system→component→dependency; decision lifecycle happy path and illegal path; viewer is read-only; graph lens switch; impact analysis result; fitness finds all 5 planted issues; search; export downloads; 2FA-required banner for admin.
3. Performance pass: Lighthouse on dashboard and graph (target ≥ 85 perf, ≥ 95 accessibility/best-practices locally), fix N+1 queries, add indexes via migrations for FK and slug columns, verify cache revalidation on write.
4. **Stretch A (only if all prior gates green):** `npx flare gen billing --provider stripe --mode subscriptions` in test mode behind `FEATURE_BILLING`; free tier limited to 25 components enforced in a policy/hook; billing page. **Stretch B:** attachments through Flare storage if compatible, else URL-only.
5. `flare dev --tunnel` check: confirm the demo is reachable over the tunnel (if the command works in the environment; otherwise log).
**Gate:** `pnpm e2e` green; fitness report on seed data lists exactly the planted issues (assert in test); Lighthouse numbers recorded in PROGRESS.md; seed re-run produces no duplicates.

## DAY 10. Production release, docs, final audit
**Read first:** Deploy guide / `flare deploy` reference, Stacks (Vercel specifics), API reference (OpenAPI).
**Tasks**
1. Production env: set `BETTER_AUTH_SECRET` (generated by deploy flow), `DATABASE_URL`, optional Resend/OAuth/Stripe; ensure function region is close to the Neon region.
2. `npx flare deploy` (migrates DB first, then deploys). Seed the demo tenant if `ALLOW_DEMO_USERS=true` is intentionally set; otherwise bootstrap only the first admin.
3. Post-deploy smoke test script (Playwright against the live URL): sign-in, view dashboard, open graph, run fitness.
4. Final security pass: re-run `pnpm audit`, headers check on the live URL, confirm no secrets in repo history (run a secret scan), confirm policies via role-matrix test against production API (read-only calls only).
5. Docs: `README.md` (what it is, screenshots, stack, run/deploy, env vars table, role matrix), `docs/ARCHITECTURE.md` (diagrams as Mermaid: context, container, graph engine flow, decision automaton), `docs/DEMO.md` (a 6-minute click-by-click demo script highlighting where Flare generated vs where we wrote code), `docs/DEVIATIONS.md` finalized, ADR-000 files finalized and also present as seeded Decisions.
6. "Framework showcase" page in-app (`/about`) listing which parts are Flare-generated (resources, API, validation, admin, auth, policies, security, OpenAPI, deploy) vs handwritten (graph engine, rules, UI), with real counts computed from the repo's generated-block markers if feasible.
7. Final Antigravity artifacts: walkthrough with screenshots and a summary of PROGRESS.md; tag `v1.0.0`.
**Gate (release criteria):** live URL passes smoke test; all gates from Days 1–9 re-verified in one run (`pnpm typecheck && lint && test && e2e && build`); PROGRESS.md shows every task done or explicitly `BLOCKED-HUMAN` with unblock steps; README demo works for a stranger.

---

# PART 5. RISK REGISTER AND AUTOMATIC FALLBACKS

| Risk | Likelihood | Mitigation the agent applies without asking |
|---|---|---|
| Flare is 0.9.x; APIs may shift | Medium | Pin versions; read docs each day; log deviations; prefer generators over manual patches |
| A field type or option in this plan isn't in the docs | Medium | Use the nearest documented type (e.g., `int` cents for money); note in DEVIATIONS.md |
| Generated block drift on regenerate | Medium | Keep all custom code outside markers; never hand-edit inside; re-run generator after descriptor edits |
| Storage/Redis adapter unavailable on Vercel | Medium | URL-only attachments; no-cache fallback; features degrade, never crash |
| Graph UI slow for big graphs | Low | System-level collapse above 300 nodes; memoized layout; server-computed analytics |
| Markdown/XSS or secret leakage in free text | Medium | Sanitizer + secret scanner + CSP, with explicit tests |
| Account-bound steps (Vercel login, Neon) not done | High | `BLOCKED-HUMAN` log, continue locally, produce a one-page "unblock" checklist in PROGRESS.md |
| Scope creep | Medium | Stretch items only after the Day 9 gate; MVP list in §1.3 is the contract |

---

# PART 6. PROGRESS.md TEMPLATE (agent creates and maintains)
```
# Progress
| Day | Status | Gate evidence | Commit/Tag |
|-----|--------|---------------|------------|
| 1 | todo | | |
...
## Task log
- [Day N] <task> : done|blocked|skipped : <evidence path or command output summary>
## BLOCKED-HUMAN
- <item> : <exact steps for the human>
## Deviations
- see docs/DEVIATIONS.md
```

# DEFINITION OF DONE
All 14 MVP items in §1.3 work in the deployed app; the planted issues are detected; role matrix verified; unit and E2E suites green; docs and demo script complete; every Flare-generated artifact is regenerable without losing handwritten code.
