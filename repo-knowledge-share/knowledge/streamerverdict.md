---
name: streamerverdict
repo: Derek-X-Wang/StreamerVerdict
description: Game review aggregator powered by YouTube streamers with transcript-based AI analysis
last_scanned: 2026-04-03
---

## Tech Stack
- **Runtime:** Bun 1.3
- **Frontend:** Next.js 16, React 19, TailwindCSS 4, TanStack Query, Framer Motion, Radix UI, Zustand
- **Backend:** Convex (serverless) via kitcn 0.12 (cRPC + ORM + Better Auth) — migrated from better-convex
- **Auth:** Better Auth with email/password, Google OAuth, Twitch OAuth, admin plugin for RBAC
- **Database:** Convex real-time document database (kitcn ORM with `convexTable`, `defineSchema().relations()`)
- **CMS:** Payload CMS 3 with SQLite (blog content only)
- **AI:** Gemini Flash via OpenRouter (pipeline), Vercel AI SDK
- **Monorepo:** Bun workspaces + Turborepo
- **Linting:** oxlint, Prettier
- **Testing:** Vitest (unit), Playwright (E2E), convex-test (backend)
- **CLI:** Commander.js + Consola (`bun dx` internal tool)

## Features

### Multi-Provider Authentication (Email, Google, Twitch)
Better Auth handles email/password, Google OAuth, and Twitch OAuth login flows. The admin plugin manages roles on the `user.role` field, with auto-promotion based on a configurable `ADMIN` env var. Session management uses JWT via Convex's auth config.
- Key file: `packages/backend/convex/functions/auth.ts`
- Key file: `packages/backend/convex/functions/auth.config.ts`
- Key file: `apps/web/src/components/sign-in-form.tsx`

### Role-Based Access Control (Admin Plugin)
Admin role is stored on `user.role` via Better Auth's admin plugin (no separate roles table). cRPC middleware provides `adminMutation`, `adminQuery`, `adminAction` builders that enforce admin-only access. The frontend uses an `AdminGuard` component.
- Key file: `packages/backend/convex/lib/crpc.ts`
- Key file: `packages/backend/convex/functions/users.ts`
- Key file: `apps/web/src/components/admin-guard.tsx`

### Game Catalog with Aggregated Scores
Games are stored with IGDB metadata (slug, platforms, genres, cover art). Each game page shows an aggregated score computed from the latest review per streamer. Supports DLC/expansion hierarchy via `parentGameId` self-reference.
- Key file: `packages/backend/convex/functions/games.ts`
- Key file: `packages/backend/convex/functions/schema.ts`
- Key file: `apps/web/src/app/games/[slug]/game-detail-client.tsx`

### Streamer Profiles with YouTube Integration
Streamers have YouTube channel IDs for RSS/API polling. Avatar refresh pulls from YouTube Data API. Review yield tracking uses `aggregateIndex` on the review table to count reviews per streamer for channel prioritization.
- Key file: `packages/backend/convex/functions/streamers.ts`
- Key file: `apps/web/src/app/admin/streamers/page.tsx`
- Key file: `apps/web/src/components/streamer-avatar.tsx`

### YouTube RSS and API Ingestion
Two polling modes: batched RSS feed parsing (free, `fast-xml-parser`) and YouTube Data API `playlistItems.list` (costs quota). RSS is the default; API is used for deep historical backfill with cursor-based pagination (`deepPollCursor` on streamer). Videos are inserted with `queued` status.
- Key file: `packages/backend/convex/functions/ingest.ts`
- Key file: `apps/dx/src/commands/pipeline.ts`

### Review Detection (Regex + AI Two-Stage)
Stage 1 uses regex patterns to classify video titles as reviews and match them to games (pure functions, eval-driven development). Uncertain titles go to Stage 2 AI classification. Detection confidence scores determine whether auto-audit or manual audit is required.
- Key file: `packages/backend/convex/lib/detection.ts`
- Key file: `packages/backend/detection-eval/`

### AI Transcript Analysis (Gemini Flash)
Queued videos are processed by Gemini Flash via OpenRouter using the Vercel AI SDK. The AI extracts per-game scores, sentiment, pros/cons, summary, and video timestamps from YouTube transcripts (`youtube-transcript` package). One video can produce multiple `GameAnalysis` objects for multi-game reviews.
- Key file: `packages/backend/convex/functions/ingest.ts`
- Key file: `packages/backend/convex/functions/schema.ts` (GameAnalysis type)

