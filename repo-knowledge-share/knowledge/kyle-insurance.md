---
name: kyle-insurance
repo: Derek-X-Wang/kyle-insurance
description: Insurance agent management platform with multi-level hierarchy, commission tracking, and agent portal
last_scanned: 2026-04-04
---

## Tech Stack
- **Runtime:** Bun 1.3
- **Frontend:** TanStack Start (React 19, Vite 8), TailwindCSS 4, shadcn/ui, TanStack Query
- **Backend:** Convex (serverless) via kitcn 0.12 (cRPC + ORM + Better Auth) — migrated from better-convex
- **Auth:** Better Auth with email/password, admin plugin for RBAC
- **Database:** Convex real-time document database (kitcn ORM with `convexTable`, `defineSchema().relations()`)
- **AI:** OpenRouter via @convex-dev/agent (insurance chatbot with streaming)
- **i18n:** use-intl with English and Chinese locales, TanStack Router `{-$locale}` optional params — all portal + admin pages translated
- **Monorepo:** Bun workspaces + Turborepo
- **Linting:** oxlint, Prettier, husky + lint-staged
- **Testing:** Vitest, convex-test

## Features

### Email/Password Authentication with Better Auth
Better Auth handles email/password login with Convex plugin. Admin plugin manages `user.role` field ('admin'|'user'). Auth API routes use TanStack Start middleware (not handlers) on the splat route because TanStack Start SSR redirects splat handler routes. Email verification opt-in via `REQUIRE_EMAIL_VERIFICATION` env var (defaults to false for dev).
- Key file: `packages/backend/convex/functions/auth.ts`
- Key file: `packages/backend/convex/functions/auth.config.ts`
- Key file: `packages/backend/convex/functions/http.ts`
- Key file: `apps/web/src/routes/api/auth/$.ts`

### Role-Based Access Control (Admin + Agent)
Admin role stored on `user.role` via Better Auth admin plugin. `requireAdmin` guard checks role in `beforeLoad`. `requireAuth` guard for general authentication. `useAuthGuard()` hook as client-side fallback (uses `useEffect` for redirect, not render-time side effect). SSR skips auth since cookies unavailable. Admin can also be an agent (dual-role with cross-navigation links).
- Key file: `apps/web/src/lib/convex/auth/require-auth.ts`
- Key file: `packages/backend/convex/lib/crpc.ts`

### Multi-Level Agent Hierarchy (6 Ranks)
Agents organized in TA → A → SA → MD → SMD → EMD hierarchy (55%-80% commission). Each agent has upline/downline relationships (self-referencing `uplineAgentId`). Recursive downline tree queries up to depth 5/10. Commission overrides cascade through the hierarchy. Deactivation requires user confirmation dialog.
- Key file: `packages/backend/convex/functions/agents.ts`
- Key file: `packages/backend/convex/functions/schema.ts`

### Multi-Level Commission Engine
Automatic commission calculation at policy submission. Direct commissions from agent's split percentage + rank. Override commissions cascade through upline hierarchy. Denormalized commission records for fast querying. Period-based grouping (YYYY-MM). Split percentage validation uses tolerance-based comparison (0.001 epsilon) to handle floating-point precision.
- Key file: `packages/backend/convex/lib/commission.ts`
- Key file: `packages/backend/convex/lib/policy-logic.ts`
- Key file: `packages/backend/convex/functions/commissions.ts`
- Key file: `packages/backend/convex/functions/policies.ts`

### Insurance Case Submission (Multi-Carrier)
Submit policies with carrier & product selection, multi-agent splits. Track status: pending → inforce/declined/lapsed. Adjusted TP calculated from carrier ratio. Automatic commission cascade on submission.
- Key file: `packages/backend/convex/functions/policies.ts`
- Key file: `apps/web/src/routes/admin/cases/new.tsx`

### Agent Portal with Dashboard
Authenticated agent view with 10 sections: dashboard (metrics), team hierarchy, policies, commissions, TP report, compensation plan, resources, calculator, AI chat, profile. Dashboard uses BFS traversal of downline for aggregate metrics. All pages fully translated (EN/ZH).
- Key file: `apps/web/src/routes/_portal.tsx`
- Key file: `apps/web/src/routes/_portal/dashboard.tsx`

### Admin Panel (CRUD Management)
Back-office for managing agents, carriers, cases, resources. Path-based routing (`/admin/*`). Collapsible sidebar. Cross-navigation to agent portal if admin has an agent profile. All pages fully translated (EN/ZH).
- Key file: `apps/web/src/routes/admin.tsx`
- Key file: `apps/web/src/routes/admin/dashboard.tsx`

### Internationalization (English + Chinese)
use-intl with `packages/i18n` shared package. TanStack Router `{-$locale}` optional path params (no prefix for English, `/zh` for Chinese). Cookie-based locale persistence. Authenticated routes read locale from cookie (no URL prefix) — locale switcher reloads page on auth routes instead of prefixing URL. `/en/*` redirects to `/*` with 301. ~350 translated strings across 11 namespaces covering all portal and admin pages. ICU message format for plurals and interpolation.
- Key file: `packages/i18n/src/shared.ts`
- Key file: `packages/i18n/src/messages/en.ts`
- Key file: `packages/i18n/src/messages/zh.ts`
- Key file: `apps/web/src/routes/{-$locale}.tsx`
- Key file: `apps/web/src/components/locale-switcher.tsx`

