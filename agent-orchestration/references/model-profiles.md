# Dated model observations

Last reviewed: 2026-09-10 for bounded-worker candidates; capability evidence retains its stated dates.

These are Derek's observed working defaults. They are not vendor claims, universal rankings, or permanent truths. Keep capability judgments separate from quota, route convenience, and other operating preferences.

Attach each observation to the exact model version, harness, effort, task class, date, and evidence when available. A routing alias may resolve to a newer model. When it does, mark the old observation stale instead of inheriting its ranking.

Assess these dimensions separately:

- Orchestration, intent, and synthesis.
- Implementation quality.
- Self-correction after implementation.
- Fresh independent review of another agent's work.
- Tool use and persistence.

Do not infer fresh-review quality from self-correction quality.

The evidence comes from Derek's project work and explicit operating judgments through 2026-09-10, not a formal benchmark. Keep only material per-model differences below.

| Originating provider | Exact model observed | Routing alias or model ID | Conditions | Observed strengths | Observed limits | Current role fit | Evidence and confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OpenAI | GPT-5.6 Sol | `gpt-5.6-sol` (current local model ID; verify the resolved model at dispatch) | Codex; high effort for normal workers | Slightly stronger overall than Opus in Derek's use; strong implementation and self-correction; strong fresh reviewer | Still requires independent review when R1 or R2 applies. Derek observes overscoping and excess persistence (2026-09-05): bind scope and stop rules in every dispatch and do not delegate open-ended authority | Default normal Codex implementation and research worker at high effort; strong eligible reviewer under tight scope and stop rules, not the default primary reviewer of important Astra work | Repeated implementation and review; overscoping observed by Derek, 2026-09-05; high confidence. Worker default restored by Derek on 2026-09-08, not measured savings |
| OpenAI | GPT-6 Astra | `gpt-6-astra` (verify the resolved model at dispatch) | Codex; the 2026-09-06 medium worker default was superseded on 2026-09-08; 2026-09-09 preferences use high for bounded repo audit and important review, targeted xhigh escalation, and conditional high/xhigh takeover | Roughly Fable-level strength in Derek's judgment; strong computer use; strong scope and boundary judgment; coding quality close to Fable | Derek reports excessive weekly Codex allowance consumption from routine medium workers (2026-09-08). No measured savings comparison or verified pricing | Not the routine Codex worker default; medium remains available for explicit requests or justified exceptions. Orchestrator and judge; preferred new-orchestration alternative when Fable capacity runs out. Conditional high/xhigh takeover worker under [worker-takeover.md](worker-takeover.md); sole bounded [audit-repo](patterns/repo-audit.md) auditor and fresh reviewer at high by default, with targeted xhigh under the audit and [review policies](review-policy.md); never displaces a healthy active orchestrator | Derek's capability judgment, 2026-09-05, medium confidence; worker reversion (2026-09-08) and specialist effort choices (2026-09-09) are Derek's operating preferences, not new capability rankings or measured quality/savings comparisons |
| Anthropic | Claude Fable 5 | `fable` | Claude Code; high effort | Strongest current choice for difficult orchestration, intent, and synthesis; somewhat better code sense (Derek, 2026-09-05) | Weaker self-correction than GPT-5.6 Sol; do not infer weak fresh review from this | Preferred difficult-project orchestrator; scarce difficult judgment. Review is escalation-only under [review-policy.md](review-policy.md), with required independence intact | High confidence for orchestration through 2026-09-05; fresh review is less tested |
| Anthropic | Claude Opus 5 | `opus` (verify actual Opus 5 selection) | Claude Code; historical observations at high effort; max selected 2026-09-06 specifically for Astra-authored R2 review | Close to GPT-5.6 Sol overall; capable orchestration, implementation, and fresh review | Slightly behind GPT-5.6 Sol overall in Derek's historical judgment; max review quality is not locally benchmarked and does not establish Fable equivalence | Normal-project orchestrator; ordinary research, implementation, and eligible review. Default cross-model R2 reviewer for Astra work at max only when independently capable of assessing critical risks and route/quota eligible; preserve its quota | Repeated orchestration, implementation, and review; high confidence in historical observations. Max role is a dated user preference, not measured superiority |
| Anthropic | Claude Sonnet 5 | `sonnet` | Claude Code; current default effort | Useful for bounded implementation and chore work | Not strong enough for review in Derek's current use | Bounded implementer or chore worker only; never select as reviewer | Bounded work and review attempts; high confidence in the reviewer exclusion |
| Z.ai | GLM-5.3-Flash | `opencode-go/glm-5.3-flash` | OpenCode 1.18.25 with OpenCode Go; effort not yet standardized | Below GPT-5.6 Sol and Opus, but not far behind in Derek's current judgment; capable implementation and fresh review | Less capable than the current frontier defaults. GLM-5.3 (non-Flash) is a different, untested configuration; do not silently substitute it or inherit Flash evidence | Cost-efficient implementer and eligible independent reviewer; Derek's preferred default for ordinary bounded work when sufficient, authorized, and route/quota eligible — a capability, price, and allowance judgment, not a benchmark ranking | Derek's current operating judgment and 2026-09-05 default preference; medium confidence |
| DeepSeek | DeepSeek V4 Flash | `opencode-go/deepseek-v4-flash` | OpenCode 1.18.25 with OpenCode Go; effort not yet standardized; a data-location consent gate was observed on 2026-08-28 | Implementation quality comparable to Sonnet and possibly stronger in Derek's current judgment | Not approved for fresh review. Verify current consent state through the supported route; changing the account's data-location choice requires Derek's explicit approval. A routing preference does not change that choice | Preferred for small, clear, readily verifiable implementation and chore tasks when eligible, falling back to GLM-5.3-Flash or Sonnet; otherwise cost-efficient implementer or chore worker only; never select as reviewer | Derek's current operating judgment and 2026-09-05 chore preference; medium confidence |

