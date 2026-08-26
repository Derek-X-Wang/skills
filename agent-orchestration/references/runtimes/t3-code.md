# T3 Code host

T3 Code can host several provider harnesses. Distinguish T3 top-level threads, provider sessions, and harness-native child agents. T3 may display a native child without owning its lifecycle.

## Choose the observed route

Read injected runtime metadata first. Then inspect the current tool inventory and CLI help.

| Observed surface | Route |
| --- | --- |
| Harness spawn, message, and wait tools | Harness-native child agents |
| `orchestrator_capabilities` plus delegated-task tools | T3 delegation; follow the advertised providers, models, scope, and lifecycle |
| `t3_thread_*` or equivalent thread tools | T3 top-level thread control; verify create, send, read, wait, and interrupt behavior |
| Only `preview_*` | Browser automation only; no T3 agent route |
| Only authenticated HTTP or WebSocket contracts | A custom, version-specific bridge; not a default route |

Tool names can change. Treat names seen only in unreleased code as discovery hints, not available commands. Do not depend on a T3-specific environment variable or invent a CLI route.

## Operating rules

- Prefer native tools for agents owned by the current harness. Use T3 to reach another top-level provider session only through a proven route.
- T3 drives separately installed provider runtimes. Record the host, provider harness, model, project, checkout or worktree, and authentication source. Provider billing follows that runtime's authentication and environment.
- Keep worker and reviewer traffic in the orchestrator mailbox.
- Keep work local when dispatch or return cannot be verified.

T3 has internal authenticated HTTP and WebSocket orchestration contracts. Before using a custom bridge for AFK work, prove the exact installed contract, credential cleanup, provider and model selection, message delivery, completion and failure observation, question and approval handling, transcript reads, interrupt behavior, and thread cleanup. Never expose or persist its bearer credential.

The T3 Code browser preview is unrelated to agent routing. Use it only for browser work.
