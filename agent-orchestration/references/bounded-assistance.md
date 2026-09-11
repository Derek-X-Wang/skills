# Bounded assistance

Helper support for a substantial, separable, bounded job that emerges during a task. The orchestrator initiates it from its own plan and phase transitions, proactively evaluating whenever uncertain work becomes decided whether a sufficient lower-cost helper can own a coherent slice; a dispatched worker's request is an optional trigger, not a path to wait for. Triggers include a stalled task, an overloaded orchestrator context, or cost-effective delegation of a decided slice; none is mandatory — decide on net benefit against coupling and overhead, and state a one-line concrete reason whether splitting or retaining the work. The default shape is one ticket with one active worker at a time; a sequential phase handoff is the normal split, and a concurrent helper is the exception. A helper is an ordinary orchestrator-owned peer worker: no new hierarchy, no worker-to-worker channel, no automatic sub-ticket. Nothing here relaxes the standard dispatch, review, takeover, or cleanup rules.

## Roles and decision

- A dispatched worker may request a bounded helper from the orchestrator. It cannot spawn, reroute, manage, or message helpers, peers, or humans; the request and all results travel through the orchestrator.
- The original worker keeps domain and ticket outcome ownership. The helper executes only the bounded slice and reports to the orchestrator.
- The orchestrator decides, dispatches under the standard contract, and assigns integration ownership. It may decline and keep the work with the original worker when task coupling or briefing and checking overhead outweighs the savings. A decline is a normal outcome, not a blocker report.

## Select the helper

Orchestrator-only. The orchestrator selects model, effort, harness, and route under [routing-matrix.md](routing-matrix.md), including its phase-based selection, GLM preference, and web-versus-local research rules, applying sufficiently fresh actual usage evidence, required capability, tools, review independence, and route safety, and never choosing the cheapest option at any cost or staging a weaker-model failure first. Assigned workers do not read routing tables, investigate quota, or select models. An assigned worker's duties stay those its dispatch names: the original worker keeps checkpoint, resume, and continuation obligations, and the helper keeps its return contract.

## Request contract

The request names:

- Bounded outcome and what makes it separable.
- Accepted decisions and rationale the helper must not revisit.
- Exact code baseline, including relevant uncommitted state, and the checkout or worktree.
- Scope and no-touch ownership, including files the original worker keeps editing.
- Acceptance checks and required evidence.
- Dependencies and the original worker's continuation point.

The orchestrator may resolve bounded details inside this contract; dispatch authority, evidence, return path, and cleanup ownership are unchanged. Resolve material missing context before dispatch; do not send the helper into ambiguity the contract should have closed.

## Run the helper

- Save a durable checkpoint before the helper edits. Keep the original worker session alive when the route supports it; the helper remains a separate peer session. If the original session is lost or compacted, reconstruct its continuation from the durable checkpoint, not chat history.
- Pause the original worker's overlapping edits while the helper works. Run parallel work only with isolated scopes: a stated separability claim (disjoint files, no shared schema or generated artifact), one active owner per file, separate worktrees or equivalent isolation, shared files and generated artifacts serialized, and a named integration owner. Default to one concurrent helper per ticket; the orchestrator states why more is safe before adding another.
- Do not poll a model actively just to wait; use the route's completion reporting or agreed checkpoints.

## Return and integrate

The helper returns the exact patch, commit, or artifact; checks performed and results; deviations and blockers; and whether its output is integrated or not integrated. The orchestrator observes, relays, and verifies this evidence as claims.

- Integration ownership is assigned by the orchestrator. Integration carries no implied commit, push, or merge authority; external writes follow the dispatch and task authorization only.
- Before resuming overlapping work, the original worker reads the relevant diff, verifies its checkout holds a fresh baseline with the helper's output at its stated integration status, and re-checks changed assumptions — without redoing the entire implementation. A helper patch not yet integrated is unfinished work in the original checkout, not completed implementation.
- Integration acceptance is not independent review. Apply [review-policy.md](review-policy.md) budgets, independence, and mixed-authorship rules; helper authorship counts as implementer authorship, and multiple AI implementer models on one R2 change count as mixed authorship under that policy, which its requirements do not change.

## Failure, timeout, cancellation, rejection

Retain the checkpoint, fence the old helper writer from overlapping work, and only then reassign or retake that work. [worker-takeover.md](worker-takeover.md) and cleanup rules apply unchanged.

## Records

- The existing parent ticket is the source of truth. By default add one short, identifiable handoff record there: request and constraints, baseline, original/helper ownership and status, result, evidence, integration state, and continuation point. Link larger durable artifacts instead of pasting chat dumps.
- Open a sub-ticket only for independent acceptance or delivery, separately blocked or long-lived work, a shared dependency, or new scope requiring approval. Never auto-create tickets for helpers.
- Ticket writes follow the task's actual ticket authority and disclosure rules, including human-reply restrictions. Without ticket or write access, keep a durable local artifact and report the unsynced state; do not create tickets automatically or block otherwise safe work on the missing record.
