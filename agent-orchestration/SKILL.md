---
name: agent-orchestration
description: Route and coordinate work across models, agents, harnesses, sessions, hosts, control planes, and review loops. Use before delegating, spawning workers or reviewers, coordinating parallel or AFK work, choosing a model or harness, relaying cross-terminal messages, taking over a stalled worker task, applying feature-team, planner-generator-evaluator, research, debate, or queue-runner patterns, or invoking the bounded `audit-repo` repository audit.
---

# Agent Orchestration

Use one active orchestrator as the decision hub. Keep that session in control after work starts. Hand off only when the user or a higher-authority instruction requests it, or when an observable loss of required tools, routes, authority, context, or return-path reliability prevents coordination. Report the handoff and reason. Workers and reviewers report only to the orchestrator. They never message each other or contact the human.

## Worker intake

In a dispatched worker or reviewer session, follow the assigned harness, model, effort, and route. Check only the assigned checkout, task tools, and access needed to execute. Report an observed mismatch, missing capability, blocker, or exceptional question to the orchestrator; do not investigate the host, reload model/effort/quota tables, reroute, spawn agents, or contact the human. Continue task-specific instructions and verification within the dispatch. For UI work, load `computer-use-routing` and verify the actual assigned target, adapter eligibility, exposed tools, and access; parent desktop/plugin availability is never inherited.

A dispatched worker may ask the orchestrator to run a substantial separable bounded job with a helper. Workers never spawn, reroute, manage, or message helper sessions or peers; the request and its results travel through the orchestrator under [bounded-assistance.md](references/bounded-assistance.md).

The remaining route selection and coordination sections are orchestrator responsibilities. Workers do not repeat them merely because this skill is available or included in a dispatch.

## Build the capability graph

Use these terms consistently:

| Term | Meaning |
| --- | --- |
| Entitlement | A subscription, API account, quota, or local compute source |
| Provider | The organization that supplies a model |
| Model | The intelligence used for a role |
| Gateway | A service that exposes models from one or more providers through one access route |
| Harness | The agent loop, tools, context, and permission system |
| Session | One running model and harness in one checkout |
| Host | The UI or terminal environment that displays sessions |
| Control plane | A capability that discovers, launches, messages, waits for, and stops sessions |
| Route | The connection from the orchestrator to another session |

Treat the environment as a capability graph, not a fixed product stack. One product can provide several capabilities. For example, a harness can also provide a native control plane, and a host can expose routes to several harnesses.

The orchestrator establishes a small runtime fingerprint before the first dispatch, reusing verified current-session evidence and keeping these layers separate:

- Active user-driving host — Orca, T3 Code, Codex Desktop, or another host — identified from current session metadata and live exposed tools. Never infer it from the model or executable alone, installed or running apps, a reachable Orca CLI, a shared skill catalog, the project directory, or an inherited marker.
- Current executing harness, model, originating provider, serving gateway when present, and session.
- Execution machine, local or remote, and the exact checkout or worktree.
- Adapter and target state owner, and the control plane plus verified return route, as separate layers.

Then list native agent tools, and entitlement or quota limits only when they can change the route.

Trust injected runtime and session metadata first. Then inspect exposed tools. Check only exact, non-secret environment markers and current CLI help when needed. Never print an environment or a broad variable prefix. Leave unknown or conflicting fields unknown; ask only when the ambiguity changes a safe action. Incomplete host identity alone is not a refusal when the needed local adapter and target state owner are independently proven. The orchestrator refreshes affected evidence at an actual handoff, reconnect, session restart, or real route/tool/host change. A worker follows the intake above and flags observed mismatches; task-specific UI readiness still requires its own evidence.

Distinguish the common host shapes: Orca hosting Codex, Claude, or OpenCode sessions in its worktrees; T3 Code hosting provider sessions and harness-native children; and a native Codex Desktop session. One harness can appear in several hosts while desktop and plugin readiness and the return route belong to each session. A reachable Orca CLI from T3 Code or Codex Desktop makes Orca an external route, not the active host, and a harness-native child's tools imply no new top-level session.

