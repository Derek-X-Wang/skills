# OpenCode harness and Go gateway

Last verified: 2026-08-29 with OpenCode 1.18.25. The foreground control recorded in the [2026-08-29 field findings](../research/opencode-route-field-findings-2026-08-29.md) returned the requested text in its first invocation, persisted an explicit session, and exited with status zero. A separate Claude Code field run exposed detached-process and Orca terminal hazards described below.

Treat OpenCode as a harness. Treat OpenCode Go as an entitlement and multi-provider model gateway, not as the originating model provider. Record the model's provider separately.

## Detection

Read injected runtime metadata first. Verify the resolved OpenCode executable and version, live model inventory, selected model ID, checkout or worktree, and return path. A host cache does not prove which executable a child process will use. Do not infer an active OpenCode Go entitlement from the installed binary. Never print or persist an API key.

Treat a model without a current [model profile](../model-profiles.md) as untested until Derek records representative evidence.

## Operational handoff

| Chosen action | Operational source |
| --- | --- |
| Select a model or run a focused one-shot worker | The live OpenCode CLI help and advertised model inventory |
| Create or target an external terminal or worktree | Read [orca.md](orca.md), then load `orca-cli` |
| Use an attended external terminal | Read [orca.md](orca.md), then load `orca-cli`; load `orchestration` only when a version-matched OpenCode task lifecycle is proven |

This reference owns OpenCode capability mapping and route-specific invariants. The live OpenCode CLI owns current model and launch mechanics. Orca's operational skills own terminal and worktree mechanics. On the attended fallback, the orchestrator owns prompt delivery, observation, and result verification. The `orchestration` skill owns task-lifecycle mechanics only after version-matched OpenCode support is proven.

## Proven routes

### One-shot `opencode run` route

Use `opencode run` for a focused opinion, review, or bounded implementation that can return once while the orchestrator owns and observes the process:

```text
active orchestrator
  └─ foreground shell child process and captured result
       └─ OpenCode worker with an exact model and checkout
```

Verify the exact executable, version, model, checkout, dispatch, and return contract before work begins. For an editing worker, use a dedicated worktree. Keep the process in the foreground unless a verified supervisor owns its lifetime, exit status, and output. Do not detach or background it from a short-lived harness shell.

Capture the exit status, structured events, standard output, and standard error. OpenCode can write normal progress to standard error, so empty standard output does not prove that the run never started. Treat success as process completion without an error event, the required worker response, and the expected repository evidence.

Capture an explicit session identity and verify that the session is readable before promising follow-up or resume support. Do not select an implicit most-recent session when concurrent runs exist. If an interrupted run has no persisted session, it cannot resume; send a fresh dispatch.

The one-shot route cannot conduct an interactive clarification loop. Send a decision-complete dispatch. Return a question or permission request to the orchestrator as a blocker. Do not enable broad automatic approval to bypass it.

This route is available from a harness session that can safely launch and observe the OpenCode CLI. When T3 hosts that harness, this is still a direct CLI route. T3 does not own the worker lifecycle or return path.

### Attended Orca terminal fallback

Use an Orca-managed separate terminal only when the worker must be visible or interactive and the orchestrator can attend the terminal:

```text
active orchestrator
  └─ Orca terminal and manual observation
       └─ OpenCode worker with an exact model and worktree
```

In Orca 1.4.191, the OpenCode worker launcher created the correct terminal and TUI, but automated prompt delivery failed with `agent_prompt_stalled` at `dispatch_input`. Treat this version as launch-capable, not supervised-dispatch-capable. Manual terminal delivery worked, but it produced no `worker_done` event or reliable completion notice. Verify results through fresh terminal reads and repository evidence. Do not classify this route as AFK-capable.

Before every prompt delivery, confirm from a fresh terminal read that the OpenCode TUI, not a shell, is the foreground process. A terminal handle proves terminal identity only. Use a harmless probe before the first real dispatch when prompt delivery has not been proven for the active version.

Do not treat a generic terminal interrupt as an OpenCode pause. In the verified field run, the interrupt exited OpenCode and exposed a shell. After any interrupt or exit, restart OpenCode and prove TUI readiness before sending more text. Never send an agent brief to an unverified terminal foreground.

Start or target the fallback through Orca's terminal and worktree surface, not its unproven OpenCode worker lifecycle. If a failed worker-launch attempt leaves a usable TUI, its task record remains `failed`; that state describes the automation failure, not the later manual worker outcome. Manual terminal activity does not repair or complete the task record.

Keep the current session as orchestrator. Verify the live terminal, exact model, worktree, prompt delivery, and manual return path before work begins. Give each editing worker its own worktree. If the orchestrator cannot attend the terminal or prove delivery and return, choose another route.

## Routes that need more integration

- OpenCode's server, SDK, and ACP surfaces can support a custom persistent control plane. Treat them as unproven until the installed client proves launch, permissions, message delivery, completion, interruption, transcript reads, and cleanup.
- Orca's structured OpenCode task lifecycle remains unproven until a version-matched adapter proves prompt delivery, foreground-agent detection, completion, interruption, and return events.
- T3 can host a human-created OpenCode thread. The current Codex-in-T3 tool inventory does not expose programmatic OpenCode thread control.
- A direct OpenCode Go model request bypasses the OpenCode harness. Do not call it an OpenCode worker or assume that it loads agent instructions, tools, permissions, or session state.

As of 2026-08-28, DeepSeek V4 Flash returned an account consent gate for China-hosted processing. Do not change that account or data-location choice without Derek's explicit approval.

Choose the worker or reviewer model from the [model profiles](../model-profiles.md) and [routing matrix](../routing-matrix.md). Apply the [review policy](../review-policy.md) before selecting any reviewer. Do not infer role eligibility from model availability.

For dated route evidence and primary sources, see [native routes research](../research/opencode-native-routes-2026-08-28.md), [host routes research](../research/opencode-host-routes-2026-08-28.md), and [field findings from OpenCode and Orca](../research/opencode-route-field-findings-2026-08-29.md).

Official references: <https://opencode.ai/docs/cli/#run> and <https://opencode.ai/go>