### AI Insurance Chatbot
Streaming chat via @convex-dev/agent with OpenRouter. `startThread` is a cRPC `optionalAuthMutation`, `sendMessage` is a cRPC `optionalAuthAction` with direct `Ratelimit` class usage (middleware doesn't apply to actions). `listMessages` stays as raw Convex `query()` because `useUIMessages` from `@convex-dev/agent/react` requires raw Convex query references for streaming/pagination. Persistent threads in localStorage. Floating widget on all portal pages. Thread-level auth is architecturally limited (component tables can't be queried from app code). Client-side `useRatelimit()` hook provides disabled button + countdown UX when rate limited.
- Key file: `packages/backend/convex/functions/chat.ts`
- Key file: `packages/backend/convex/functions/chatAction.ts`
- Key file: `apps/web/src/components/chat-widget.tsx`
- Key file: `apps/web/src/routes/_portal/chat.tsx`

### Tiered Rate Limiting (kitcn/ratelimit)
Migrated from `@convex-dev/rate-limiter` (Convex component) to `kitcn/ratelimit` (built-in plugin with local schema tables). Three-tier system: public (unauthenticated), free (authenticated), premium (admin). Middleware-based rate limiting on all cRPC mutation builders (auth middleware runs first, rate limit middleware second so `getUserTier()` can read `ctx.user`). Queries are NOT rate limited (reads are cheap, real-time subscriptions would thrash limits). Chat actions use `Ratelimit` class directly since action context doesn't get mutation middleware. Public chat has stacked limits (5/min + 20/hr + 50/day) with sequential short-circuit to avoid burning higher-tier quota. Rate limit values are consolidated in `CHAT_LIMITS` constant exported from the plugin. Client-side `useRatelimit()` hook uses string-based query references to `hookAPI()` exports — two separate hooks for public (5/min) and auth (30/min) tiers. Schema extension via `defineSchemaExtension()` adds `ratelimitState`, `ratelimitDynamicLimit`, `ratelimitProtectionHit` tables.
- Key file: `packages/backend/convex/lib/plugins/ratelimit/plugin.ts` (bucket config, tier resolution, CHAT_LIMITS)
- Key file: `packages/backend/convex/lib/plugins/ratelimit/schema.ts` (schema extension)
- Key file: `packages/backend/convex/lib/crpc.ts` (middleware wiring)
- Key file: `packages/backend/convex/functions/chatAction.ts` (direct Ratelimit usage in action)
- Key file: `packages/backend/convex/functions/ratelimit.ts` (hookAPI exports for client UX)
- Spec: `docs/superpowers/specs/2026-04-03-ratelimit-migration-design.md`

### Insurance Calculator
Client-side coverage estimator based on age, income, gender, marital status, and goals. Calculates recommended coverage, IUL premiums, annuity premiums, and death benefit. Input validation prevents NaN results.
- Key file: `apps/web/src/routes/_portal/calculator.tsx`

### Collapsible Sidebar Layouts
Both admin and portal sidebars toggle between full width (w-64) and icon-only mode (w-16). CSS transition animation. Title tooltips on collapsed icons. Accessible aria-labels on toggle buttons.
- Key file: `apps/web/src/routes/admin.tsx`
- Key file: `apps/web/src/routes/_portal.tsx`

### cRPC Type-Safe API Layer
kitcn cRPC provides typed procedure builders (publicQuery, authMutation, adminMutation, optionalAuthAction, etc.) with Zod input validation and SessionUser typing. All mutation builders have rate limit middleware chained after auth middleware. Frontend consumes via `useCRPC()` hook + TanStack Query. Middleware adds `userId` to ctx but kitcn's generated types don't reflect middleware extensions — requires `(ctx as any).userId` casts. Raw Convex functions (like `listMessages`) that use `mutation()`/`query()` directly are accessed via `@convex/convex-api` import (re-exports raw `_generated/api`), while cRPC procedures use `@convex/api`.
- Key file: `packages/backend/convex/lib/crpc.ts`
- Key file: `packages/backend/convex/lib/helpers.ts`
- Key file: `packages/backend/convex/shared/convex-api.ts` (raw API re-export)
- Key file: `apps/web/src/lib/convex/crpc.tsx`

### Resource Library with File Storage
Upload and download training documents, marketing materials, compliance files via Convex file storage with signed URLs. Categorized by type. Admin-only uploads. Storage files cleaned up on resource deletion. Resource existence verified before returning download URLs.
- Key file: `packages/backend/convex/functions/resources.ts`
- Key file: `apps/web/src/routes/admin/manage-resources.tsx`

### kitcn Migration (from better-convex)
Migrated from better-convex 0.11 to kitcn 0.12 in April 2026. Package rename + import path changes (`better-convex/*` → `kitcn/*`). Schema refactored from standalone `defineRelations()` to chained `defineSchema().relations()`. CLI commands changed (`kitcn dev`, `kitcn codegen`). Typecheck enabled (was previously disabled). No data migration needed — purely tooling/imports. JWKS table may need clearing if BETTER_AUTH_SECRET changes (decrypt error).
- Key file: `packages/backend/convex/functions/schema.ts`
- Key file: `packages/backend/package.json`
