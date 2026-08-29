# Operating routing matrix

Last reviewed: 2026-08-29.

These are Derek's current operating preferences. They combine model capability, available subscriptions, route friction, and quota. They are not a pure intelligence ranking. Verify the resolved model, harness, route, tools, checkout, return path, and relevant quota before dispatch.

## Current access paths

| Entitlement | Current harness | Model access | Current routed use |
| --- | --- | --- | --- |
| Codex subscription | Codex | OpenAI GPT models | Native Codex coordination for harness-owned agents; verified host route for external sessions |
| Claude Code subscription | Claude Code | Anthropic Claude models | Native Claude coordination for harness-owned agents; verified host route for external sessions |
| OpenCode Go | OpenCode | Curated multi-provider model pool centered on open-source models | Foreground `opencode run` for focused one-shot workers; attended Orca terminal as a manual fallback |

## Quota-aware worker routing

Before each implementation-worker selection, inspect current weekly subscription usage through a supported read-only source. In Orca, read [orca.md](runtimes/orca.md) and load `orca-cli`. Outside Orca, load `fuelcheck` when available. Treat unavailable usage as unverified. An unverified branch is a provisional route, not an availability claim; verify it before sustained or parallel worker volume. Do not inspect credential storage or rely on an old UI snapshot.

Apply this tree only after explicit route requests, role eligibility, authorization, review independence, checkout isolation, required tools, and return-path safety. Treat weekly utilization of 80% or more as approaching the limit.

```text
eligible implementation worker
├─ Codex weekly < 80% or Codex usage unverified ─> GPT-5.6 Sol
├─ Codex weekly >= 80%, OpenCode Go weekly < 80% or unverified ─> GLM-5.3-Flash
└─ both weekly >= 80%
   └─ Opus if eligible and available; otherwise next eligible verified route
```

Ignore unused Codex rate-limit reset credits during routing. Derek decides when to spend a reset. After Derek uses one, refresh the usage data and route from the new utilization instead of the prior value or the remaining reset-credit count.

Quota does not make an unsafe route eligible. The GLM branch requires an owned foreground `opencode run` for bounded work or an attended Orca terminal. If the task must run unattended or AFK, or no orchestrator can attend the terminal, skip GLM and choose the next eligible verified route.

## Role defaults

| Role | Preferred target | Practical alternative | Operating reason |
| --- | --- | --- | --- |
| Difficult new orchestration | Fable in Claude Code | Current capable orchestrator | Prefer Fable for ambiguous, high-coordination work. Do not replace an active orchestrator automatically. |
| Normal new orchestration | Opus in Claude Code | GPT-5.6 Sol in Codex | Opus is capable and easy to use natively in Claude Code. |
| Implementation | Apply the quota-aware worker routing above | Opus in Claude Code when both primary routes are constrained | Quota chooses only between models that are already eligible for the task. |
| Bounded chore | Sonnet in Claude Code | Any verified capable worker | Preserve stronger-model capacity. Follow model-profile eligibility for other roles. |
| OpenCode implementation worker | GLM-5.3-Flash through a foreground `opencode run` for one-shot work | GLM through an attended Orca terminal; DeepSeek V4 Flash through a foreground `opencode run` for bounded one-shot work only after explicit data-location approval | Use GLM for stronger work. Use DeepSeek for much cheaper bounded implementation. Do not detach the CLI or treat the current Orca route as AFK-capable. |
| Review of Claude work | GPT-5.6 Sol through a verified Codex route | A different reviewer-eligible Claude model, or GLM-5.3-Flash through a verified OpenCode route | Prefer model and provider diversity. Follow model-profile eligibility. |
| Review of GPT work | Opus through a verified Claude route | Fable, then GLM-5.3-Flash through a verified OpenCode route, then a fresh independent GPT session for R1 only | Use the first reviewer-eligible different-model route. A same-model GPT fallback is R1, or `PARTIAL` when R2 was required. |
| R2 review | A different model from the implementer | Same-provider different model | Prefer a different provider, but do not require it. |
| Frontend or image specialist | Verify the current Antigravity route and model | Best available proven specialist | Use only when current tools prove the required capability. |

## Review routes

Choose by review shape, not a fixed product order.

| Starting harness and need | Preferred route | Notes |
| --- | --- | --- |
| Claude Code; local Git diff review | Installed Codex plugin review command | Use its normal or adversarial review path. Verify the resolved Codex model. |
| Claude Code; custom one-shot critique | `counsel` to Codex | Use a fresh, focused prompt and inspect the returned artifact. |
| Codex; custom one-shot critique | Use the deep `counsel` profile after its target-verification step | The deep profile selected Opus when last verified. Do not use a profile that resolves to Sonnet for review. |
| Either harness; focused GLM-5.3-Flash review | Foreground `opencode run` | Verify the exact executable, model, checkout when repository access is needed, independence, process ownership, structured result, and return contract. Use an isolated directory when the reviewer only needs a supplied review packet. |
| Either harness; R1 fallback | Fresh native independent subagent on a reviewer-eligible model | The same model is allowed for R1 only when its model profile permits review. Keep the reviewer read-only. |
| Either harness; visible, interactive, multi-round, or AFK review | Orca-managed external session | Use a verified terminal, checkout, mailbox, and return path. For OpenCode, the current Orca route is an attended manual fallback, not an AFK route. |
| T3 top-level provider thread control | Only a route exposed and verified by the current tool inventory | Browser preview tools do not provide agent routing. A provider CLI launched by the hosted harness is a separate route. |

Use a foreground `opencode run` for focused one-shot OpenCode work. Use Orca as an attended manual OpenCode fallback until a version-matched route proves prompt delivery and completion reporting. Do not pay its setup cost when a proven lighter route satisfies the return contract.

Preserve scarce Fable capacity for difficult orchestration. Use the simplest proven route that fits the work shape. Prefer high effort for frontier models as a starting point. Spend more only when representative work shows a useful quality gain. Use the smallest capable model for passive watchers and bounded observation roles.
