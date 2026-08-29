# OpenCode harness and Go gateway

Last verified: 2026-08-28 with OpenCode 1.18.25.

Treat OpenCode as a harness. Treat OpenCode Go as an entitlement and multi-provider model gateway, not as the originating model provider. Record the model's provider separately.

## Detection

Read injected runtime metadata first. Verify the current OpenCode version, live model inventory, selected model ID, checkout or worktree, and return path. Do not infer an active OpenCode Go entitlement from the installed binary. Never print or persist an API key.

Treat a model without a current [model profile](../model-profiles.md) as untested until Derek records representative evidence.

## Operational handoff

| Chosen action | Operational source |
| --- | --- |
| Select a model or run OpenCode | The live OpenCode CLI help and advertised model inventory |
| Create or target an external terminal or worktree | Read [orca.md](orca.md), then load `orca-cli` |
| Dispatch, wait, and receive the worker result | Read [orca.md](orca.md), then load `orchestration` |

This reference owns OpenCode capability mapping and route-specific invariants. The live OpenCode CLI owns current model and launch mechanics. The Orca operational skills own terminal, dispatch, wait, and return mechanics.

No direct Codex, Claude Code, or T3 route to an OpenCode session is currently proven. Do not invent one.

## Current route

Use OpenCode as an external worker through a separate Orca-managed terminal:

```text
active orchestrator
  └─ Orca terminal and return path
       └─ OpenCode worker with an exact model and worktree
```

Keep the current session as orchestrator. Verify the live Orca terminal, exact model, worktree, dispatch, and return path before work begins. Give each editing worker its own worktree. If Orca cannot prove delivery and return, treat the route as unavailable.

Choose the worker or reviewer model from the [model profiles](../model-profiles.md) and [routing matrix](../routing-matrix.md). Apply the [review policy](../review-policy.md) before selecting any reviewer. Do not infer role eligibility from model availability.

Official reference: <https://opencode.ai/go>
