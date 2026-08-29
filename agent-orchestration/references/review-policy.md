# Review policy

Use review to add independent evidence. Do not count implementer self-checks as review.

## Define independence

- **Independent review:** A different session or agent that did not implement the reviewed scope. The same model is allowed.
- **Cross-model review:** An independent reviewer uses a different model from the implementer.
- **Cross-provider review:** An independent reviewer also uses a different model provider. Prefer this when practical, but do not require it.

Classify the review from the actual implementer and reviewer models. A harness, host, control plane, or route does not change the classification.

## Select the budget

Choose from impact and uncertainty, not diff size or implementation effort.

| Budget | Use when | Requirement |
| --- | --- | --- |
| R0 | The change is obvious, low-risk, easy to reverse, and has no meaningful contract or behavior change | No independent review |
| R1 | The change has normal, bounded code or behavior risk | One independent reviewer; prefer a different model and, when practical, a different provider |
| R2 | The change affects security, authorization, payments, production data, migrations, public contracts, infrastructure, broad architecture, or carries high uncertainty | One independent cross-model reviewer; prefer a different provider |

For human-only R2 work, use two independent reviewers on different models. For mixed-authorship R2 work, also use two independent reviewers on different models, and ensure every AI implementer model is crossed by at least one reviewer. Prefer reviewer models that did not implement the change and prefer different providers.

Honor an explicit review budget. Only the user or a higher-authority instruction may lower a required budget. An orchestrator may apply a downgrade only when its dispatch already grants that authority and scope. It may not waive the gate by itself. Never downgrade silently.

## Send a neutral review packet

Start the first pass in fresh context. Give the reviewer:

- Intended outcome or accepted specification.
- Exact diff, base, or changed scope.
- Applicable project instructions and accepted decisions.
- Verification evidence.
- Requested review depth and return format.

Do not include the implementer's confidence, conclusions, chat, or self-review before the first pass. A targeted re-review may include the prior findings and fixes. If no route can provide fresh context, report the limitation and do not claim the selected budget was satisfied without an authorized waiver.

Keep the reviewer read-only. It may suggest a fix but must not apply one. If it edits the reviewed scope, treat it as an implementer and obtain a new independent review when the budget requires one.

Require findings to identify severity, concrete evidence, affected invariant, and review limits. The reviewer reports only to the orchestrator.

## Triage, rework, and re-review

Treat reviewer findings as claims. The orchestrator verifies and accepts or rejects them. Return accepted rework to the original implementer by default. Rotate the implementer only when it is stuck, its context is degraded, a core assumption is wrong, or fresh ownership is needed.

- For R1, re-review when an accepted fix changes behavior or addresses a material correctness finding.
- For R2, always run a targeted cross-model re-review after material findings are fixed.
- For a two-reviewer R2, rerun each reviewer whose material finding caused a fix. When an AI applies the fix, ensure at least one re-review uses a different model. When a human applies the fix, keep the re-reviewers on different models.
- Do not re-review cosmetic changes unless they affect an invariant.

Continue while findings become smaller or materially different. If the same material defect survives two fix attempts, stop repeating the loop. Replan, change the implementer, or use a stronger specialist. A worker reports the stalled loop to the orchestrator. The orchestrator asks the human only when it still cannot decide.

## Handle unavailable routes

If R2 cannot reach a different model, run the strongest available independent same-model review when useful. Report `PARTIAL`, name the failed routes, and state that R2 was not satisfied.

If no independent reviewer is available for a required review, report `NOT-RUN`. A `PARTIAL` R2 or required `NOT-RUN` review blocks acceptance and merge unless the user or a higher-authority instruction explicitly allowed the downgrade. The orchestrator may not grant that waiver by itself.
