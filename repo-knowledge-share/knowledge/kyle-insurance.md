---
name: kyle-insurance
repo: Derek-X-Wang/kyle-insurance
description: Insurance agent management platform with multi-level hierarchy, commission tracking, and agent portal
last_scanned: 2026-03-29
---

## Tech Stack
- **Runtime:** Bun 1.3
- **Frontend:** TanStack Start (React 19, Vite 8), TailwindCSS 4, shadcn/ui, TanStack Query
- **Backend:** Convex (serverless) via better-convex (cRPC + ORM + Better Auth)
- **Auth:** Better Auth with email/password, admin plugin for RBAC
- **Database:** Convex real-time document database (better-convex ORM with `convexTable`, `defineRelations`)
- **AI:** OpenRouter via @convex-dev/agent (insurance chatbot with streaming)
- **i18n:** use-intl with English and Chinese locales, TanStack Router `{-$locale}` optional params
- **Monorepo:** Bun workspaces + Turborepo
- **Linting:** oxlint, Prettier, husky + lint-staged
- **Testing:** Vitest, convex-test

## Features

### Email/Password Authentication with Better Auth
Better Auth handles email/password login with Convex plugin. Admin plugin manages `user.role` field ('admin'|'user'). Auth API routes use TanStack Start middleware (not handlers) on the splat route because TanStack Start SSR redirects splat handler routes.
- Key file: `packages/backend/convex/functions/auth.ts`
- Key file: `packages/backend/convex/functions/auth.config.ts`
- Key file: `packages/backend/convex/functions/http.ts`
- Key file: `apps/web/src/routes/api/auth/$.ts`

### Role-Based Access Control (Admin + Agent)
Admin role stored on `user.role` via Better Auth admin plugin. `requireAdmin` guard checks role in `beforeLoad`. `requireAuth` guard for general authentication. `useAuthGuard()` hook as client-side fallback for SSR-bypassed guards (SSR skips auth since cookies unavailable). Admin can also be an agent (dual-role with cross-navigation links).
- Key file: `apps/web/src/lib/convex/auth/require-auth.ts`
- Key file: `packages/backend/convex/lib/crpc.ts`

### Multi-Level Agent Hierarchy (6 Ranks)
Agents organized in TA → A → SA → MD → SMD → EMD hierarchy (55%-80% commission). Each agent has upline/downline relationships (self-referencing `uplineAgentId`). Recursive downline tree queries up to depth 5/10. Commission overrides cascade through the hierarchy.
- Key file: `packages/backend/convex/functions/agents.ts`
- Key file: `packages/backend/convex/functions/schema.ts`

### Multi-Level Commission Engine
Automatic commission calculation at policy submission. Direct commissions from agent's split percentage + rank. Override commissions cascade through upline hierarchy. Denormalized commission records for fast querying. Period-based grouping (YYYY-MM).
- Key file: `packages/backend/convex/lib/commission.ts`
- Key file: `packages/backend/convex/functions/commissions.ts`
- Key file: `packages/backend/convex/functions/policies.ts`

### Insurance Case Submission (Multi-Carrier)
Submit policies with carrier & product selection, multi-agent splits. Track status: pending → inforce/declined/lapsed. Adjusted TP calculated from carrier ratio. Automatic commission cascade on submission.
- Key file: `packages/backend/convex/functions/policies.ts`
- Key file: `apps/web/src/routes/admin/cases/new.tsx`

### Agent Portal with Dashboard
Authenticated agent view with 10 sections: dashboard (metrics), team hierarchy, policies, commissions, TP report, compensation plan, resources, calculator, AI chat, profile. Dashboard uses BFS traversal of downline for aggregate metrics.
- Key file: `apps/web/src/routes/_portal.tsx`
- Key file: `apps/web/src/routes/_portal/dashboard.tsx`

### Admin Panel (CRUD Management)
Back-office for managing agents, carriers, cases, resources. Path-based routing (`/admin/*`). Collapsible sidebar. Cross-navigation to agent portal if admin has an agent profile.
- Key file: `apps/web/src/routes/admin.tsx`
- Key file: `apps/web/src/routes/admin/dashboard.tsx`

### Internationalization (English + Chinese)
use-intl with `packages/i18n` shared package. TanStack Router `{-$locale}` optional path params (no prefix for English, `/zh` for Chinese). Cookie-based locale persistence. Authenticated routes read locale from cookie (no URL prefix). Locale switcher in nav bars.
- Key file: `packages/i18n/src/shared.ts`
- Key file: `packages/i18n/src/messages/en.ts`
- Key file: `apps/web/src/routes/{-$locale}.tsx`
- Key file: `apps/web/src/components/locale-switcher.tsx`

### AI Insurance Chatbot
Streaming chat via @convex-dev/agent with OpenRouter. Rate-limited for public vs authenticated users. Persistent threads in localStorage. Floating widget on all portal pages.
- Key file: `packages/backend/convex/functions/chat.ts`
- Key file: `packages/backend/convex/functions/chatAction.ts`
- Key file: `apps/web/src/components/chat-widget.tsx`

### Insurance Calculator
Client-side coverage estimator based on age, income, gender, marital status, and goals. Calculates recommended coverage, IUL premiums, annuity premiums, and death benefit.
- Key file: `apps/web/src/routes/_portal/calculator.tsx`

### Collapsible Sidebar Layouts
Both admin and portal sidebars toggle between full width (w-64) and icon-only mode (w-16). CSS transition animation. Title tooltips on collapsed icons.
- Key file: `apps/web/src/routes/admin.tsx`
- Key file: `apps/web/src/routes/_portal.tsx`

### cRPC Type-Safe API Layer
better-convex cRPC provides typed procedure builders (publicQuery, authMutation, adminMutation, etc.) with Zod input validation and SessionUser typing. Frontend consumes via `useCRPC()` hook + TanStack Query.
- Key file: `packages/backend/convex/lib/crpc.ts`
- Key file: `apps/web/src/lib/convex/crpc.tsx`

### Resource Library with File Storage
Upload and download training documents, marketing materials, compliance files via Convex file storage with signed URLs. Categorized by type. Admin-only uploads.
- Key file: `packages/backend/convex/functions/resources.ts`
- Key file: `apps/web/src/routes/admin/manage-resources.tsx`