Mark any other model or materially changed version as `untested` until representative work supplies evidence. Newly listed OpenCode Go models start untested; only representative work changes that. The explicitly approved bounded trials below may proceed without claiming prior operational validation. Record vendor-documented context, tools, or aliases as facts, but do not convert marketing claims into a capability ranking.

## Bounded-worker candidates, 2026-09-10

Derek requested proactive consideration of these cost-conscious candidates. Use them for small, decision-complete implementation or chore tasks with clear acceptance checks, bounded ownership and a stop contract. They remain locally untested until representative work provides evidence; do not require an unrelated benchmark run before every bounded trial. Keep GLM-5.3-Flash as the ordinary bounded implementation preference and Sol high as the normal Codex worker default. Required independent review still uses an existing sufficient eligible reviewer; neither candidate is approved as a reviewer. Record the actual model, route, effort, result, verification, and material rework in the task handoff; do not silently promote a default or edit shared profiles after a single success.

| Candidate | Catalog and documentation evidence | Bounded use and limits |
| --- | --- | --- |
| DeepSeek V4.1 Flash | OpenCode 1.18.30 refreshed catalog on 2026-09-10 resolves `opencode-go/deepseek-flash` to DeepSeek V4.1 Flash, with image input, tool calling, and low/high/max variants; [OpenCode Go documentation](https://opencode.ai/docs/go/) lists the model and gateway ID | Consider bounded implementation/chore trials, including supplied-image interpretation where relevant. Select and record an actually supported effort for the task; no standardized default or measured local quality/savings yet. Verify current data-location consent before use; changing consent requires Derek's explicit approval. The previous DeepSeek reviewer exclusion remains. |
| GPT-5.6 Luna at max | [Official OpenAI documentation](https://developers.openai.com/api/docs/models/gpt-5.6-luna) supports max. The refreshed OpenCode catalog lists `opencode-go/gpt-5.6-luna` with max; Codex uses `gpt-5.6-luna` when its serving route verifies max | Consider bounded implementation/chore trials at explicit max effort through an eligible Codex or OpenCode Go route, balancing the actual entitlement consumed. Do not silently map max to high/xhigh or inherit the orchestrator's effort. Prior benchmark evidence below is dated, not local quality or allowance proof. |

DeepSeek V4.1 Flash is a new configuration: do not inherit V4 Flash's implementation ranking or silently use `deepseek-v4-flash` or `deepseek-v4-flash-vision-exp` as substitutes. Resolve the current model behind each alias; a remapped alias makes the old evidence stale. The V4 row above is historical evidence for that exact version, not proof that it remains served unchanged. Vision metadata establishes advertised image-input support, not tested screenshot accuracy, hosted web search, or a usable browser/desktop adapter. Live UI work still requires `computer-use-routing` and executing-session readiness. Both OpenCode candidates retain the owned-foreground/attended-route restrictions; new models or bonus quota do not make that route AFK-capable.

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

- **GPT-5.6 Luna (max effort)** was a benchmark-supported implementation candidate, not a locally validated profile. Derek explicitly approved proactive bounded-worker consideration on 2026-09-10 under the candidate policy above; it remains untested and does not replace current role defaults or gain reviewer eligibility.
- **Kimi (family-level note; no exact version verified):** Derek judges capability good but the allowance scarce, so reserve it for justified specialist needs. Verify the exact version, effort, task evidence, and the actual entitlement pool before routing. Do not invent per-model quota and do not grant reviewer eligibility automatically.
- **DeepSeek Pro:** no routine routing. Derek currently judges its value insufficient for the cost — a value judgment, not a claim about intelligence.

Fable and Astra price parity is a Derek-reported operating assumption (2026-09-05), not verified pricing. Never invent prices.

## Dated capability support, 2026-09-06

Sources and local observations verified on 2026-09-06: [OpenAI Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra) supports medium/xhigh. Local Codex 0.153.4 model metadata lists `gpt-6-astra` with medium as its default and `gpt-5.6-sol` with display name GPT-5.6-Sol; these are dispatch identifiers, not new benchmark evidence. [Anthropic effort documentation](https://platform.claude.com/docs/en/build-with-claude/effort) supports Opus 5 max and warns that it permits unconstrained token spending; local Claude Code 2.1.263 help lists max. These establish capability support, not measured task quality, review sufficiency, or subscription savings. API prices and costs do not establish allowance consumption. [Routing-matrix.md](routing-matrix.md) owns dispatch-time support/selection checks and quota rules; budgets and stop conditions still apply at max.

During normal project work, report a profile-update candidate only when a run materially contradicts or strengthens a current observation. Do not edit this shared file unless the task explicitly includes skill maintenance.
