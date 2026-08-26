# Planner–Generator–Evaluator

Use this pattern for a substantial feature with subjective quality requirements or unclear product decomposition. Keep simple work local.

## Roles

| Role | Purpose |
| --- | --- |
| Planner | Turn the approved outcome into observable product behavior and phases. |
| Generator | Choose the implementation and build inside the accepted contract. |
| Evaluator | Test and score the result against selected criteria. |
| Reviewer | Perform an independent cold code and contract review. |
| Auditor | Optionally audit specification quality and evaluator rigor. |

The auditor reviews the process. It does not replace the independent reviewer.

## Flow

```text
approved outcome
      ↓
   planner ──spec──→ orchestrator ──spec──→ generator
      ↑                                      │
      │                                      ↓
 optional audit                        implementation
                                             │
                         ┌───────────────────┴───────────────────┐
                         ↓                                       ↓
                     evaluator                              reviewer
                         └──────── findings → orchestrator ←─────┘
                                              │
                                      accepted rework loop
```

Artifacts create a durable audit trail. They do not create direct agent handoffs. The orchestrator chooses what each role receives.

## Setup

1. Read project instructions, specifications, contracts, and existing architecture.
2. Choose a project-local artifact directory only when persistent artifacts add value. Do not change always-loaded instructions by default.
3. Select only relevant quality dimensions. Customize weights, thresholds, and evidence to the task contract.
4. Customize the role templates:
   - [planner](../templates/planner-generator-evaluator/agents/planner.md)
   - [generator](../templates/planner-generator-evaluator/agents/generator.md)
   - [evaluator](../templates/planner-generator-evaluator/agents/evaluator.md)
   - [reviewer](../templates/planner-generator-evaluator/agents/reviewer.md)
   - [auditor](../templates/planner-generator-evaluator/agents/auditor.md)
5. Choose a starting rubric when useful:
   - [web app](../templates/planner-generator-evaluator/criteria/web-app.md)
   - [CLI app](../templates/planner-generator-evaluator/criteria/cli-app.md)
   - [API service](../templates/planner-generator-evaluator/criteria/api-service.md)
   - [mobile app](../templates/planner-generator-evaluator/criteria/mobile-app.md)

## Run the loop

1. Dispatch the planner with the approved outcome and scope. Do not allow scope expansion.
2. Check the spec against higher-authority requirements. Resolve only decisions already within orchestrator authority. If the spec adds or changes product behavior that the human did not approve, obtain human approval through the orchestrator before generator dispatch.
3. Dispatch the generator with the accepted spec, repository context, ownership, authority, and verification contract.
4. Give the evaluator the accepted spec, criteria, implementation diff, and objective evidence. Do not include the generator's self-review.
5. Give the independent reviewer the task contract, accepted decisions, diff, and verification evidence.
6. Send accepted same-invariant findings to the generator through the orchestrator.
7. Repeat evaluation and review only for the changed areas and affected invariants, then rerun required verification.
8. Use the auditor when the spec or evaluation process needs a separate challenge.

Use 1–5 scores only when a graded rubric improves the decision. Define the threshold before evaluation. A score without concrete evidence is not a result.

Remove planner, evaluator, artifact, or scoring machinery when it no longer improves outcomes. The pattern is scaffolding, not ceremony.
