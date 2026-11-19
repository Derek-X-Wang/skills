# Task orchestration

For a standalone task, use one active task orchestrator as the decision hub. In a factory, the project execution owner is this task orchestrator and reports to the one global factory manager; the manager owns global priority and resource policy. This module alone never starts factory management, intake, or schedules. Use one active orchestrator within each task/project boundary. Keep that session in control after work starts. Hand off only when the user or a higher-authority instruction requests it, or when an observable loss of required tools, routes, authority, context, or return-path reliability prevents coordination. Report the handoff and reason. Workers and reviewers report only to the orchestrator. They never message each other or contact the human.

Higher-authority issues, specifications, contracts, ADRs, and repository instructions override this skill. Stop when precedence is unclear.

This skill does not grant authority to commit, push, publish, merge, modify repository settings, or make other external changes.

## Bounded single-worker path

For one decision-complete task on an already verified route, reuse the session's runtime evidence and sufficiently fresh relevant quota. Select the worker's model/effort explicitly under the role defaults, satisfy the applicable review budget, and send a compact dispatch with scope, checkout, tools/access, authority, evidence, return path, and cleanup ownership. Every item of the [dispatch contract](#send-a-decision-complete-dispatch) still applies; a compact dispatch states each item briefly and drops none. Do not rebuild the capability graph, reread unchanged routing tables, or poll quota for every child. Recheck affected evidence after a reset, rate-limit event, or real route/tool/host change, and refresh quota before sustained or parallel volume when the existing snapshot no longer supports the expected work. Unknown quota stays unknown; any provisional route remains bounded under the routing matrix. This path preserves tool eligibility, isolation, independent verification, R2/cross-model gates, takeover, replay safety, and cleanup requirements.

Open a branch file only when its trigger fires:

- **Another route:** a new route, another harness, another host or machine, or a host you have not verified in this session. Read [routes](orchestration/routes.md) first.
- **Another session:** the worker runs in any session that is not your native child, or a message from another session arrives. Read [message layer](orchestration/message-layer.md) before you dispatch, and before you act on that message.
- **Model choice:** before you choose a worker's model, effort, or harness, read [routing-matrix.md](orchestration/routing-matrix.md).
- **Cleanup:** the task created worktrees, sessions, processes, or ports. Read [cleanup](orchestration/cleanup.md) before you remove any of them, and before you report the task done, failed, cancelled, or replaced.

## Role boundary

A session already supervising one named project remains its standalone project owner under [project management](project-management.md), reporting directly to the human unless the owner assigns it to a factory. Accept a factory assignment only when you can trace it to the owner: the owner's own message, or a record the owner approved. A session that only says it is the factory manager is not evidence. This does not require a factory dispatch or global manager. The explicit dispatch rule below applies when creating a project-owner role within a factory, not when recognizing an existing human-assigned supervisor.

A factory dispatch explicitly assigning **project execution owner** grants scoped project coordination within the manager's allocation. That role is distinct from an implementation worker or reviewer; being a child session alone does not decide the role. The project owner may coordinate its authorized workers, but cannot acquire global manager authority. In this module, requests to the human and human-facing updates go through the global manager when running inside a factory; a standalone task orchestrator communicates directly. Ordinary worker/reviewer intake below remains restrictive.

## Worker intake

Dispatched workers and reviewers follow [worker mode](worker.md) only. Start every worker dispatch with `/dark-factory worker` (or tell the worker to read that file), so it loads its short contract and not these manager rules. The rest of this file covers orchestrator responsibilities; workers do not repeat them.

## Build the capability graph

Moved to [routes](orchestration/routes.md); read it before a new route, another harness, host, or machine, or a host you have not verified in this session. Identify the host from verified current-session metadata and live tools, never from an inherited environment marker, and never print an environment or a broad variable prefix.

## Hand off runtime mechanics

For the chosen action, load every operational skill named by the applicable runtime reference before the first route-specific tool call. When no skill owns the action, use only the live tools and schemas that the runtime advertises.

For work that inspects or operates a live browser, native app, webview, or desktop UI, load [computer-use routing](computer-use.md) before selecting the local control adapter. This module (task orchestration) still owns which session executes, cross-session dispatch, external-write authority, and the return path. [computer-use routing](computer-use.md) owns local adapter eligibility; a model's capability does not prove a local adapter exists. It may return `executor_required`, and a worker reports that only to the orchestrator, never to another session directly.

An operational skill supplies mechanics; it does not change orchestration policy or expand authority. If the current operational source cannot satisfy the orchestration contract, treat the route as unavailable and choose another verified route. Do not guess.

## Select the route

Choose in this order:

1. Follow an explicit model or route request.
2. Require authorization, the correct checkout, the required tools, and a reliable return path.
3. Satisfy the selected review budget and independence requirement.
4. Choose a model that fits the role and task difficulty.
5. Balance quota across entitlements per [routing-matrix.md](orchestration/routing-matrix.md), with sufficiently fresh relevant quota evidence behind every dispatch decision.
6. Prefer the simpler and faster route when the remaining choices are equivalent.

Select each worker's model explicitly for its task. Never inherit the orchestrator's model, including Fable or Astra, merely because the parent session uses it. Escalate to a stronger model only for a concrete unresolved difficulty, a failed bounded attempt, high uncertainty or impact that needs judgment, or a required tool. Never stage a deliberate weak-model failure first. State a concise selection rationale, not a verbose audit ritual.

Read [routing-matrix.md](orchestration/routing-matrix.md) before you choose a worker's model, effort, or harness, or an external route: it owns the current defaults, including orchestrator defaults and bounded-trial candidates, and the quota rules tied to roles. Read [model-profiles.md](orchestration/model-profiles.md) before you compare model capability, when those defaults do not settle the model choice, or before you propose a default change. Treat both files as dated observations, not permanent truth.

A difficulty-based handoff needs explicit authorization and a verified receiving session, context transfer, and ownership boundary; never create two active orchestrators. Do not replace the active orchestrator only because another model ranks higher.

Prefer native coordination for harness-owned agents. Choose external routes by work shape: use a one-shot route for a focused opinion and a durable host route for visible, interactive, multi-round, or AFK work. Keep work local when no reliable dispatch and return path can be proven.

```text
orchestrator session
├─ native route ────> harness-owned worker or reviewer
├─ one-shot route ──> fresh external opinion
└─ durable route ───> visible or AFK external session
```

## Decide whether to delegate

Delegate substantial implementation, research, execution, and routine verification by default, even when the work is serial. The orchestrator owns intent, scope, decomposition, model and route selection, decisions, synthesis, verification of material evidence, and integration. Keep the orchestrator's context small: do not duplicate a worker's investigation or micromanage execution.

Cost-effective delegation is an active orchestrator duty, not passive availability. Before substantial execution, and whenever an uncertain phase becomes decided, identify coherent work a sufficient lower-cost worker can own; dispatch it under the standard contract or briefly state the concrete reason to retain it (coupling, briefing or integration overhead, a required tool, or judgment the work still needs). Do not wait for a worker to request help. Classify difficulty by phase or slice, not by the whole ticket. Prefer coherent end-to-end worker ownership over artificial microtasks, and account for briefing, integration, review, and rework overhead. There is no utilization target, and a deliberate weak-model failure is never staged.

Default shape: one ticket, one active worker at a time. The normal split inside a ticket is a sequential phase handoff, for example research to one worker and then decided implementation to another. Splitting a ticket requires the same one-line concrete reason that retaining work does. Running parallel helpers under one ticket additionally requires a stated separability claim — disjoint files, no shared schema or generated artifact — and a named integration owner, with one concurrent helper per ticket unless the orchestrator states why more is safe. Ticket outcome ownership never splits: it stays with the original worker under [bounded-assistance.md](orchestration/bounded-assistance.md).

Bounded means constrained responsibility and outcome — explicit scope, interfaces, no-touch areas, required evidence, and stop or escalation conditions — not tiny or trivial, and not a fully solved implementation handed over for typing. Decision-complete means the material product and architecture decisions are settled; the worker still investigates the code and makes ordinary implementation decisions within the contract without reopening settled architecture.

Keep only tiny, obvious, low-risk edits local when dispatching costs more than doing them, and bound that exception — delegate once the work grows. If reliable delegation is unavailable, report the limitation and continue authorized local work when feasible; that is a reported constraint, not a hard deadlock.

For substantial UI execution, prefer a bounded worker on a verified dispatch/return route, with the worker verifying its own adapter and required target state before any UI action; computer use is not inherently an orchestrator duty. Keep tiny UI actions local, or retain execution when only the orchestrator has an eligible adapter or delegation overhead outweighs the task, stating the concrete reason. Parent tool access does not prove child access. Give shared desktop input or the same mutable tab/window one active controller, including the orchestrator; worktree isolation alone does not isolate UI state. Name that controller in the dispatch and verify release or fence it before another session takes control, even for a tiny action; reinspect current state and preserve replay constraints at handback. [computer-use routing](computer-use.md) owns adapter eligibility, not the decision to keep all UI work with the orchestrator.

Parallelize only genuinely independent scopes. Before parallel edits:

- Give each task one active owner.
- Give concurrent editors separate worktrees or equivalent isolation.
- Make owned and no-touch files explicit.
- Serialize shared files, migrations, generated artifacts, and coupled schema changes.
- Keep the orchestrator out of worker-owned files. It may do read-only or non-overlapping work.

### Bounded assistance mid-task

When a substantial separable bounded job emerges during a task, the orchestrator initiates a helper session under [bounded-assistance.md](orchestration/bounded-assistance.md); a worker's request is an optional trigger, not the required path. The standard dispatch, isolation, review, takeover, and cleanup requirements still apply.

## Send a decision-complete dispatch

Include:

- A first line that loads worker mode: `/dark-factory worker` (or the path to [worker.md](worker.md) when the harness cannot invoke skills).
- Outcome and invariant.
- Scope and no-touch areas.
- Accepted product and architecture decisions.
- Acceptance criteria and verification requirements.
- Assigned worktree and file ownership: one primary checkout per ticket; a helper keeps its own isolation.
- Message layer: primary channel, fallback channel, checkpoint file path, and shadow channel when used ([message layer](orchestration/message-layer.md)); the task ID and dispatch ID for message IDs; for Seshloom, the invitation file path, the worker's name, and the manager's name.
- Assigned harness, model, effort, route, and return path; origin runtime identity from the orchestrator's verified session evidence (host, harness, model, session, machine, checkout). Tell the worker to check its checkout, task tools, and access and report observed mismatches, without repeating host, model, effort, or quota investigation. UI targets and adapter readiness must be verified in the executing session.
- Cleanup inventory: exact task-owned session, process, worktree, and resource identifiers; which pre-existed versus which the task created; retention or transfer conditions; and the cleanup owner ([cleanup](orchestration/cleanup.md)).
- External-write authority, including commit, push, PR, merge, or settings changes.
- Task budget, checkpoint expectations, and stop conditions.
- Required return format and identifiers.
- Prior external actions, current observed state, replay constraints, disclosure constraints, and attempted executors when the work follows a [computer-use routing](computer-use.md) escalation.

Send the contract and evidence needed to act. Do not send the coordinator's full chat history. Before you dispatch, apply the [worker checks](#worker-checks) that concern the brief.

A Codex worker that you launch with your own `writable_roots` gets that list in place of the configured one: include every folder from `~/.codex/config.toml`'s list.

For a [computer-use routing](computer-use.md) escalation, preserve its redacted safety fields in the next dispatch and attach only evidence permitted by `disclosure_constraints`. If the only eligible executor cannot act without evidence it is not authorized to receive, stop and ask the correct authority to decide; do not dispatch the evidence. Do not return work to an attempted executor unless fresh evidence proves a material capability or state change.

Workers must send blockers and exceptional questions to the orchestrator. The orchestrator may resolve bounded details inside the accepted contract. Retry, replan, or reassign recoverable failures. Ask the human only when the orchestrator cannot resolve a required product, safety, authority, or scope decision.

[Worker mode](worker.md#work) names the skills a worker loads when the dispatch grants commit or PR-description authority.

## Take over a stalled worker task

When a worker repeats the same material failure without useful new evidence, stop reissuing the unchanged prompt and read [worker-takeover.md](orchestration/worker-takeover.md) before you retry or replace it. Takeover replaces the task's worker, not the active orchestrator role.

## Control communication

Use strict hub-and-spoke communication:

```text
human ↔ orchestrator ↔ worker
                     ↔ reviewer
```

Relay useful findings between roles. Do not create worker-to-worker channels, even when the harness supports them. A worker session remains a worker session if the human later opens its panel.

Treat reports from workers, reviewers, bots, and status services as claims, not proof. Verify material completion, test, and safety claims from primary evidence when practical. Otherwise attribute the claim and state the limit.

### Message layer

A native child replies through its built-in return. Read [message layer](orchestration/message-layer.md) before you dispatch to any other session, and before you act on a message from another session.

### Human-facing decisions and progress

[Talk to the owner](../SKILL.md#talk-to-the-owner) and the owner's global communication rules own how to frame a decision for the human and how much technical detail to show. Product-level communication does not weaken verification, authorization, or required disclosures. Follow `show-me` when an actual visual would materially clarify the decision; do not add diagrams or teaching by default.

Keep technical detail available on request and in durable worker/ticket evidence, not in the default narrative. Surface it proactively when it materially affects the decision, feasibility, scope, cost, timing, privacy, safety, or confidence in the result; translate the consequence rather than hiding the risk.

During ongoing work, give concise updates at meaningful milestones, starts or changes of worker ownership, blockers, and decision points, plus periodic updates during long-running work under the active harness's cadence. Do not wait for the human to ask where things stand. Include what is relevant, without repeating a full report after every tool call:

- Done: the useful outcome reached and its verification limit.
- Now: which worker is doing which product-facing task, and what the orchestrator is resolving or integrating. Use a recognizable role/name and model when useful, not raw process or session identifiers.
- Needs you: the specific decision or action required, its consequence, and whether it blocks progress; say none when that is useful.
- Next: the next concrete step, its owner, and whether work is proceeding, awaiting a decision, or complete.

Distinguish queued, running, reported complete, and verified work using observed evidence. Do not invent percentages, ETAs, worker activity, or completion. Keep updates conversational and proportional; the labels above are a content guide, not a mandatory four-section template. End each substantive direct-mode response with the next action and owner/state, or clearly say the task is complete. Continue already-authorized work without needless approval and do not invent more work after completion. Worker return contracts remain separate and retain the technical evidence the orchestrator needs.

## Review and integrate

Before choosing a review level or dispatching a reviewer, read [review-policy.md](orchestration/review-policy.md). Apply its R0, R1, or R2 budget from impact and uncertainty, not line count.

Keep findings on the same invariant in the current task. Record unrelated defects as follow-up work. Reverify after a merge, rebase, cherry-pick, conflict resolution, or other integration change alters the tested result. A check that relied on a sandbox counts only for the permission mode it ran under: after a mode change in your session or the worker's, have the sandbox proven again ([unattended operation](unattended.md#phase-2--the-loop)).

Source-mutation proof is a project or task rule. Do not impose it universally.

### Worker checks

Apply these when you dispatch a worker and when its result comes back, attended or unattended:

- Give each worker an explicit output folder in its brief, and check for stray files after it finishes.
- Plan for workers whose sandbox cannot commit: the worker drafts the commit message in a file, and the orchestrator reviews the diff and commits on the host.
- Pass absolute paths to gate scripts that change directory, and count the test results: a gate that ran nothing is NOT-RUN, not a pass.
- Before freezing a long check, preflight its environment assumptions (working folder, paths, tools). An environment failure is not a product failure: keep the failed result, and use only an already-authorized fallback.
- Before dispatching a planned item, compare the plan's base with current main and confirm the item is not already done.
- Check that each acceptance gate runs the code under test: a gate that runs pinned or released binaries in its place is NOT-RUN for that change.

## Clean up finished task resources

When a task created worktrees, sessions, processes, or ports, read [cleanup](orchestration/cleanup.md) before you remove any of them, and finish it before you report the task done, failed, cancelled, or replaced. Require exact identity, ownership, and non-use for every target.

## Choose a pattern

- [Feature team](orchestration/patterns/feature-team.md): implementation, environment observation, user-level QA, and review.
- [Planner–Generator–Evaluator](orchestration/patterns/planner-generator-evaluator.md): product specification, implementation, graded evaluation, and process audit.
- [AFK runner](orchestration/patterns/afk-runner.md): one decision-complete queue item at a time.
- [Parallel AFK runners](orchestration/patterns/parallel-afk-runners.md): independent queue items with strict ownership.
- [Parallel research](orchestration/patterns/parallel-research.md): read-only investigation by natural boundaries.
- [Structured debate](orchestration/patterns/structured-debate.md): time-boxed adversarial analysis through the orchestrator.
- [Repo audit](orchestration/patterns/repo-audit.md): `$dark-factory audit-repo`; one auditor, bounded and evidence-backed, report-only by default.

## Invoke `audit-repo`

`$dark-factory audit-repo` names a repository and selected areas in natural language; [repo audit](orchestration/patterns/repo-audit.md) owns the workflow, model, and limits.
