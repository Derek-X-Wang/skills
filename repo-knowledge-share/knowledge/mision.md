---
name: mision
repo: Derek-X-Wang/Mision
description: AI coding agent analytics platform — terminal recording + AI proficiency scoring
last_scanned: 2026-04-05
---

## Tech Stack
- **Runtime:** Bun 1.3
- **Frontend:** Next.js 14 (App Router), TailwindCSS, shadcn/ui
- **Backend:** Convex (serverless) via kitcn 0.12 (cRPC + ORM + Better Auth) — migrated from better-convex 2026-04-04
- **Auth:** Better Auth with email/password + GitHub OAuth, admin plugin for RBAC
- **Database:** Convex real-time document database (kitcn ORM with `convexTable`, `defineSchema().relations()`)
- **Legacy Backend:** SST v2 + DynamoDB (ElectroDB ORM, Lambda functions, tRPC + GraphQL)
- **Monorepo:** Bun workspaces
- **Testing:** Vitest, convex-test
- **Internal CLI:** dx (Commander-based developer CLI)

## Features

### Email/Password + GitHub Authentication
Better Auth handles email/password and GitHub OAuth. Admin plugin manages user.role field. JWKS-based token verification with kitcn auth config provider. Triggers auto-assign admin role based on ADMIN env var email list.
- Key file: `packages/backend/convex/functions/auth.ts`
- Key file: `packages/backend/convex/functions/auth.config.ts`
- Key file: `packages/backend/convex/functions/http.ts`

### cRPC Type-Safe API Layer
kitcn cRPC provides typed procedure builders (publicQuery, authMutation, adminMutation, optionalAuthQuery, etc.) with Zod input validation. Auth middleware chains using Object.assign for context preservation. HTTP routes via Hono with CORS and auth middleware.
- Key file: `packages/backend/convex/lib/crpc.ts`
- Key file: `packages/backend/convex/functions/http.ts`

### CLI Session Recording + Command Tracking
Terminal sessions tracked with agent type (claude-code, open-code), platform, git context, and metrics. Individual commands tracked with LLM token usage, cost, quality scores. Privacy-aware with consent tracking.
- Key file: `packages/backend/convex/functions/analytics.ts`
- Key file: `packages/backend/convex/functions/terminal.ts`

### AI Capability Scoring
Scoring algorithm calculates prompt engineering, tool proficiency, problem solving, error handling, and efficiency scores (0-100 each). Assessment snapshots stored with period-based grouping and percentile benchmarking.
- Key file: `packages/backend/convex/functions/scoring.ts`
- Key file: `packages/backend/convex/functions/schema.ts` (assessment table)

### CLI OAuth Device Flow
CLI device authentication with token polling and browser confirmation. Generates API keys (mk_/msk_ prefix format) on token exchange. Supports token revocation and device listing.
- Key file: `packages/backend/convex/functions/cliAuth.ts`
- Key file: `packages/backend/convex/lib/crypto-helpers.ts`

### Budget System (Recruiter-Allocated)
Budget allocation from recruiters to candidates with daily/weekly/monthly limits. Real-time budget validation before API requests. Cost configuration with model pricing. Credit transaction audit trail. Note: this is from the hiring platform era and may be redesigned for the terminal app pivot.
- Key file: `packages/backend/convex/functions/budget.ts`
- Key file: `packages/backend/convex/functions/budgetEnforcement.ts`
- Key file: `packages/backend/convex/functions/costConfig.ts`

### Internal Developer CLI (dx)
Commander-based CLI wrapping common workflows: dev servers, tests, codegen, deployment, database operations. Thin wrappers delegating to existing tools (bun run, kitcn, sst).
- Key file: `apps/dx/src/index.ts`
- Key file: `.claude/skills/dx/SKILL.md`

### kitcn Migration (from better-convex)
Migrated from better-convex 0.10 to kitcn 0.12 in April 2026. Schema refactored from standalone defineRelations() to chained defineSchema().relations(). CLI commands changed (kitcn dev, kitcn codegen). test.setup.ts moved out of convex/functions/ due to kitcn parser limitation with import.meta.glob.
- Key file: `packages/backend/convex/functions/schema.ts`
- Key file: `packages/backend/package.json`
