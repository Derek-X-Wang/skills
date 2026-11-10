# Stage B: manually resume on the same machine

Use when the owner manually starts a new manager session or harness for an existing run. These instructions do not launch, schedule, or automatically recover a manager. Cross-machine continuation is deferred until its transport, disclosure, target state, ownership fencing, and return/lifecycle contract are verified; autonomous recovery is a later stage.

## Reconcile before taking ownership

First resolve the stable project binding and its last verified authoritative references under the [canonical storage layout](records.md#stable-project-discovery-and-layout). Preserve the role being replaced: a standalone project owner replaces only that project's owner and reports to the human, not to an invented global manager. Apply old-manager fencing below to the previous owner of that same scope. A pending migration is not a second canonical checkpoint; follow its legacy authority until the current owner completes the switch.

1. Resolve the configured private policy/fleet/observations/state files and the exact run. Read the approved goal, workflow, authorities, latest checkpoint, attempted work, stop reasons, and prior external actions. Missing private storage or unreadable records blocks dependent work, not permission to reconstruct broad history or search secrets.
2. Verify this is the same execution machine using supported current-runtime identity evidence. A shared path or identical hostname alone is insufficient when ambiguity affects state ownership. Re-establish the new session's harness/tools/route and retained-state affinity; tools and authenticated desktop readiness do not inherit across sessions.
3. Inspect the old manager, project owners, workers, controllers, processes, and queued actions with their owning control planes. A dead manager can leave a worker alive. Identify writers by exact task-owned IDs; do not kill by broad process name. Preserve work and ask the current owner to checkpoint/release when reachable.
4. Fence the old manager's dispatch authority and every overlapping writer/queued action before any new assignment, edit, or external mutation. Verify release from fresh live evidence. If supported fencing is unavailable or a writer's status is unknown, mark ownership blocked and perform read-only reconciliation only. Do not elect a second manager by incrementing a JSON epoch.
5. Reconcile repository heads/dirty work, host state, task completion, intake ledger, and every prior external action. If a non-idempotent action may have landed, inspect the exact target. Without proof of its result, preserve `PARTIAL` and the no-replay constraint; do not repeat it through a new adapter or session.
6. Refresh affected readiness/quota observations; expire sprints and restore normal reserves when due or uncertain. Carry consumed budgets and hard STOPs forward. Confirm no task is already complete or superseded.
7. Record the verified ownership transfer, new manager identity/epoch, retained project owners, writer-release evidence, checkpoint references, and next safe tasks. Dispatch only after the active ownership boundary, authority, capacity, and return paths are proven.

A project owner may remain alive through a manager handoff if its original scope remains valid, it acknowledges the new verified manager route, and there is no duplicate assignment or controller. Transfer global ownership only after the old manager is fenced; do not disrupt useful project work merely to recreate sessions.

## Resume result

Return reconciled completed/unfinished/blocked tasks, uncertain prior actions, old/new owner identities, evidence of fencing, capacity/readiness limits, and exact continuation point. Distinguish the documented procedure, a simulated forward test, and a live verified handoff. A fresh cross-harness prompt alone proves none of delivery, tool readiness, writer release, or safe continuation.
