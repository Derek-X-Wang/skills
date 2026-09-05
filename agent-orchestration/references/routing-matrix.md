# Operating routing matrix

Last reviewed: 2026-09-05.

These are Derek's current operating preferences. They combine model capability, available subscriptions, route friction, and quota. They are not a pure intelligence ranking. Verify the resolved model, harness, route, tools, checkout, return path, and relevant quota before dispatch.

## Current access paths

| Entitlement | Current harness | Model access | Current routed use |
| --- | --- | --- | --- |
| Codex subscription | Codex | OpenAI GPT models | Native Codex coordination for harness-owned agents; verified host route for external sessions |
| Claude Code subscription | Claude Code | Anthropic Claude models | Native Claude coordination for harness-owned agents; verified host route for external sessions |
| OpenCode Go | OpenCode | Curated multi-provider model pool centered on open-source models | Foreground `opencode run` for focused one-shot workers; attended Orca terminal as a manual fallback |

## Quota-aware worker routing

Before each implementation, research, or review selection, inspect current subscription usage through Orca's version-matched public account surface whenever the current machine can reach its local Orca CLI and runtime. Use this source even when the session runs in another harness or host UI. Read [orca.md](runtimes/orca.md) and load `orca-cli`. Treat unavailable Orca or missing, stale, or failed provider data as unverified. An unverified branch is a provisional route, not an availability claim; verify it before sustained or parallel worker volume. Do not install or invoke a second quota checker automatically, inspect credential storage, or rely on an old UI snapshot. Use another quota source only when Derek explicitly requests it.

Apply this balancing after explicit route requests, role eligibility, authorization, review independence, checkout isolation, required tools, and return-path safety:

- Check fresh usage at the dispatch decision and reuse it while it stays fresh. Refresh stale or changed data, after resets or rate-limit events, and before sustained volume. Do not blindly poll every child dispatch.
- Compare short-window, weekly, model-specific, and monthly limits together with reset timing, expected task cost and duration, and pool reserves. Percentages from different plans are not equal token budgets.
- There is no mandatory spend order, fixed equal split, or cheapest-at-any-cost rule. Low utilization on one plan does not obligate spending it first.
- Treat unknown usage as unknown. Never assume an entitlement is empty or route to it automatically. A bounded provisional route is allowed; verify before sustained volume.
- Among sufficient eligible options, prefer the one with more spare capacity relative to reset timing and upcoming demand. Reserve Fable and Astra for orchestration and difficult judgment. Preserve Opus capacity when it is in use elsewhere. Abundant Codex remains useful for suitable coding and review.
- Consider eligible OpenCode Go GLM workers proactively whenever spare capacity exists, including when Codex is healthy.
- Quota never makes an unsafe route eligible. Balancing may not bypass authority, required tools, checkout isolation, review independence, or the return path.

The GLM branch requires an owned foreground `opencode run` for bounded work or an attended Orca terminal. If the task must run unattended or AFK, or no orchestrator can attend the terminal, skip GLM and choose the next eligible verified route.

Ignore banked Codex rate-limit reset credits during routing and never claim they are already-available current quota. Derek redeems a reset only by explicit request. After Derek uses one, refresh the usage data and route from the new utilization instead of the prior value or the remaining reset-credit count.

## Role defaults

| Role | Preferred target | Practical alternative | Operating reason |
| --- | --- | --- | --- |
| Difficult new orchestration | Fable in Claude Code | GPT-6 Astra; the current capable orchestrator | Reserve Fable for orchestration and difficult judgment. Astra is the preferred alternative when Fable capacity runs out. Do not automatically replace a healthy active orchestrator. |
| Normal new orchestration | Opus in Claude Code | GPT-5.6 Sol in Codex | Opus is capable and preserves Fable and Astra for difficult work. |
| Routine research | Opus, GLM-5.3-Flash, or GPT-5.6 Sol by evidence, tools, and quota | Any verified research-capable worker | Ordinary research is not Fable or Astra work by default; preserve their capacity for orchestration and judgment. |
| Implementation | Apply the quota balancing above | Opus in Claude Code when delegated routes are constrained | Quota chooses only between models that are already eligible for the task. |
| Bounded chore | Sonnet in Claude Code | Any verified capable worker | Preserve stronger-model capacity. Follow model-profile eligibility for other roles. |
| Complex computer use | A capable session that has loaded `computer-use-routing` | Any eligible local adapter the router approves | Model ability does not prove an adapter exists; `computer-use-routing` owns adapter eligibility and may return `executor_required`. |
| OpenCode implementation worker | GLM-5.3-Flash through a foreground `opencode run` for one-shot work | GLM through an attended Orca terminal; DeepSeek V4 Flash through a foreground `opencode run` for bounded one-shot work only after explicit data-location approval | Use GLM for stronger work. Use DeepSeek for much cheaper bounded implementation. Do not detach the CLI or treat the current Orca route as AFK-capable. |
| Review of Claude work | GPT-5.6 Sol through a verified Codex route, Opus, or GLM-5.3-Flash through a verified OpenCode route, chosen by quota balancing | Another existing reviewer-eligible non-reserved model, including a different reviewer-eligible Claude model | Pick an eligible sufficient Sol, Opus, GLM, or other existing reviewer-eligible non-reserved reviewer by quota balancing. Reserve Fable and Astra for the reviewer or judge escalation row. A different model from the implementer satisfies R2 even on the same provider; prefer a different provider without requiring it. Follow model-profile eligibility. |
| Review of GPT work | Opus through a verified Claude route, GPT-5.6 Sol through a verified Codex route, or GLM-5.3-Flash through a verified OpenCode route, chosen by quota balancing | A fresh independent session on another existing reviewer-eligible non-reserved model | Pick an eligible sufficient Opus, Sol, GLM, or other existing reviewer-eligible non-reserved reviewer by quota balancing. Reserve Fable and Astra for the reviewer or judge escalation row. Independence follows the resolved actual model: a fresh independent session on a different model, including a different reviewer-eligible GPT model, satisfies R2 even on the same provider; only a same-model independent session is R1 fallback, or `PARTIAL` when R2 was required. Follow model-profile eligibility. |
| Reviewer or judge escalation | Fable or GPT-6 Astra when a review shows unresolved difficulty, a failed bounded review, or high uncertainty or impact | The strongest reviewer-eligible model that keeps R2 independence | Escalate the judge only on concrete difficulty or high impact, never by default; keep review eligibility and different-model R2 intact. |
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

Preserve scarce Fable and Astra capacity for orchestration and difficult judgment. Use the simplest proven route that fits the work shape. Prefer high effort for frontier models as a starting point. Spend more only when representative work shows a useful quality gain. Use the smallest capable model for passive watchers and bounded observation roles.
