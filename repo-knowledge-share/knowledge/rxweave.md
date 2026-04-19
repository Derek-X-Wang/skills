---
name: rxweave
repo: Derek-X-Wang/rxweave
description: Open-source reactive event system for human+AI collaboration — event log + reactive streams + agent runtime + CLI, local-first with optional cloud sync
last_scanned: 2026-04-19
---

## Tech Stack
- **Runtime:** Bun 1.3+ primary; Node 22+ supported. ESM-only (no CJS).
- **Language:** TypeScript 5.9, Effect v3.21 (`Context.Tag`, `Effect.fn`, `Schema.TaggedError`, `Stream`, `FiberMap`)
- **Monorepo:** Bun workspaces + Turborepo 2.9
- **Build:** `bun build --target=node --format=esm --splitting --packages=external` + `tsc --emitDeclarationOnly`
- **Testing:** Vitest 2.1 + `@effect/vitest` 0.17 (`it.effect`, `it.scoped`, `it.scopedLive`, `TestClock`, `TestRandom`)
- **Lint:** oxlint 0.13
- **Hashing:** `@noble/hashes@2.2` (V8-isolate-safe; replaces `node:crypto` so schema can run in Convex / browsers)
- **CLI:** `@effect/cli` 0.50, compiled via `bun build --compile` to a single binary
- **RPC:** `@effect/rpc` 0.75 (NDJSON transport) for the cloud wire contract

## Features

