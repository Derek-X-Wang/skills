---
name: rxweave-cloud
repo: Derek-X-Wang/rxweave-cloud
description: SaaS companion to rxweave — hosted sync backend + dashboard; implements @rxweave/protocol on Convex with Better Auth + API keys
last_scanned: 2026-04-19
---

## Tech Stack
- **Runtime:** Bun 1.3+
- **Frontend:** TanStack Start + React 19 + TailwindCSS 4 + shadcn/ui (dashboard at port 5201)
- **Backend:** Convex via kitcn 0.12 (cRPC + ORM + Better Auth)
- **Auth:** Better Auth (email/password sessions for humans) + API keys `rxk_<64hex>` (SHA-256-hashed, 12-char public prefix) for machines
- **Database:** Convex — `events` (indexed on `[tenantId, eventId]`, `[tenantId, type, eventId]`, `[tenantId, actor, eventId]`, `[tenantId, timestamp]`), `registry`, `apiKeys`
- **Hono:** mounts `@effect/rpc` handler at `/rxweave/rpc` (trailing slash tolerated) alongside kitcn's cRPC router
- **Monorepo:** Bun workspaces + Turborepo
- **Shared contracts:** consumes `@rxweave/protocol` + `@rxweave/schema` from the rxweave repo via workspace-path deps

## Features

### RxWeave RPC Handler
Implements `RxWeaveRpc` from `@rxweave/protocol` at `/rxweave/rpc/*`. Supports `Append` (with client-registryDigest check → `AppendWireError.registryOutOfDate` if stale), `Subscribe` (polling loop via `Stream.paginateEffect` — doesn't terminate on empty page, waits 1s and polls again so live subscribers can't silently stall), `GetById`, `Query`, `QueryAfter` (dedicated index-scoped cursor-paged query), `RegistrySyncDiff` (digest-delta negotiation), `RegistryPush`.
- Key file: `packages/backend/convex/rxweaveRpc.ts`
- Key file: `packages/backend/convex/http.ts` (Hono mount + auth middleware)
- Key file: `packages/backend/convex/lib/storeServer.ts` (Convex-backed EventStore service — implements `queryAfter` with `.eq("tenantId", X).gt("eventId", cursor)` on the compound index)
- Key file: `packages/backend/convex/rxweave.ts` (internal `queryEventsAfter` mutation)

### Tenant Resolution (Bearer Auth)
Hono middleware on `/rxweave/rpc/*` extracts `Authorization: Bearer <token>` and resolves to either a Better Auth session (`userId = tenantId`) or an API key row (`rxk_` prefix → `apikeys.verify` internal query → `tenantId` from the row). Unknown tokens 401. Resolved tenant flows into the RPC handler via an Effect `Context.Tag` so every handler is tenant-scoped by construction.
- Key file: `packages/backend/convex/lib/tenancy.ts`
- Key file: `packages/backend/convex/lib/effectContext.ts` (Tenant Context.Tag)

### API Key Management
`rxk_<64hex>` format, SHA-256-hashed with a 12-char public prefix. `createApiKey(name)` / `revokeApiKey(id)` / `listApiKeys()` cRPC procedures on `authMutation`/`authQuery` (tenant-scoped). Internal `verify(prefix, token)` query used by the bearer-auth middleware. Pattern borrowed directly from DynaKV.
- Key file: `packages/backend/convex/apikeys.ts`

### Dashboard — Events + Lineage + Agents + API Keys
TanStack Start app on port 5201. Four main routes:
- `/dashboard` — paginated events list (cRPC `rxweave.listEvents` with cursor-based pagination over the `by_tenant_id` index + type/actor filters from URL params)
- `/dashboard/$eventId` — event inspect with depth-3 ancestor/descendant lineage tree (`LineageGraph` component renders dangling-ancestor rows as `⚠ <id>` when cloud hasn't synced a referenced event yet)
- `/dashboard/agents` — projection over `system.agent.heartbeat` events sourced from `event.actor` (the payload.agentId duplicate was dropped in v0.2.1)
- `/dashboard/api-keys` — create/revoke keys; full token shown once at creation
- Key file: `apps/web/src/routes/dashboard/`
- Key file: `apps/web/src/components/LineageGraph.tsx`

### Registry Mirror
Cloud mirrors the client-registered event types via `RegistryPush`. Every `Append` carries the client's `registryDigest`; on divergence the server responds `AppendError.RegistryOutOfDate { missingTypes }` and the client auto-pushes + retries once. No authoritative registry source — clients own their own types, cloud just stores what flows through `RegistryPush` for the dashboard's schema inspection panel.
- Key file: `packages/backend/convex/lib/registry.ts`
- Key file: `packages/backend/convex/rxweaveRpc.ts` (RegistrySyncDiff / RegistryPush handlers)

### Integration Test Tenant Reset
`/rxweave/test/reset` HTTP endpoint + `wipeTenantEvents` internal mutation (OCC-friendly batches of 100 rows per call; returns `{deleted, hasMore}` for client-loop drain). Used exclusively by `@rxweave/store-cloud/test/integration.test.ts`'s `resetBetweenTests` hook so the shared conformance suite can run deterministically against a persistent remote tenant without case-to-case pollution.
- Key file: `packages/backend/convex/rxweaveRpc.ts` (reset endpoint)
- Key file: `packages/backend/convex/rxweave.ts` (`wipeTenantEvents`)

### Smoke Test
`scripts/smoke-test.sh` — curl-based end-to-end probe that sends a single `Append` via NDJSON framing (load-bearing `\n` terminator; no trailing newline = 200 empty body) and checks for either `Success` or a `RegistryOutOfDate` `AppendWireError` (both count as "plumbing works"). Independent of the `@rxweave/store-cloud` client — useful for CI smoke and live debugging.
- Key file: `scripts/smoke-test.sh`

## Design Notes
- **No true server-side streaming.** Convex doesn't provide a streaming RPC primitive; `Subscribe` is a polling loop that preserves the `@effect/rpc stream: true` contract on the wire by never terminating on empty pages.
- **Tenant-scoped by construction.** Every Convex index starts with `tenantId`; no query can bypass tenancy even if the handler code forgets to filter.
- **ULIDs are the cursor primitive.** Client-generated, server stores as-is. Lex-sorted within a tenant; pagination uses `.gt("eventId", cursor)` for strict exclusive semantics.
- **Codegen files are committed.** `_generated/api.d.ts`, `_generated/dataModel.d.ts`, and TanStack's `routeTree.gen.ts` go into git so schema diffs are visible and builds are reproducible.

## Reference Projects
- `dynakv` — closest stack precedent (kitcn + Convex + Hono + TanStack Start + Better Auth + API keys). cRPC patterns, API key format, auth-middleware plumbing all borrowed.
