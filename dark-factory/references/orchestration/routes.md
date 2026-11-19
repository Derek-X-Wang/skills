# Routes

Read this before a new route, a dispatch to another harness, host, or machine, or a host you have not verified in this session. A native child on an already verified route needs only the [bounded single-worker path](../orchestration.md#bounded-single-worker-path).

## Build the capability graph

Use these terms consistently:

| Term | Meaning |
| --- | --- |
| Entitlement | A subscription, API account, quota, or local compute source |
| Provider | The organization that supplies a model |
| Model | The intelligence used for a role |
| Gateway | A service that exposes models from one or more providers through one access route |
| Harness | The agent loop, tools, context, and permission system |
| Session | One running model and harness in one checkout |
| Host | The UI or terminal environment that displays sessions |
| Control plane | A capability that discovers, launches, messages, waits for, and stops sessions |
| Route | The connection from the orchestrator to another session |

Treat the environment as a capability graph, not a fixed product stack. One product can provide several capabilities. For example, a harness can also provide a native control plane, and a host can expose routes to several harnesses.

The orchestrator establishes a small runtime fingerprint before the first dispatch, reusing verified current-session evidence and keeping these layers separate:

- Active user-driving host — Orca, T3 Code, Codex Desktop, or another host — identified from current session metadata and live exposed tools. Never infer it from the model or executable alone, installed or running apps, a reachable Orca CLI, a shared skill catalog, the project directory, or an inherited marker.
- Current executing harness, model, originating provider, serving gateway when present, and session.
- Execution machine, local or remote, and the exact checkout or worktree.
- Adapter and target state owner, and the control plane plus verified return route, as separate layers.

Then list native agent tools, and entitlement or quota limits only when they can change the route.

Trust injected runtime and session metadata first. Then inspect exposed tools. Check only exact, non-secret environment markers and current CLI help when needed. Never print an environment or a broad variable prefix. Leave unknown or conflicting fields unknown; ask only when the ambiguity changes a safe action. Incomplete host identity alone is not a refusal when the needed local adapter and target state owner are independently proven. The orchestrator refreshes affected evidence at an actual handoff, reconnect, session restart, or real route/tool/host change. A worker follows [worker mode](../worker.md) and flags observed mismatches; task-specific UI readiness still requires its own evidence.

Distinguish the common host shapes: Orca hosting Codex, Claude, or OpenCode sessions in its worktrees; T3 Code hosting provider sessions and harness-native children; and a native Codex Desktop session. One harness can appear in several hosts while desktop and plugin readiness and the return route belong to each session. A reachable Orca CLI from T3 Code or Codex Desktop makes Orca an external route, not the active host, and a harness-native child's tools imply no new top-level session.

Automatic cross-host dispatch additionally requires verified evidence of the exact endpoint and session identity, the worker's harness, model, effort, and worktree, permitted prompt receipt and start, required tools and target readiness, approval and question handling, result and failure observation, and safe interrupt with owned cleanup and return to this orchestrator. Until then the route is unverified (`NOT-RUN`), and a non-idempotent action that may have landed keeps `PARTIAL` and its replay constraints. Host or adapter switching does not automatically transfer the orchestrator role or the verified parent return path.

Read the references needed for the current environment and candidate routes before making a new route choice or cross-host dispatch. Reuse already-read guidance for an unchanged verified route:

- [T3 Code](runtimes/t3-code.md)
- [Orca](runtimes/orca.md)
- [Claude Code](runtimes/claude-code.md)
- [Codex](runtimes/codex-app.md)
- [OpenCode](runtimes/opencode.md)

An observation in these references holds for the tool version it names. When the installed version differs, verify that behaviour again before you rely on it.
