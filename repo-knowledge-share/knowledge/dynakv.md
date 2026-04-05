---
name: dynakv
repo: Derek-X-Wang/DynaKV
description: Durable serverless KV store with Redis ergonomics, DynamoDB data plane, Convex control plane
last_scanned: 2026-04-05
---

## Tech Stack
- **Runtime:** Bun 1.3
- **Frontend:** TanStack Start (React 19, Vite 8), TailwindCSS 4, shadcn/ui, TanStack Query
- **Backend:** Convex (serverless) via kitcn 0.12 (cRPC + ORM + Better Auth)
- **Auth:** Better Auth with email/password via kitcn native auth
- **Database:** Convex real-time document database (metadata) + AWS DynamoDB (KV data plane)
- **Infrastructure:** SST v3 (DynamoDB table + IAM)
- **Monorepo:** Bun workspaces + Turborepo
- **Linting:** oxlint, lint-staged
- **SDK:** TypeScript (tsup), Python (setuptools), CLI (Commander.js)

## Features

### Email/Password Authentication with Better Auth
Better Auth handles developer login with email/password. Auth config uses `defineAuth()` with convex plugin from `kitcn/auth`. Auth API routes use TanStack Start middleware on the splat route. Client uses `ConvexAuthProvider` from `kitcn/auth/client` with `authClient.useSession()` for auth-gated UI.
- Key file: `packages/backend/convex/functions/auth.ts`
- Key file: `packages/backend/convex/functions/http.ts`
- Key file: `apps/web/src/lib/convex-provider.tsx`

### API Key Management
Developers create API keys (`sk_live_<hex>`) per project. Keys stored as SHA-256 hashes with a visible prefix for UI display. Generation via `authMutation`, listing via `authQuery`, revocation via `authMutation`, verification via `publicQuery` (no session auth — used by KV HTTP API).
- Key file: `packages/backend/convex/functions/apikeys.ts`

### KV HTTP API (cRPC Routes with Zod I/O)
Six endpoints: set, get, delete, incr, list, scan. Built as `publicRoute` cRPC procedures with typed Zod schemas — `.input()` for POST routes, `.searchParams()` for GET routes (kitcn requirement: `.input()` is only parsed for non-GET methods). API-key auth handled by Hono app middleware on `/v1/*` using `createApikeysCaller(c.env)` — NOT via cRPC `.use()` middleware (kitcn HTTP middleware can't access request headers). Each handler reads `projectId` from Hono context via `c.get('projectId')`.
- Key file: `packages/backend/convex/functions/kv.ts`
- Key file: `packages/backend/convex/functions/http.ts`

### DynamoDB Single Table Design
PK: `proj_<projectId>:<namespace>` for tenant isolation. SK: `<key>`. Native TTL via epoch timestamp on `ttl` attribute. Atomic counters via UpdateCommand with `if_not_exists`. List/scan with cursor pagination (base64-encoded `ExclusiveStartKey`).
- Key file: `packages/backend/convex/lib/dynamo.ts`

### cRPC Type-Safe API Layer
kitcn cRPC provides typed procedure builders (publicQuery, authMutation, etc.) with `createMiddlewareFactory<GenericCtx, Meta>()` for type-safe middleware. `withAuth`/`withOptionalAuth` middleware inject `ctx.user`/`ctx.userId`. Frontend consumes via `useCRPC()` hook + TanStack Query (`crpc.<module>.<proc>.queryOptions()`). Real-time queries by default (subscribed).
- Key file: `packages/backend/convex/lib/crpc.ts`
- Key file: `apps/web/src/lib/crpc.tsx`

### Project Dashboard
Web dashboard for creating projects, generating/revoking API keys, viewing key prefixes. Uses `useCRPC()` + TanStack Query for all data fetching. Auth-gated via `authClient.useSession()`.
- Key file: `apps/web/src/routes/dashboard.tsx`
- Key file: `apps/web/src/routes/dashboard/$projectId.tsx`

### TypeScript SDK
`DynaKV` class with auto-retry (exponential backoff), typed methods for all KV operations. Built with tsup (CJS + ESM + DTS).
- Key file: `packages/sdk-ts/src/index.ts`

### CLI Tool
`dynakv kv get/set/del/list` commands using Commander.js, backed by sdk-ts.
- Key file: `packages/cli/src/index.ts`

### kitcn Migration (from better-convex)
Migrated from better-convex 0.10.3 to kitcn 0.12.5 in April 2026. Key changes beyond package rename: chained `defineSchema().relations()` (not standalone `defineRelations`), `createMiddlewareFactory` for typed middleware, `create<Module>Handler`/`Caller` for inter-procedure calls (not `ctx.runQuery`), Zod 4, `ConvexAuthProvider` from `kitcn/auth/client` (not `ConvexBetterAuthProvider`), `useCRPC()` hook + TanStack Query (not raw `convex/react` hooks). KV endpoints converted from raw `httpAction` to cRPC `publicRoute` with Zod I/O. API-key auth moved to Hono app middleware. Codex code review caught 5 issues including GET routes needing `.searchParams()` not `.input()`.
- Spec: `docs/superpowers/specs/2026-04-05-kitcn-migration-design.md`
- Plan: `docs/superpowers/plans/2026-04-05-kitcn-migration.md`
