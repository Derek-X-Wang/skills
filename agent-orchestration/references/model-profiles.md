# Dated model observations

Last reviewed: 2026-09-05.

These are Derek's observed working defaults. They are not vendor claims, universal rankings, or permanent truths. Keep capability judgments separate from quota, route convenience, and other operating preferences.

Attach each observation to the exact model version, harness, effort, task class, date, and evidence when available. A routing alias may resolve to a newer model. When it does, mark the old observation stale instead of inheriting its ranking.

Assess these dimensions separately:

- Orchestration, intent, and synthesis.
- Implementation quality.
- Self-correction after implementation.
- Fresh independent review of another agent's work.
- Tool use and persistence.

Do not infer fresh-review quality from self-correction quality.

The evidence comes from Derek's project work and explicit operating judgments through 2026-09-05, not a formal benchmark. Keep only material per-model differences below.

| Originating provider | Exact model observed | Routing alias or model ID | Conditions | Observed strengths | Observed limits | Current role fit | Evidence and confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OpenAI | GPT-5.6 Sol | `gpt-5.6` | Codex; high or higher effort | Slightly stronger overall than Opus in Derek's use; strong implementation and self-correction; strong fresh reviewer | Still requires independent review when R1 or R2 applies. Derek observes overscoping and excess persistence (2026-09-05): bind scope and stop rules in every dispatch and do not delegate open-ended authority | Trusted default implementer within Codex; the stronger coding fallback outside it; strong reviewer under tight scope and stop rules | Repeated implementation and review; overscoping observed by Derek, 2026-09-05; high confidence |
| OpenAI | GPT-6 Astra | `gpt-6-astra` (advertised native ID; verify the resolved model at dispatch) | Effort not empirically specified | Roughly Fable-level strength in Derek's judgment; strong computer use; strong scope and boundary judgment; coding quality close to Fable | Not benchmark-tested; effort not empirically specified; no verified pricing | Orchestrator and judging/reviewer role; preferred alternative for new orchestration when Fable capacity runs out; never used to displace a healthy active orchestrator | Derek's explicit operating judgment, 2026-09-05; medium confidence |
| Anthropic | Claude Fable 5 | `fable` | Claude Code; high effort | Strongest current choice for difficult orchestration, intent, and synthesis; somewhat better code sense (Derek, 2026-09-05) | Weaker self-correction than GPT-5.6 Sol; do not infer weak fresh review from this | Preferred difficult-project orchestrator; reserve mostly for orchestration and difficult judgments; valid R1 or R2 reviewer when it differs from the implementer | High confidence for orchestration through 2026-09-05; fresh review is less tested |
| Anthropic | Claude Opus 5 | `opus` | Claude Code; high effort | Close to GPT-5.6 Sol overall; capable orchestration, implementation, and fresh review | Slightly behind GPT-5.6 Sol overall in Derek's current judgment | Normal-project orchestrator; sufficient for ordinary research, implementation, and review; preferred Anthropic R2 reviewer; preserve its quota for that work | Repeated orchestration, implementation, and review; high confidence |
| Anthropic | Claude Sonnet 5 | `sonnet` | Claude Code; current default effort | Useful for bounded implementation and chore work | Not strong enough for review in Derek's current use | Bounded implementer or chore worker only; never select as reviewer | Bounded work and review attempts; high confidence in the reviewer exclusion |
| Z.ai | GLM-5.3-Flash | `opencode-go/glm-5.3-flash` | OpenCode 1.18.25 with OpenCode Go; effort not yet standardized | Below GPT-5.6 Sol and Opus, but not far behind in Derek's current judgment; capable implementation and fresh review | Less capable than the current frontier defaults. GLM-5.3 (non-Flash) is a different, untested configuration; do not silently substitute it or inherit Flash evidence | Cost-efficient implementer and eligible independent reviewer; Derek's preferred default for ordinary bounded work when sufficient, authorized, and route/quota eligible — a capability, price, and allowance judgment, not a benchmark ranking | Derek's current operating judgment and 2026-09-05 default preference; medium confidence |
| DeepSeek | DeepSeek V4 Flash | `opencode-go/deepseek-v4-flash` | OpenCode 1.18.25 with OpenCode Go; effort not yet standardized; a data-location consent gate was observed on 2026-08-28 | Implementation quality comparable to Sonnet and possibly stronger in Derek's current judgment | Not approved for fresh review. Verify current consent state through the supported route; changing the account's data-location choice requires Derek's explicit approval. A routing preference does not change that choice | Preferred for small, clear, readily verifiable implementation and chore tasks when eligible, falling back to GLM-5.3-Flash or Sonnet; otherwise cost-efficient implementer or chore worker only; never select as reviewer | Derek's current operating judgment and 2026-09-05 chore preference; medium confidence |

Mark any other model or materially changed version as `untested` until representative work supplies evidence. Newly listed OpenCode Go models start untested; only representative work changes that. Record vendor-documented context, tools, or aliases as facts, but do not convert marketing claims into a capability ranking.

## DeepSWE evidence use

Use DeepSWE on demand, not reflexively: consult or refresh its dated source evidence when an unfamiliar model or configuration, stale evidence, or an uncertain decision warrants a refresh, and skip it for routine or trivial dispatches. Official board: https://deepswe.datacurve.ai/. Methodology: https://deepswe.datacurve.ai/blog/deepswe.

- Preserve the benchmark version, exact model, effort, harness, date, and stated uncertainty with every figure. Effort labels are exact source configurations; verify the actual serving harness supports the value and do not translate max/xhigh/high across harnesses by guesswork.
- A DeepSWE long-horizon implementation score in mini-swe-agent is not proof of local-harness implementation quality, tiny chores, routine research, review, orchestration, or computer use. Benchmark dollar cost is not subscription quota usage.
- Qualitative source claims stay attached to the exact evaluated version, not to all descendants.

Sparse comparison figures inspected on the official board on 2026-09-05 (board updated 2026-09-03; DeepSWE v1.1, 113 tasks, max effort, mini-swe-agent harness):

- GPT-5.6 Sol[max]: 73% ±3.
- GPT-5.6 Luna[max]: 67% ±4.
- GLM-5.3-Flash[max]: 63% ±4.

These are candidate comparison points only. Do not import the whole leaderboard and do not mix GLM-5.3-Flash figures with GLM-5.3.

## Dated preference notes, 2026-09-05

- **GPT-5.6 Luna (max effort)** is a benchmark-supported implementation candidate, not a locally validated profile. It stays `untested` under the rule above and does not replace Sol as a default. A bounded representative trial could establish implementation eligibility; do not use it as a required independent reviewer until review-specific evidence and eligibility exist.
- **Kimi (family-level note; no exact version verified):** Derek judges capability good but the allowance scarce, so reserve it for justified specialist needs. Verify the exact version, effort, task evidence, and the actual entitlement pool before routing. Do not invent per-model quota and do not grant reviewer eligibility automatically.
- **DeepSeek Pro:** no routine routing. Derek currently judges its value insufficient for the cost — a value judgment, not a claim about intelligence.

Fable and Astra price parity is a Derek-reported operating assumption (2026-09-05), not verified pricing. Never invent prices.

During normal project work, report a profile-update candidate only when a run materially contradicts or strengthens a current observation. Do not edit this shared file unless the task explicitly includes skill maintenance.
