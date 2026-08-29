---
name: agent-orchestration
description: Route and coordinate work across models, agents, harnesses, sessions, hosts, control planes, and review loops. Use before delegating, spawning workers or reviewers, coordinating parallel or AFK work, choosing a model or harness, relaying cross-terminal messages, or applying feature-team, planner-generator-evaluator, research, debate, or queue-runner patterns.
---

# Agent Orchestration

Use one active orchestrator as the decision hub. Keep that session in control after work starts. Hand off only when the user or a higher-authority instruction requests it, or when an observable loss of required tools, routes, authority, context, or return-path reliability prevents coordination. Report the handoff and reason. Workers and reviewers report only to the orchestrator. They never message each other or contact the human.

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

Before the first dispatch, build a small runtime fingerprint:

- Current model, originating provider, serving gateway when present, and harness.
- Current host, control plane, checkout, and worktree.
- Native agent tools.
- Verified external routes and return paths.
- Entitlement or quota limits only when they can change the route.

Trust injected runtime and session metadata first. Then inspect exposed tools. Check only exact, non-secret environment markers and current CLI help when needed. Never print an environment or a broad variable prefix.

Read the references for the current environment and each candidate route before the final route choice and any cross-host work or dispatch:

- [T3 Code](references/runtimes/t3-code.md)
- [Orca](references/runtimes/orca.md)
- [Claude Code](references/runtimes/claude-code.md)
- [Codex](references/runtimes/codex-app.md)
- [OpenCode](references/runtimes/opencode.md)
- [cmux host and Claude teams overlay](references/runtimes/cmux-team.md)

Read [model-profiles.md](references/model-profiles.md) before comparing model capability. Read [routing-matrix.md](references/routing-matrix.md) before choosing a model, harness, or external route. Treat both files as dated observations, not permanent truth.

## Hand off runtime mechanics

For the chosen action, load every operational skill named by the applicable runtime reference before the first route-specific tool call. When no skill owns the action, use only the live tools and schemas that the runtime advertises.

Keep one owner for each kind of instruction:

- This skill owns cross-runtime policy, the final route choice, delegation contracts, communication topology, review, and integration.
- Runtime references own detection, capability mapping, route feasibility, runtime-specific invariants, and unavailable-route behavior.
- Operational sources own executable discovery, current commands, flags, schemas, and tool lifecycle mechanics. An operational source can be a tool-owned skill, a live runtime guide, or advertised native tool schemas.
- A live guide or schema owns version-matched behavior when one is available.

Do not copy volatile tool commands into this skill or its runtime references. An operational skill supplies mechanics; it does not change orchestration policy or expand authority. If the current operational source cannot satisfy the orchestration contract, treat the route as unavailable and choose another verified route. Do not guess.

## Select the route

Choose in this order:

1. Follow an explicit model or route request.
2. Require authorization, the correct checkout, the required tools, and a reliable return path.
3. Satisfy the selected review budget and independence requirement.
4. Choose a model that fits the role and task difficulty.
5. Preserve scarce quota and use abundant quota.
6. Prefer the simpler and faster route when the remaining choices are equivalent.

Do not replace the active orchestrator only because another model ranks higher. Use another model as a planner, worker, adviser, or reviewer instead.

Prefer native coordination for harness-owned agents. Choose external routes by work shape: use a one-shot route for a focused opinion and a durable host route for visible, interactive, multi-round, or AFK work. Keep work local when no reliable dispatch and return path can be proven.

```text
orchestrator session
├─ native route ────> harness-owned worker or reviewer
├─ one-shot route ──> fresh external opinion
└─ durable route ───> visible or AFK external session
```

## Decide whether to delegate

Delegate only when clear ownership, useful parallelism, specialist capability, context isolation, or independent review improves the result. Keep simple work local.

Before parallel edits:

- Give each task one active owner.
- Give concurrent editors separate worktrees or equivalent isolation.
- Make owned and no-touch files explicit.
- Serialize shared files, migrations, generated artifacts, and coupled schema changes.
- Keep the orchestrator out of worker-owned files. It may do read-only or non-overlapping work.

## Send a decision-complete dispatch

Include:

- Outcome and invariant.
- Scope and no-touch areas.
- Accepted product and architecture decisions.
- Acceptance criteria and verification requirements.
- Assigned worktree and file ownership.
- External-write authority, including commit, push, PR, merge, or settings changes.
- Stop conditions.
- Required return format and identifiers.

Send the contract and evidence needed to act. Do not send the coordinator's full chat history.

Workers must send blockers and exceptional questions to the orchestrator. The orchestrator may resolve bounded details inside the accepted contract. Retry, replan, or reassign recoverable failures. Ask the human only when the orchestrator cannot resolve a required product, safety, authority, or scope decision.

## Control communication

Use strict hub-and-spoke communication:

```text
human ↔ orchestrator ↔ worker
                     ↔ reviewer
```

Relay useful findings between roles. Do not create worker-to-worker channels, even when the harness supports them. A worker session remains a worker session if the human later opens its panel.

Treat reports from workers, reviewers, bots, and status services as claims, not proof. Verify material completion, test, and safety claims from primary evidence when practical. Otherwise attribute the claim and state the limit.

## Review and integrate

Before choosing a review level or dispatching a reviewer, read [review-policy.md](references/review-policy.md). Apply its R0, R1, or R2 budget from impact and uncertainty, not line count.

Keep findings on the same invariant in the current task. Record unrelated defects as follow-up work. Reverify after a merge, rebase, cherry-pick, conflict resolution, or other integration change alters the tested result.

Source-mutation proof is a project or task rule. Do not impose it universally.

## Choose a pattern

- [Feature team](references/patterns/feature-team.md): implementation, environment observation, user-level QA, and review.
- [Planner–Generator–Evaluator](references/patterns/planner-generator-evaluator.md): product specification, implementation, graded evaluation, and process audit.
- [AFK runner](references/patterns/afk-runner.md): one decision-complete queue item at a time.
- [Parallel AFK runners](references/patterns/parallel-afk-runners.md): independent queue items with strict ownership.
- [Parallel research](references/patterns/parallel-research.md): read-only investigation by natural boundaries.
- [Structured debate](references/patterns/structured-debate.md): time-boxed adversarial analysis through the orchestrator.

Higher-authority issues, specifications, contracts, ADRs, and repository instructions override this skill. Stop when precedence is unclear.

This skill does not grant authority to commit, push, publish, merge, modify repository settings, or make other external changes.

When a dispatch grants commit authority, also use `git-project-memory`. When it grants creation or revision of a PR description, also use `pr-writing`.