### IGDB Game Metadata Resolution
Game metadata (cover art, platforms, genres, IGDB ID) is fetched from the IGDB API using Twitch OAuth. Rate-limited to 3 requests/second. Used during ingestion to resolve detected game names to canonical game records.
- Key file: `packages/backend/convex/lib/igdb.ts`

### Video Audit Queue (Auto + Manual)
Videos flow through `queued` -> `processing` -> `audit_ready`/`completed`. Auto-audit approves when game + streamer + valid analysis resolve cleanly. Edge cases land in `audit_ready` for manual review via CLI (`bun dx audit`) or admin web UI. Approve/reject creates or skips review records.
- Key file: `packages/backend/convex/functions/ingest.ts`
- Key file: `apps/dx/src/commands/audit.ts`
- Key file: `apps/web/src/app/admin/audit/page.tsx`

### Review Records with Video Timestamps
Each review links a game, streamer, and video with a specific timestamp (seconds). Multiple reviews per game per streamer are allowed (latest by `refreshedAt` is used for scoring). Insert logic is centralized in `review-helpers.ts`.
- Key file: `packages/backend/convex/functions/reviews.ts`
- Key file: `packages/backend/convex/lib/review-helpers.ts`

### cRPC Type-Safe API Layer
better-convex cRPC provides typed procedure builders (`publicQuery`, `authMutation`, `adminAction`, etc.) with Zod input validation. Frontend consumes via `useCRPC()` hook + TanStack Query. Inter-procedure calls use `createHandler`/`createCaller` patterns.
- Key file: `packages/backend/convex/lib/crpc.ts`
- Key file: `apps/web/src/lib/convex/crpc.tsx`

### User Preferences (Followed Streamers, Categories)
Users can follow specific streamers and set preferred categories (e.g., "Souls-like Experts") to personalize aggregated scores. Stored in the `userPreference` table keyed by `userId`.
- Key file: `packages/backend/convex/functions/schema.ts` (userPreference table)
- Key file: `apps/web/src/app/preferences/page.tsx`

### Report Inaccurate Data (User Feedback)
Users can report inaccurate game profiles or review summaries. Reports are validated by target type (game vs review), rate-limited (5-minute dedup), and flow through open/processing/resolved/dismissed statuses. Admin endpoints manage resolution.
- Key file: `packages/backend/convex/functions/reports.ts`
- Key file: `apps/web/src/components/report/report-button.tsx`
- Key file: `apps/web/src/components/report/report-dialog.tsx`

### Internal CLI Tool (bun dx)
Commander.js-based CLI wraps all dev workflows: dev servers, testing, database seeding, ingestion pipeline, audit queue, user management, and status dashboards. Acts as the single entry point for both human developers and AI agents.
- Key file: `apps/dx/src/index.ts`
- Key file: `apps/dx/src/commands/`

### Payload CMS for Blog Content
Payload CMS 3 with SQLite serves blog posts and authors (methodology page, articles). Runs on port 5002 as a separate Next.js app. Rich text editing via Lexical. The web app fetches articles for `/blog/[slug]` and `/articles/[slug]` routes.
- Key file: `apps/cms/payload.config.ts`
- Key file: `apps/web/src/app/blog/[slug]/page.tsx`
- Key file: `apps/web/src/app/articles/[slug]/page.tsx`

### Cron-Based Pipeline Automation
Convex cron jobs for hourly RSS polling, daily API polling, and 30-minute queue processing are defined but currently disabled. When enabled, they automate the full ingestion pipeline without manual intervention.
- Key file: `packages/backend/convex/functions/crons.ts`

### Deep Poll Historical Backfill
Historical YouTube video backfill via the YouTube Data API with cursor-based pagination. Tracks `deepPollCursor` and `deepPollComplete` per streamer to resume across runs. Accessible via `bun dx pipeline deep-poll`.
- Key file: `packages/backend/convex/functions/ingest.ts`
- Key file: `apps/dx/src/commands/pipeline.ts`
