# OpenCode harness and Go gateway

Last verified: 2026-08-29 with OpenCode 1.18.25. A Codex session hosted by T3 Code completed a direct non-interactive GLM-5.3-Flash run with the expected result and a zero exit status.

Treat OpenCode as a harness. Treat OpenCode Go as an entitlement and multi-provider model gateway, not as the originating model provider. Record the model's provider separately.

## Detection

Read injected runtime metadata first. Verify the resolved OpenCode executable and version, live model inventory, selected model ID, checkout or worktree, and return path. A host cache does not prove which executable a child process will use. Do not infer an active OpenCode Go entitlement from the installed binary. Never print or persist an API key.

Treat a model without a current [model profile](../model-profiles.md) as untested until Derek records representative evidence.

## Operational handoff

| Chosen action | Operational source |
| --- | --- |
| Select a model or run a focused one-shot worker | The live OpenCode CLI help and advertised model inventory |
| Create or target an external terminal or worktree | Read [orca.md](orca.md), then load `orca-cli` |
| Dispatch, wait, and receive a durable worker result | Read [orca.md](orca.md), then load `orchestration` |

This reference owns OpenCode capability mapping and route-specific invariants. The live OpenCode CLI owns current model and launch mechanics. The Orca operational skills own durable terminal, dispatch, wait, and return mechanics.

## Proven routes

### One-shot `opencode run` route

Use `opencode run` for a focused opinion, review, or bounded implementation that can return once:

```text
active orchestrator
  └─ shell child process and captured result
       └─ OpenCode worker with an exact model and checkout
```

Verify the exact executable, version, model, checkout, dispatch, and return contract before work begins. For an editing worker, use a dedicated worktree. Treat success as process completion without an error event, the required worker response, and the expected repository evidence. Use an explicit session identity for follow-up work. Do not select an implicit most-recent session when concurrent runs exist.

The one-shot route cannot conduct an interactive clarification loop. Send a decision-complete dispatch. Return a question or permission request to the orchestrator as a blocker. Do not enable broad automatic approval to bypass it.

This route is available from a harness session that can safely launch and observe the OpenCode CLI. When T3 hosts that harness, this is still a direct CLI route. T3 does not own the worker lifecycle or return path.

### Durable Orca route

Use an Orca-managed separate terminal when the worker must be visible, interactive, multi-round, or AFK:

```text
active orchestrator
  └─ Orca terminal and return path
       └─ OpenCode worker with an exact model and worktree
```

Keep the current session as orchestrator. Verify the live Orca terminal, exact model, worktree, dispatch, and return path before work begins. Give each editing worker its own worktree. If Orca cannot prove delivery and return, treat the route as unavailable.

## Routes that need more integration

- OpenCode's server, SDK, and ACP surfaces can support a custom persistent control plane. Treat them as unproven until the installed client proves launch, permissions, message delivery, completion, interruption, transcript reads, and cleanup.
- T3 can host a human-created OpenCode thread. The current Codex-in-T3 tool inventory does not expose programmatic OpenCode thread control.
- A direct OpenCode Go model request bypasses the OpenCode harness. Do not call it an OpenCode worker or assume that it loads agent instructions, tools, permissions, or session state.

As of 2026-08-28, DeepSeek V4 Flash returned an account consent gate for China-hosted processing. Do not change that account or data-location choice without Derek's explicit approval.

Choose the worker or reviewer model from the [model profiles](../model-profiles.md) and [routing matrix](../routing-matrix.md). Apply the [review policy](../review-policy.md) before selecting any reviewer. Do not infer role eligibility from model availability.

For dated route evidence and primary sources, see [native routes research](../research/opencode-native-routes-2026-08-28.md) and [host routes research](../research/opencode-host-routes-2026-08-28.md).

Official references: <https://opencode.ai/docs/cli/#run> and <https://opencode.ai/go>
