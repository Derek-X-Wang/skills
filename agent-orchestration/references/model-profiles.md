# Dated model observations

Last reviewed: 2026-08-28.

These are Derek's observed working defaults. They are not vendor claims, universal rankings, or permanent truths. Keep capability judgments separate from quota, route convenience, and other operating preferences.

Attach each observation to the exact model version, harness, effort, task class, date, and evidence when available. A routing alias may resolve to a newer model. When it does, mark the old observation stale instead of inheriting its ranking.

Assess these dimensions separately:

- Orchestration, intent, and synthesis.
- Implementation quality.
- Self-correction after implementation.
- Fresh independent review of another agent's work.
- Tool use and persistence.

Do not infer fresh-review quality from self-correction quality.

The evidence comes from Derek's project work and explicit operating judgments through 2026-08-28, not a formal benchmark. Keep only material per-model differences below.

| Originating provider | Exact model observed | Routing alias or model ID | Conditions | Observed strengths | Observed limits | Current role fit | Evidence and confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OpenAI | GPT-5.6 Sol | `gpt-5.6` | Codex; high or higher effort | Slightly stronger overall than Opus in Derek's use; strong implementation and self-correction; strong fresh reviewer | Still requires independent review when R1 or R2 applies | Default implementer; strong reviewer; capable orchestrator | Repeated implementation and review; high confidence |
| Anthropic | Claude Fable 5 | `fable` | Claude Code; high effort | Strongest current choice for difficult orchestration, intent, and synthesis | Weaker self-correction than GPT-5.6 Sol; do not infer weak fresh review from this | Difficult-project orchestrator; valid R1 or R2 reviewer when it differs from the implementer | High confidence for orchestration; fresh review is less tested |
| Anthropic | Claude Opus 5 | `opus` | Claude Code; high effort | Close to GPT-5.6 Sol overall; capable orchestration, implementation, and fresh review | Slightly behind GPT-5.6 Sol overall in Derek's current judgment | Normal-project orchestrator; capable implementer; preferred Anthropic R2 reviewer | Repeated orchestration, implementation, and review; high confidence |
| Anthropic | Claude Sonnet 5 | `sonnet` | Claude Code; current default effort | Useful for bounded implementation and chore work | Not strong enough for review in Derek's current use | Bounded implementer or chore worker only; never select as reviewer | Bounded work and review attempts; high confidence in the reviewer exclusion |
| Z.ai | GLM-5.3-Flash | `opencode-go/glm-5.3-flash` | OpenCode 1.18.25 with OpenCode Go; effort not yet standardized | Below GPT-5.6 Sol and Opus, but not far behind in Derek's current judgment; capable implementation and fresh review | Less capable than the current frontier defaults | Cost-efficient implementer; eligible independent reviewer | Derek's current operating judgment; medium confidence |
| DeepSeek | DeepSeek V4 Flash | `opencode-go/deepseek-v4-flash` | OpenCode 1.18.25 with OpenCode Go; effort not yet standardized | Implementation quality comparable to Sonnet and possibly stronger in Derek's current judgment | Not approved for fresh review | Cost-efficient implementer or chore worker only; never select as reviewer | Derek's current operating judgment; medium confidence |

Mark any other model or materially changed version as `untested` until representative work supplies evidence. Record vendor-documented context, tools, or aliases as facts, but do not convert marketing claims into a capability ranking.

During normal project work, report a profile-update candidate only when a run materially contradicts or strengthens a current observation. Do not edit this shared file unless the task explicitly includes skill maintenance.
