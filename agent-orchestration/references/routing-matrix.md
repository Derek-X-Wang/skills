# Operating routing matrix

Last reviewed: 2026-08-28.

These are Derek's current operating preferences. They combine model capability, available subscriptions, route friction, and quota. They are not a pure intelligence ranking. Verify the resolved model, harness, route, tools, checkout, return path, and relevant quota before dispatch.

## Role defaults

| Role | Preferred target | Practical alternative | Operating reason |
| --- | --- | --- | --- |
| Difficult new orchestration | Fable in Claude Code | Current capable orchestrator | Prefer Fable for ambiguous, high-coordination work. Do not replace an active orchestrator automatically. |
| Normal new orchestration | Opus in Claude Code | GPT-5.6 Sol in Codex | Opus is capable and easy to use natively in Claude Code. |
| Implementation | GPT-5.6 Sol in Codex | Opus in Claude Code | GPT-5.6 Sol is slightly stronger in current use, and Derek has more Codex usage. |
| Bounded chore | Sonnet in Claude Code | Any verified capable worker | Preserve stronger-model capacity. Do not use Sonnet for review. |
| Review of Claude work | GPT-5.6 Sol through a verified Codex route | A different capable Claude model, excluding Sonnet | Prefer model and provider diversity. |
| Review of GPT work | Opus through a verified Claude route | Fable, then a fresh independent GPT session for R1 only | Fable is a valid different-model R1 or R2 reviewer. A same-model GPT fallback is R1, or `PARTIAL` when R2 was required. |
| R2 review | A different model from the implementer | Same-provider different model | Prefer a different provider, but do not require it. |
| Frontend or image specialist | Verify the current Antigravity route and model | Best available proven specialist | Use only when current tools prove the required capability. |

## Review routes

Choose by review shape, not a fixed product order.

| Starting harness and need | Preferred route | Notes |
| --- | --- | --- |
| Claude Code; local Git diff review | Installed Codex plugin review command | Use its normal or adversarial review path. Verify the resolved Codex model. |
| Claude Code; custom one-shot critique | `counsel` to Codex | Use a fresh, focused prompt and inspect the returned artifact. |
| Codex; custom one-shot critique | `counsel --from codex --deep` after a confirming `--dry-run` | The deep profile selected Opus when last verified. Do not use a profile that resolves to Sonnet for review. |
| Either harness; R1 fallback | Fresh native independent subagent on an eligible model | The same model is allowed for R1, excluding Sonnet. Keep the reviewer read-only. |
| Either harness; visible, interactive, multi-round, or AFK review | Orca-managed external session | Use a verified terminal, checkout, mailbox, and return path. |
| T3 Code | Only a route exposed and verified by the current tool inventory | Browser preview tools do not provide agent routing. |

Use Orca immediately when the work needs a durable external session. Do not pay its setup cost for a focused one-shot review that a proven lighter route can complete.

Prefer abundant Codex usage for implementation volume and preserve scarce Fable capacity for difficult orchestration. Prefer high effort for frontier models as a starting point. Spend more only when representative work shows a useful quality gain. Use the smallest capable model for passive watchers and bounded observation roles.
