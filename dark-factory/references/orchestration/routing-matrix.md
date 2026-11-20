# Operating routing matrix

These are Derek's current operating preferences. They combine model capability, available subscriptions, route friction, and quota. They are not a pure intelligence ranking. The orchestrator owns model, effort, harness, route, and quota selection and verifies the resolved route, tools, checkout, and return path.

## Current defaults

Model versions are named only here and in [model profiles](model-profiles.md); every other file names the role. A row that names another row's model follows that row.

| Role | Model and effort | Harness or route | Id to pass | Since |
| --- | --- | --- | --- | --- |
| Codex orchestrator; default Codex implementer; Codex research and web-search worker | GPT-6.2 Sol, high | Codex | `gpt-6.2-sol`; verify the resolved id at dispatch | 2026-11-20 |
| Claude Code orchestrator and subagents: research, web search, implementation when delegated routes are constrained | Claude Opus 5.5, high | Claude Code | `opus` only when it resolves to `claude-opus-5-5`; verify at dispatch | 2026-09-23; high effort 2026-11-19 |
| Ordinary bounded implementation; OpenCode worker and reviewer; preferred repository and supplied-material research | GLM-5.3-Flash; effort not standardized | OpenCode Go: foreground `opencode run`, or an attended Orca terminal; never unattended or AFK | `opencode-go/glm-5.3-flash`; verify at dispatch; never substitute GLM-5.3 | 2026-09-05 |
| Bounded chore | DeepSeek V4.1 Flash; a supported effort chosen per task | OpenCode Go: foreground `opencode run`, with current data-location consent verified | `opencode-go/deepseek-v4.1-flash`; verify the resolved id at dispatch | 2026-11-19 |
| Claude Code bounded implementation or chore fallback; never a reviewer | Claude Sonnet 5.5; current default effort | Claude Code | `sonnet` only when it resolves to `claude-sonnet-5-5`; verify at dispatch | 2026-11-19 |
| Review of Claude work | The Codex, Claude Code, or ordinary bounded implementation model, chosen by quota balancing | A verified Codex, Claude, or OpenCode route | From that model's row | not recorded |
| R2 review of Astra-authored work; apply before the GPT-work row | The Claude Code model, at max | A verified Claude route; a fresh read-only session | From that model's row | 2026-09-06 |
| Review of GPT work | The Claude Code, Codex, or ordinary bounded implementation model, chosen by quota balancing | A verified Claude, Codex, or OpenCode route | From that model's row | not recorded |
| Specialist only: important review or judging, bounded repo audit, stalled-worker takeover, a specifically identified difficult implementation scope | GPT-6.2 Astra; high, targeted xhigh; medium only on explicit request or for that implementation scope | Codex, verified route | `gpt-6.2-astra`; verify at dispatch | 2026-11-20 |
| Stalled-worker takeover | The specialist model, high or xhigh | Codex, verified route | From the specialist row | 2026-09-09 |
| Bounded repo audit | The specialist model, high; targeted xhigh | Codex, verified route | From the specialist row | 2026-09-09 |
| Scarce judgment only: reviewer or judge escalation, an owner-authorized orchestrator handoff or takeover | Claude Fable 5.2; high | Claude Code | `fable` only when it resolves to `claude-fable-5-2`; verify at dispatch | 2026-11-19 |
| Bounded-trial candidates: neither reviewers nor proven defaults | GPT-6 Luna at explicit max; the bounded-chore model for other bounded implementation | Codex for Luna (verify any OpenCode Go offering); the bounded-chore route | `gpt-6-luna`; verify at dispatch | 2026-09-10; Luna version 2026-09-23 |
| Frontend or image specialist | Verify the current Antigravity route and model | Verify at dispatch | Verify at dispatch | not recorded |
| Retired: not dispatched for new work | Opus 5, GPT-5.6; never fall back to them silently | None | None | not recorded |
| Not defaults | Kimi and DeepSeek Pro, under [model profiles](model-profiles.md#dated-preference-notes-2026-09-05) | None | None | 2026-09-05 |

### When a model changes

1. Edit the one row that names the model: model and effort, id, and "since" date.
2. Add a dated line to [default history](model-profiles.md#default-history): the change, the reason, and who decided.
3. The new version starts unranked under [model profiles](model-profiles.md#new-versions-start-unranked).

## Current access paths

| Entitlement | Current harness | Model access | Current routed use |
| --- | --- | --- | --- |
| Codex subscription | Codex | OpenAI GPT models | Native Codex coordination for harness-owned agents; verified host route for external sessions |
| Claude Code subscription | Claude Code | Anthropic Claude models | Native Claude coordination for harness-owned agents; verified host route for external sessions |
| OpenCode Go | OpenCode | Curated multi-provider model pool centered on open-source models | OpenCode workers and reviewers; route rules in [opencode.md](runtimes/opencode.md) |

## Quota-aware worker routing

Every dispatch decision requires sufficiently fresh relevant entitlement evidence. Before you refresh quota or admit sustained or parallel volume, read [capacity policy](../capacity-and-fleet.md#pluggable-quota-observations): it owns adapters, freshness, unknown data, reserves, and pacing. Banked reset credits are not current quota; redemption requires owner direction under [capacity policy](../capacity-and-fleet.md#timed-sprint-and-resets).

Apply this balancing after explicit route requests, role eligibility, authorization, data consent, review independence, checkout isolation, required tools, and return-path safety. Quota never makes an unsafe route eligible. If an explicitly requested route cannot run, report the limit rather than silently substituting.

- Apply Derek's role defaults among sufficient eligible options with adequate headroom. Rebalance when material capacity constraints, reset timing, or upcoming demand justify another eligible route. Preserve Opus capacity when it is in use elsewhere. Abundant Codex remains useful for suitable coding and review.
- There is no mandatory spend order, fixed equal split, or cheapest-at-any-cost rule. Low utilization on one plan does not obligate spending it first.
- Role defaults are conditional on actual remaining budget and reset timing. When Codex is near or at its limit without headroom for the expected work, route new ordinary workers to a sufficient authorized Claude model — Opus, or Sonnet for implementation only — or to an OpenCode Go option with actual quota; native or default convenience is not a reason to keep spawning Codex workers. Apply the configured per-entitlement/pool interactive reserve and current sprint expiry under [capacity policy](../capacity-and-fleet.md); judge additional task headroom against expected work and reset timing. An unset reserve is unconfigured, not zero.
- For Claude, check both the shared pool and the model-specific pool.
- Track the entitlement a route actually consumes, not the model's provider: A model served through OpenCode Go consumes OpenCode Go allowance, while the same model in Codex consumes Codex allowance. Verify the model is actually offered on each route.
- Consider eligible ordinary-bounded-implementation workers proactively whenever spare OpenCode Go capacity exists, including when Codex is healthy.
- Also consider the bounded-trial candidates. Trial eligibility is not established production quality and never lowers acceptance or review requirements.

Classify difficulty by coherent work phase or slice, not by the whole ticket; model and effort may vary by phase: retain strong judgment on orchestration, planning, and undecided or difficult work, and route decided implementation to a sufficient implementer. Prefer the eligible ordinary bounded implementation default for bounded implementation and for repository or supplied-material research. Skipping it needs a concrete capability, tool, quota, route, or coupling/overhead reason; native convenience alone is insufficient. Choosing a bounded-trial candidate for its task fit and verified quota opportunity is such a reason for that trial.

Separate web search and source discovery from repository and supplied-material research. For web work, prefer Codex or Claude sessions with verified hosted search tools — a dated user preference, not a provider-superiority claim. OpenCode remains eligible for repository investigation and supplied documents. Tools do not inherit across routes: a route without a verified required search tool stays unavailable for that web work. The OpenCode foreground and AFK restrictions still apply.

## Role defaults

Alternatives and dispatch conditions for each role in [current defaults](#current-defaults). A family name (Sol, Opus, GLM, DeepSeek, Sonnet, Astra, Fable, Luna) means the version that table names.

| Role | Practical alternative | Conditions |
| --- | --- | --- |
| New orchestration | The explicitly user-selected capable orchestrator | The normal orchestrator roles are provisional for these versions. Neither Astra nor Fable is an automatic orchestration default or quota fallback. Keep explicit user choices and the active orchestrator intact. |
| Difficult orchestration escalation | Ask Derek to authorize a full handoff to Astra or Fable | Keep the active orchestrator (normally Sol or Opus); request bounded Astra or Fable judgment when concretely needed. Prefer a focused adviser over transferring ownership. Apply specialist review/judgment criteria, quota and required tools. Difficulty alone does not authorize replacing the orchestrator; the root skill owns explicit approval and capability-loss handoffs. |
| Implementation | The default Codex implementer within Codex; Opus in Claude Code when delegated routes are constrained; Astra only for an explicit request or a specifically identified difficult implementation scope | Prefer the ordinary bounded implementation default when sufficient, authorized, and route/quota eligible; recheck its sufficiency against the task rather than assuming a ranking. For the Astra exception, state the concrete unresolved problem, bounded scope, evidence, and stop contract; a whole-ticket complexity label or generic quality preference is insufficient. |
| Bounded chore | The ordinary bounded implementation default or Sonnet in Claude Code; any verified capable worker otherwise | For small, clear, readily verifiable implementation and chore tasks, when eligible. Verify current data-location consent state before use. Changing that choice requires Derek's explicit approval; existing approval does not need to be requested again. Never select DeepSeek as reviewer. Follow model-profile eligibility for other roles. Preserve stronger-model capacity. |
| Bounded-trial candidates | The ordinary bounded implementation default, the default Codex implementer at high, or the Claude bounded-chore fallback, under their role rules | Follow [candidate eligibility](model-profiles.md#bounded-worker-candidates): decision-complete, readily verifiable bounded work; actual model/effort, tools, consent, entitlement and return route verified. Local capability remains untested. Neither candidate is reviewer-eligible. |
| OpenCode worker | An attended Orca terminal; the bounded-chore model for bounded one-shot work, with current data-location consent verified | Route rules: [opencode.md](runtimes/opencode.md). Verify the exact resolved model before dispatch. |
| Web search and source discovery | The ordinary bounded implementation default where its route verifies hosted search tools; another justified research-capable worker with verified hosted search tools | Apply the web-research rule above. Ordinary research is not Fable work by default. |
| Repository and supplied-material research | Another justified research-capable worker | Choose by evidence, tools, and quota under the phase rules above. Ordinary research is not Fable work by default. |
| Review of Claude work | Another existing reviewer-eligible model, including a different reviewer-eligible Claude model or fresh Astra high for important work | Preserve existing sufficient reviewer options. [review-policy.md](review-policy.md) owns sufficiency, independence, and Fable escalation. |
| R2 review of Astra-authored work | Another sufficient reviewer-eligible different model; fresh Astra high can add useful same-model review but cannot satisfy this gate | Applies before generic GPT choices. [review-policy.md](review-policy.md#select-a-sufficient-reviewer) owns the gate; unavailable Opus or lower quota alone never triggers Fable. |
| Review of GPT work | A fresh independent session on another existing reviewer-eligible model, including Astra high for important work authored by another model | Apply the Astra R2 row first. [review-policy.md](review-policy.md) owns sufficiency, escalation, and unavailable-route blocking. |
| Reviewer or judge escalation | The strongest sufficient reviewer-eligible model that keeps required independence | Fable only for a concrete unresolved critical correctness question, conflicting evidence, or demonstrated need for stronger judgment; Astra when useful for difficult review. [review-policy.md](review-policy.md) owns the criteria. |
| Stalled-worker takeover | Fable, only when Derek explicitly authorizes it for that takeover | [worker-takeover.md](worker-takeover.md) owns the effort choice and the no-silent-substitution rule. |
| Bounded repo audit | No default substitute | [repo-audit.md](patterns/repo-audit.md) owns effort, report-only scope, and no fanout. |
| Frontend or image specialist | Best available proven specialist | Use only when current tools prove the required capability. |

## Review routes

Choose by review shape, not a fixed product order.

| Starting harness and need | Preferred route | Notes |
| --- | --- | --- |
| Claude Code; local Git diff review | Installed Codex plugin review command | Use its normal or adversarial review path. Verify the resolved Codex model. |
| Claude Code; custom one-shot critique | `counsel` to Codex | Use a fresh, focused prompt and inspect the returned artifact. |
| Codex; custom one-shot critique | Use the deep `counsel` profile after verifying its target with `--dry-run` | Verify it resolves to the model and effort of the Astra R2 row, not just the profile name. Do not use a profile that resolves to Sonnet for review. |
| Either harness; focused OpenCode review | Foreground `opencode run` | Verify the exact executable, model, checkout when repository access is needed, independence, process ownership, structured result, and return contract. Use an isolated directory when the reviewer only needs a supplied review packet. |
| Either harness; R1 fallback | Fresh native independent subagent on a reviewer-eligible model | In Claude Code, only when the preferred route is unavailable; in Codex, when a different model is unavailable. The same model is allowed for R1 only when its model profile permits review. Keep the reviewer read-only. |
| Either harness; visible, interactive, multi-round, or AFK review | Orca-managed external session | Use a verified terminal, checkout, mailbox, and return path. OpenCode limits: [opencode.md](runtimes/opencode.md). |

Verify actual model/effort support and the reported selection at dispatch. If unavailable or unsupported, report the limit: no silent downshift, user-setting change, or automatic Fable spend. Match other effort choices to task uncertainty, complexity, and evidence. Scope, verification requirements, budgets, and stop conditions still apply. Reviewer eligibility and sufficiency override cheap or default implementer choices. Use the smallest capable model for passive watchers and bounded observation roles.