Opening or prefilling a Codex Desktop composer — deep link or app launcher — starts no worker and proves no return path; treat it as a manual handoff the user must send.

Automatic cross-host dispatch additionally requires verified evidence of the exact endpoint and session identity, the worker's harness, model, effort, and worktree, permitted prompt receipt and start, required tools and target readiness, approval and question handling, result and failure observation, and safe interrupt with owned cleanup and return to this orchestrator. Until then the route is unverified (`NOT-RUN`), and a non-idempotent action that may have landed keeps `PARTIAL` and its replay constraints. Host or adapter switching does not automatically transfer the orchestrator role or the verified parent return path.

Read the references needed for the current environment and candidate routes before making a new route choice or cross-host dispatch. Reuse already-read guidance for an unchanged verified route:

- [T3 Code](references/runtimes/t3-code.md)
- [Orca](references/runtimes/orca.md)
- [Claude Code](references/runtimes/claude-code.md)
- [Codex](references/runtimes/codex-app.md)
- [OpenCode](references/runtimes/opencode.md)
- [cmux host and Claude teams overlay](references/runtimes/cmux-team.md)

Read [model-profiles.md](references/model-profiles.md) before comparing model capability. Read [routing-matrix.md](references/routing-matrix.md) before choosing a model, harness, or external route. Treat both files as dated observations, not permanent truth.

## Hand off runtime mechanics

For the chosen action, load every operational skill named by the applicable runtime reference before the first route-specific tool call. When no skill owns the action, use only the live tools and schemas that the runtime advertises.

For work that inspects or operates a live browser, native app, webview, or desktop UI, load `computer-use-routing` before selecting the local control adapter. This skill still owns which session executes, cross-session dispatch, external-write authority, and the return path. `computer-use-routing` owns local adapter eligibility; a model's capability does not prove a local adapter exists. It may return `executor_required`, and a worker reports that only to the orchestrator, never to another session directly.

Keep one owner for each kind of instruction:

- This skill owns cross-runtime policy, the final session route choice, delegation contracts, communication topology, review, and integration.
- Runtime references in this skill own agent and session detection, coordination capability mapping, route feasibility, runtime-specific invariants, and unavailable-route behavior.
- Operational sources own executable discovery, current commands, flags, schemas, and tool lifecycle mechanics. An operational source can be a tool-owned skill, a live runtime guide, or advertised native tool schemas.
- A live guide or schema owns version-matched behavior when one is available.

Do not copy volatile tool commands into this skill or its runtime references. An operational skill supplies mechanics; it does not change orchestration policy or expand authority. If the current operational source cannot satisfy the orchestration contract, treat the route as unavailable and choose another verified route. Do not guess.

## Select the route

Choose in this order:

1. Follow an explicit model or route request.
2. Require authorization, the correct checkout, the required tools, and a reliable return path.
3. Satisfy the selected review budget and independence requirement.
4. Choose a model that fits the role and task difficulty.
5. Balance quota across entitlements per [routing-matrix.md](references/routing-matrix.md).
6. Prefer the simpler and faster route when the remaining choices are equivalent.

Select each worker's model explicitly for its task. Never inherit the orchestrator's model, including Fable or Astra, merely because the parent session uses it. Prefer a sufficient implementer for decided work under the dated role defaults in [routing-matrix.md](references/routing-matrix.md): GLM-5.3-Flash remains the global ordinary bounded implementation preference; GPT-5.6 Sol (`gpt-5.6-sol`) at high effort is the default for normal Codex implementation and research workers. Astra medium is no longer the routine worker default. Reserve Fable for orchestration and difficult judgment; [review-policy.md](references/review-policy.md) owns its review escalation criteria and the Astra-authored R2 gate. Escalate to a stronger model only for a concrete unresolved difficulty, a failed bounded attempt, high uncertainty or impact that needs judgment, or a required tool. Never stage a deliberate weak-model failure first. State a concise selection rationale, not a verbose audit ritual.

Do not replace the active orchestrator only because another model ranks higher. Use another model as a planner, worker, adviser, or reviewer instead.

