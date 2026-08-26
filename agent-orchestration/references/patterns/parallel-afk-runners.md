# Parallel AFK runners

Use this pattern only when several decision-complete queue items are genuinely independent. Default to the serial [AFK runner](afk-runner.md).

## Independence gate

Before dispatch, the orchestrator must compare every pair of items:

- Planned files and ownership do not overlap.
- No shared migration, schema, lockfile, generated artifact, barrel, registry, or release metadata is expected.
- No direct or transitive dependency exists between the items.
- Each worker has a separate worktree.
- Each item has an explicit assignee before workers start.

If ownership cannot be stated confidently, serialize the work.

## Topology

```text
                ┌─ runner A → item A → worktree A
orchestrator ───┼─ runner B → item B → worktree B
                └─ runner C → item C → worktree C
```

Workers never claim from a shared queue and never inspect or message peers. The orchestrator owns assignment and the task ledger.

## Run

1. Assign one item and one worktree to each runner.
2. Require status messages with the item identifier.
3. Review each material result independently before integration.
4. Integrate in a controlled order.
5. Rebase, merge, or refresh remaining work only when that operation is authorized and mechanical.
6. Reverify each result after its base changes.

If a worker discovers a shared file, coupled behavior, or dependency, it sends `BLOCKED <item> — SHARED_SCOPE <details>` and stops editing. The orchestrator then serializes or redesigns ownership.

If one runner fails, retry or reassign only that item. Do not let another worker absorb it without a new dispatch and ownership update.
