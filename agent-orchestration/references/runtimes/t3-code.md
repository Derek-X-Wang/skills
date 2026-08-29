# T3 Code host

Treat T3 Code as a host that may also expose control-plane routes. It can host several provider harnesses. Distinguish T3 top-level threads, provider sessions, and harness-native child agents. T3 may display a native child without owning its lifecycle.

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

## Operational handoff

| Chosen action | Operational source |
| --- | --- |
| Harness-owned child agents | The native tools and schemas exposed by that harness |
| T3 delegation or top-level thread control | Load a T3-owned operational skill when exposed; otherwise use the advertised live tool schemas |
| Custom authenticated bridge | The exact installed contract proven for the current version |

This reference owns T3 capability mapping and coordination invariants. The selected operational source owns its mechanics. Do not assume a general T3 agent CLI or operational skill exists. If no source proves dispatch and return, keep the work local.

## Operating rules

- Use T3 to reach another top-level provider session only through a proven route.
- A provider CLI launched by the current harness is not T3 delegation. For example, a Codex session hosted by T3 can launch an `opencode run` worker when the OpenCode runtime reference permits it; the harness owns that child process and return path.
- T3 drives separately installed provider harnesses. Record the host, harness, model, provider, project, checkout or worktree, route, and entitlement source. Provider billing follows that harness's authentication and environment.
- Keep worker and reviewer traffic on the orchestrator's verified return path.
- Keep work local when dispatch or return cannot be verified.

T3 has internal authenticated HTTP and WebSocket orchestration contracts. Before using a custom bridge for AFK work, prove the exact installed contract, credential cleanup, provider and model selection, message delivery, completion and failure observation, question and approval handling, transcript reads, interrupt behavior, and thread cleanup. Never expose or persist its bearer credential.

The T3 Code browser preview is unrelated to agent routing. Use it only for browser work.