### Event Envelope + Schema Registry
Every event is a typed envelope `{id: ULID, type, actor, source, timestamp, causedBy?, payload}`. Types are registered via `defineEvent(type, payloadSchema)` on an `EventRegistry` service tag. Registry has sha256 digest cached in a Ref and invalidated on `register()` so clients can do digest-based negotiation with a cloud server without paying the rehash on every append.
- Key file: `packages/schema/src/Envelope.ts` (EventEnvelope is Schema.Class; EventInput is Schema.Struct so plain objects round-trip through @effect/rpc's encoder)
- Key file: `packages/schema/src/Registry.ts` (EventRegistry with memoized digest)
- Key file: `packages/schema/src/Ulid.ts` (custom ULID factory using Effect Clock + Random — deterministic under TestClock/TestRandom)

### EventStore Service Tag (pluggable adapters)
`EventStore` Context.Tag exposes `append/subscribe/getById/query/queryAfter/latestCursor`. Cursor is `EventId | "earliest" | "latest"` with strict exclusive-cursor semantics (`queryAfter(cursor)` never re-delivers the cursor event). `queryAfter(cursor, filter, limit)` pushes the exclusive-cursor predicate to the underlying index instead of scanning from the top every call — key for polling-based adapters to not stall past page 1.
- Key file: `packages/core/src/EventStore.ts`
- Key file: `packages/core/src/testing/conformance.ts` (10-case shared test suite; every adapter runs it)

### In-Memory EventStore (`store-memory`)
Ref-backed log + `PubSub.sliding(1024)` for fan-out. Writes serialized through `Semaphore(1)`. Replay→live handoff snapshots the log under the writer lock, subscribes to the pubsub, and concats `Stream.fromIterable(replay) + Stream.fromPubSub(live)` with id>snapshotMax dedup.
- Key file: `packages/store-memory/src/MemoryStore.ts`

### File EventStore (`store-file`)
Append-only JSONL file, single writer fiber with fsync after each batch. Cold-start scan reads line-by-line; corrupted interior lines are logged+skipped; a torn final line gets truncated so the file stays appendable. Emits a `system.store.recovery` event on startup with `{skipped, truncatedBytes}` when recovery happens.
- Key file: `packages/store-file/src/FileStore.ts`
- Key file: `packages/store-file/src/Recovery.ts`

### Cloud EventStore Client (`store-cloud`)
`@effect/rpc` over NDJSON HTTP with bearer-token injection via `HttpClient.mapRequestEffect` (lazy token resolver supports rotating credentials). Subscribe reconnects on both failure and normal completion with last-delivered cursor. Retry classification: `NotFoundWireError`, `RegistryError`, 401/403/schema-mismatch are terminal; transient errors retry with `Schedule.exponential(500ms, 1.5)` capped at 10. Tracks `latestCursor` locally by watching `append` results (Cloud server has no true-streaming primitive; would be wrong to read from server each time).
- Key file: `packages/store-cloud/src/CloudStore.ts`
- Key file: `packages/store-cloud/src/RegistrySync.ts` (digest-diff negotiation — only pushes defs the server is missing)
- Key file: `packages/store-cloud/src/Auth.ts` (bearer-token middleware with 5min token cache + 401 refresh)

### Reactive Stream Helpers (`reactive`)
Thin wrappers over Effect Stream: `whereType(glob)` (minimatch), `byActor`, `bySource`, `withinWindow(ms)` (uses `Clock.currentTimeMillis` — deterministic under TestClock), `decodeAs(schema)`. No custom Observable or query DSL — rxweave's pitch is "Effect Stream IS Rx; don't wrap it."
- Key file: `packages/reactive/src/helpers.ts`

### Agent Runtime (`runtime`)
Declarative `defineAgent({id, on: Filter, handle | reduce, initialState?})` with `validateAgent` enforcing handle-xor-reduce + initialState-required-with-reduce as `InvalidAgentDef`. `supervise(agents, opts)` runs each in a `FiberMap` keyed by agent id (supports per-agent status/restart/stop in v0.2+). Runtime owns cursor persistence per agent id (`AgentCursorStore` with Memory + File variants), stamps provenance on emits (`actor: agent.id, source: "agent", causedBy: [trigger.id]`), and emits `system.agent.heartbeat` every 10s with change-detection guard so idle agents don't flood polling-based stores.
- Key file: `packages/runtime/src/AgentDef.ts`
- Key file: `packages/runtime/src/Supervisor.ts` (FiberMap-based supervisor + heartbeat emitter)
- Key file: `packages/runtime/src/Dedupe.ts` (`withIdempotence(key, "local" | "store", handler)` combinator)
- Key file: `packages/runtime/src/AgentCursorStore.ts`

### CLI (`cli`) — AI-first
`rxweave init/dev/emit/stream/get/inspect/count/last/head/schema/agent/store`. NDJSON stdout by default (`--pretty` opts in to ANSI); structured tagged errors on stderr via `Output.writeError`; exit codes 0–6 classified by error tag (`NotFound`→2, `SchemaValidation`→3, etc.). Zero interactive prompts. `rxweave.config.ts` loader runs for every command (not just `dev`) so one-shot `emit`/`stream` work against registered event types. Dev command uses `@parcel/watcher` to hot-reload config changes.
- Key file: `packages/cli/bin/rxweave.ts` (entry + exit-code handler)
- Key file: `packages/cli/src/Config.ts` (defineConfig loader)
- Key file: `packages/cli/src/Output.ts` (NDJSON / pretty writer Context.Tag)
- Key file: `packages/cli/src/commands/` (one file per command)

### Protocol (`@rxweave/protocol`)
`RpcGroup` defining the cloud wire contract: `Append` (with registryDigest), `Subscribe` (streamed), `GetById`, `Query`, `QueryAfter` (cursor-paged — added v0.2.1 after the client was silently returning [] past `limit` with accumulated history), `RegistrySyncDiff` (digest-delta negotiation), `RegistryPush`. Shared with cloud repo; cloud implements the handlers.
- Key file: `packages/protocol/src/RxWeaveRpc.ts`

### Example Agents (`apps/dev`)
Three demo agents: `counterAgent` (pure reduce, emits `counter.tick`); `echoAgent` (side-effectful handle with `withIdempotence("local")`); `taskFromSpeechAgent` (semantic derivation — `speech.transcribed` → `task.created` when text contains "todo"/"task"/"remind me"). All registered in a sample `rxweave.config.ts` that `bun run dev` loads via the CLI.
- Key file: `apps/dev/agents/counter.ts` / `echo.ts` / `task-from-speech.ts`
- Key file: `apps/dev/rxweave.config.ts`

## Design Principles (locked)
- **Minimal primitives, maximal composition.** Event log + Stream + Agent. No custom Rx — Effect Stream IS Rx.
- **Effect-native.** `Context.Tag`, `Effect.fn`, `Schema.TaggedError`, `Schema.parseJson`. No raw errors, no `try/catch` in generators, no `JSON.parse`.
- **Deterministic first.** ULID with `Clock`+`Random` so TestClock/TestRandom give reproducible ids; `TestClock` used in reactive helpers (e.g. `withinWindow`).
- **AI-first CLI.** NDJSON stdout, tagged-error stderr, exit codes 0–6, zero prompts.
- **Cloud-optional.** Core has zero cloud deps. Cloud is a downstream `@rxweave/store-cloud` adapter + separate repo.
- **At-least-once delivery.** Agent cursor persistence is batched (100 events OR 1s). Supervisor restarts on tagged errors per `Schedule.exponential(100ms, 2.0).either(Schedule.spaced(30s))`.

## Reference Projects
- `dynakv` — closest shape (Bun workspaces + Turbo + TS SDK + CLI + HTTP API). Used as precedent when picking the monorepo structure.
- Maitred `packages/cli` — Effect v3 CLI pattern precedent (though rxweave ships `@effect/cli`, not `sade`).
