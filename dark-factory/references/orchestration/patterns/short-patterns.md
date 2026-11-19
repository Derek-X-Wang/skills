# Short patterns

Three short patterns in one file. [Task orchestration](../../orchestration.md#choose-a-pattern) says when to use each. Its dispatch, delegation and review rules apply unchanged.

## Parallel AFK runners

Use this pattern when several decision-complete queue items are genuinely independent. Factory projects are parallel by default when capacity permits; coupled work inside one project uses the serial [AFK runner](afk-runner.md). The independence gate below still governs parallel edits.

### Independence gate

Before dispatch, the orchestrator must compare every pair of items:

- Planned files and ownership do not overlap.
- No shared migration, schema, lockfile, generated artifact, barrel, registry, or release metadata is expected.
- No direct or transitive dependency exists between the items.
- Each worker has a separate worktree.
- Each item has an explicit assignee before workers start.

If ownership cannot be stated confidently, serialize the work.

### Topology

Workers never claim from a shared queue and never inspect or message peers. The orchestrator owns assignment and the task ledger.

### Run

1. Assign one item and one worktree to each runner.
2. Require status messages with the item identifier.
3. Apply each item's selected [review budget](../review-policy.md) before integration.
4. Integrate in a controlled order.
5. Rebase, merge, or refresh remaining work only when that operation is authorized and mechanical.
6. Reverify each result after its base changes.

If a worker discovers a shared file, coupled behavior, or dependency, it sends `BLOCKED <item> — SHARED_SCOPE <details>` and stops editing. The orchestrator then serializes or redesigns ownership.

If one runner fails, retry or reassign only that item. Do not let another worker absorb it without a new dispatch and ownership update.

## Parallel research

Use this pattern for read-only investigation across natural code, document, data, or system boundaries.

### Setup

1. Define the decision the research must support.
2. Split the question by natural ownership boundary, not by arbitrary file count.
3. Give each researcher a precise question, scope, source priority, and return format.
4. Require source locations, commands or queries used, findings, uncertainty, and unresolved contradictions.

Researchers can share a checkout when every task is read-only. Do not grant write authority by convenience.

### Topology

```text
                ┌─ frontend question
orchestrator ───┼─ backend question
                └─ infrastructure question
```

The orchestrator compares evidence, resolves terminology, and distinguishes direct observations from inferences.

Use a return table when several researchers contribute:

| Question | Finding | Evidence | Confidence or limit |
| --- | --- | --- | --- |

Do not use this pattern when a few focused searches can answer the question locally.

## Structured debate

Use this pattern for a time-boxed decision with two or more genuinely defensible options. Do not use it for an obvious choice or implementation work.

### Topology

```text
advocate A → orchestrator ← advocate B
                    ↓
               synthesis
```

The orchestrator relays the strongest opposing claims between rounds.

### Run two rounds

1. Frame one decision question, the options, accepted facts, constraints, and decision criteria.
2. Give each advocate one option to steelman and the same evidence set.
3. Collect independent opening briefs with benefits, risks, failure modes, and evidence.
4. Send each advocate a concise opposing brief through the orchestrator.
5. Collect one rebuttal and a final recommendation from each advocate.
6. Synthesize agreements, real disagreements, assumptions that change the answer, and the recommended decision path.

Advocates must argue strongly but remain truthful. They may concede a valid point. They must not invent evidence or hide a decisive weakness.

The orchestrator makes the decision only when it has that authority. Otherwise it presents the decision and trade-offs to the human.