Proactively consider DeepSeek V4.1 Flash through OpenCode Go and GPT-5.6 Luna at max effort for small, decision-complete, readily verifiable worker tasks under the [candidate policy](references/model-profiles.md#bounded-worker-candidates-2026-09-10). They are bounded trial candidates, not replacements for the GLM or Sol defaults and not approved reviewers. Any temporary usage promotion is a dated routing opportunity, not permanent capacity; [routing-matrix.md](references/routing-matrix.md) owns its revalidation.

Prefer native coordination for harness-owned agents. Choose external routes by work shape: use a one-shot route for a focused opinion and a durable host route for visible, interactive, multi-round, or AFK work. Keep work local when no reliable dispatch and return path can be proven.

```text
orchestrator session
├─ native route ────> harness-owned worker or reviewer
├─ one-shot route ──> fresh external opinion
└─ durable route ───> visible or AFK external session
```

## Decide whether to delegate

Delegate substantial implementation, research, execution, and routine verification by default, even when the work is serial. The orchestrator owns intent, scope, decomposition, model and route selection, decisions, synthesis, verification of material evidence, and integration. Keep the orchestrator's context small: do not duplicate a worker's investigation or micromanage execution.

Keep only tiny, obvious, low-risk edits local when dispatching costs more than doing them, and bound that exception — delegate once the work grows. If reliable delegation is unavailable, report the limitation and continue authorized local work when feasible; that is a reported constraint, not a hard deadlock.

Parallelize only genuinely independent scopes. Before parallel edits:

- Give each task one active owner.
- Give concurrent editors separate worktrees or equivalent isolation.
- Make owned and no-touch files explicit.
- Serialize shared files, migrations, generated artifacts, and coupled schema changes.
- Keep the orchestrator out of worker-owned files. It may do read-only or non-overlapping work.

### Bounded single-worker path

For one decision-complete task on an already verified route, reuse the session's runtime evidence and sufficiently fresh relevant quota. Select the worker's model/effort explicitly under the role defaults, satisfy the applicable review budget, and send a compact dispatch with scope, checkout, tools/access, authority, evidence, return path, and cleanup ownership. Do not rebuild the capability graph, reread unchanged routing tables, or poll quota for every child. Recheck affected evidence after a reset, rate-limit event, or real route/tool/host change, and refresh quota before sustained or parallel volume when the existing snapshot no longer supports the expected work. Unknown quota stays unknown; any provisional route remains bounded under the routing matrix. This path preserves tool eligibility, isolation, independent verification, R2/cross-model gates, takeover, replay safety, and cleanup requirements.

### Bounded assistance mid-task

When a substantial separable bounded job emerges during a task — from the orchestrator's plan or a worker's request — the orchestrator may run it with a helper session under [bounded-assistance.md](references/bounded-assistance.md); the standard dispatch, isolation, review, takeover, and cleanup requirements still apply.

## Send a decision-complete dispatch

Include:

- Outcome and invariant.
- Scope and no-touch areas.
- Accepted product and architecture decisions.
- Acceptance criteria and verification requirements.
- Assigned worktree and file ownership.
- Assigned harness, model, effort, route, and return path; origin runtime identity from the orchestrator's verified session evidence (host, harness, model, session, machine, checkout). Tell the worker to check its checkout, task tools, and access and report observed mismatches, without repeating host, model, effort, or quota investigation. UI targets and adapter readiness must be verified in the executing session.
- Cleanup inventory: exact task-owned session, process, worktree, and resource identifiers; which pre-existed versus which the task created; retention or transfer conditions; and the cleanup owner.
- External-write authority, including commit, push, PR, merge, or settings changes.
- Task budget, checkpoint expectations, and stop conditions.
- Required return format and identifiers.
- Prior external actions, current observed state, replay constraints, disclosure constraints, and attempted executors when the work follows a `computer-use-routing` escalation.

Send the contract and evidence needed to act. Do not send the coordinator's full chat history.

For a `computer-use-routing` escalation, preserve its redacted safety fields in the next dispatch and attach only evidence permitted by `disclosure_constraints`. If the only eligible executor cannot act without evidence it is not authorized to receive, stop and ask the correct authority to decide; do not dispatch the evidence. Do not return work to an attempted executor unless fresh evidence proves a material capability or state change.

Workers must send blockers and exceptional questions to the orchestrator. The orchestrator may resolve bounded details inside the accepted contract. Retry, replan, or reassign recoverable failures. Ask the human only when the orchestrator cannot resolve a required product, safety, authority, or scope decision.

## Take over a stalled worker task

When a worker repeats the same material failure without useful new evidence, stop reissuing the unchanged prompt. The worker reports the loop, or the orchestrator detects it from primary observed evidence, including when the worker is unresponsive; the orchestrator coordinates a bounded takeover of that task either way. Takeover replaces the task's worker, not the active orchestrator role. The default replacement worker is Codex GPT-6 Astra, with high or xhigh selected conditionally from the failed-attempt evidence under the takeover policy; Fable only when the user explicitly authorizes it for the takeover. Read [worker-takeover.md](references/worker-takeover.md) before triggering: it owns the no-progress threshold, exclusivity fencing of the previous writer and its children before any overlapping mutation, the compact takeover dispatch, and the automatic-cycle stop.

## Control communication

Use strict hub-and-spoke communication:

```text
human ↔ orchestrator ↔ worker
                     ↔ reviewer
```

Relay useful findings between roles. Do not create worker-to-worker channels, even when the harness supports them. A worker session remains a worker session if the human later opens its panel.

Treat reports from workers, reviewers, bots, and status services as claims, not proof. Verify material completion, test, and safety claims from primary evidence when practical. Otherwise attribute the claim and state the limit.

In direct mode, end each substantive orchestrator response with a concise next action, its owner, and a proceeding, awaiting-decision, or complete state. Continue already-authorized work without needless approval and do not invent more work after completion. Worker return contracts remain separate.

## Review and integrate

Before choosing a review level or dispatching a reviewer, read [review-policy.md](references/review-policy.md). Apply its R0, R1, or R2 budget from impact and uncertainty, not line count.

Keep findings on the same invariant in the current task. Record unrelated defects as follow-up work. Reverify after a merge, rebase, cherry-pick, conflict resolution, or other integration change alters the tested result.

Source-mutation proof is a project or task rule. Do not impose it universally.

## Clean up finished task resources

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

## Choose a pattern

- [Feature team](references/patterns/feature-team.md): implementation, environment observation, user-level QA, and review.
- [Planner–Generator–Evaluator](references/patterns/planner-generator-evaluator.md): product specification, implementation, graded evaluation, and process audit.
- [AFK runner](references/patterns/afk-runner.md): one decision-complete queue item at a time.
- [Parallel AFK runners](references/patterns/parallel-afk-runners.md): independent queue items with strict ownership.
- [Parallel research](references/patterns/parallel-research.md): read-only investigation by natural boundaries.
- [Structured debate](references/patterns/structured-debate.md): time-boxed adversarial analysis through the orchestrator.
- [Repo audit](references/patterns/repo-audit.md): bounded, evidence-backed repository audit by one explicitly selected Codex GPT-6 Astra at high effort by default, with targeted xhigh escalation for a specifically identified difficult question; report-only by default.

## Invoke `audit-repo`

`$agent-orchestration audit-repo` with a named repository and natural-language selected areas is the entrypoint for the bounded repository audit. This is skill prompt vocabulary, not a shell executable or an implemented CLI flag; [repo audit](references/patterns/repo-audit.md) owns the workflow. One auditor runs at Codex GPT-6 Astra high effort by default, with targeted xhigh escalation under the audit pattern — Derek's selected preference for this workflow, not a routine research default — with the active orchestrator preserved, no automatic fanout, and no silent model, effort, or Fable substitution when the requested route is unavailable.

Higher-authority issues, specifications, contracts, ADRs, and repository instructions override this skill. Stop when precedence is unclear.

This skill does not grant authority to commit, push, publish, merge, modify repository settings, or make other external changes.

When a dispatch grants commit authority, also use `git-project-memory`. When it grants creation or revision of a PR description, also use `pr-writing`.
