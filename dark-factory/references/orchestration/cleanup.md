# Clean up finished task resources

Read this before you report a task done, cancelled, or replaced when the task created worktrees, sessions, processes, or ports. [Task orchestration](../orchestration.md) owns the rest of the task.

Cleanup is lifecycle work, not a manual afterthought. The orchestrator stays accountable for it after workers and reviewers finish — across accepted completion, cancellation, failure, and worker replacement — covering task-created temporary worktrees, resources no longer used, and task-owned worker instances (Codex, Claude Code, OpenCode, native or external). It may delegate bounded cleanup execution but must verify completion: `worker_done`, a returned result, or idle state alone is not teardown proof.

Release each item as soon as it is no longer needed, but do not interrupt useful running work or discard a worker or checkpoint still needed for review, rework, user inspection, or takeover; takeover preservation and exclusivity rules stay intact. Before discarding the sole copy of anything, preserve the result, relevant logs and review evidence, and committed, uncommitted, and untracked work in a verified durable location. Confirm actual integration or an explicitly accepted preserved handoff before teardown; do not merge or push just to make cleanup possible. Dirty user work, unique commits, unresolved review, and accepted deliverables are not disposable, and a clean Git status alone is insufficient.

Order dependent teardown safely and verify each result with fresh exact-target evidence:

1. Checkpoint and preserve as appropriate.
2. Stop task-owned mutating workers, children, and queued work, then verify no active consumer or writer remains.
3. Stop or dispose the finished worker instance via its current owning harness or control plane. This releases execution and disposable task-owned terminals or sessions only — never a whole Codex, Claude Code, or OpenCode host, the orchestrator, unrelated sessions, or persistent history or credentials. A delivered interrupt, closed pane, or successful request does not prove the process exited or child resources are gone; if the route exposes no close or dispose and release cannot be proven, take the verified supported action and report the exact remaining limit. Never claim full teardown or guess a command.
4. Release exclusively task-owned, unused resources, for example dev servers, watchers, test processes, containers, temporary files, and task-specific ports.
5. Remove temporary worktrees through their owner tool: Orca for Orca-managed state, Git for plain Git worktrees.

Require exact identity, ownership, and non-use for every target. Never kill by broad process or model name, prune arbitrary worktrees, or remove shared caches, profiles, services, the user's primary checkout, branch refs, remote resources, or retained artifacts merely because a task finished. Cleanup duty does not widen authority: respect task authorization and operation-specific confirmations, and preserve or explicitly transfer any target that belongs to another active task or human, reporting the change.

Report completion with a compact cleanup outcome: items removed or stopped, items intentionally retained with reason and owner, and unresolved leftovers with identifiers and next action. Keep VERIFIED, PARTIAL, and NOT-RUN truthful; authorized cleanup that fails is incomplete, not silently successful. Do not retry unboundedly — stop unsafe or ambiguous operations for the needed authority while safe independent cleanup proceeds — and report domain outcome and cleanup outcome independently instead of failing all task output over a partial cleanup.
