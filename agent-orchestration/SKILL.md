---
name: agent-orchestration
description: Route and coordinate work across agents, harnesses, terminals, and review loops. Use before delegating, spawning workers or reviewers, coordinating parallel or AFK work, choosing a harness or model, relaying cross-terminal messages, or applying feature-team, planner-generator-evaluator, research, debate, or queue-runner patterns.
---

# Agent Orchestration

Use one orchestrator as the control plane. Workers and reviewers report only to the orchestrator. They never message each other or contact the human.

## Route the task

Identify two independent axes:

- **Harness:** the agent runtime, such as Claude Code or Codex.
- **Host:** the surrounding product or terminal manager, such as T3 Code, Orca, the Codex app, or cmux.

A host can wrap more than one harness. Runtime references can therefore apply together.

Detect the route in this order:

1. Trust injected runtime, host, and session metadata.
2. Inspect the native coordination tools exposed to the current agent.
3. Inspect only exact, known non-secret environment markers. Never print an environment or a broad variable prefix.
4. Check installed host and harness CLIs and their current help.
5. Ask the orchestrator when running as a worker, or the human when running at top level, only when ambiguity would materially change the work.

Prefer native coordination tools for agents owned by the current harness. Use a host CLI or host messaging tool for cross-terminal routing, or when no native path exists. Keep the task local when no reliable dispatch and return path can be proven.

```text
Worth delegating?
├─ no  → work locally
└─ yes
   ├─ native spawn + return path → use native tools
   ├─ verified host route        → use the host route
   └─ no reliable route          → work locally
```

Read the matching runtime references before any cross-host operation or dispatch:

- [T3 Code host](references/runtimes/t3-code.md)
- [Orca host](references/runtimes/orca.md)
- [Claude Code harness](references/runtimes/claude-code.md)
- [Codex harness in the app, CLI, or IDE](references/runtimes/codex-app.md)
- [cmux Claude teams host overlay](references/runtimes/cmux-team.md)

Read [routing-matrix.md](references/routing-matrix.md) when choosing a model or harness. Treat it as a dated tested default, not a permanent ranking.

## Decide whether to delegate

Delegate only when clear ownership boundaries, useful parallelism, specialist capability, or independent review improves speed or quality. Keep simple work local.

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

Do not send the coordinator's full chat history. Send the contract and the evidence needed to act.

Workers must send blockers and exceptional questions to the orchestrator. They must stop when a new product, safety, authority, or scope decision is required. The orchestrator may resolve bounded implementation details that stay inside the accepted contract. Retry or reassign recoverable failures before stopping the run.

## Control communication

Use strict hub-and-spoke communication:

```text
human ↔ orchestrator ↔ worker
                     ↔ reviewer
```

Relay useful findings between roles. Do not create worker-to-worker channels, even when the harness supports them. A worker session remains a worker session if the human later opens its panel.

## Review and integrate

Require independent cross-model review before accepting material production work. Give the reviewer the task contract, diff, verification evidence, and accepted decisions. Do not give it the implementer's chat or self-review.

The reviewer reports only to the orchestrator. Return accepted rework to the original implementer by default. Rotate the implementer only when it is stuck, its context is degraded, a core assumption is wrong, or the project requires fresh ownership.

Keep findings on the same invariant in the current task. Record unrelated defects as follow-up work. Reverify after a merge, rebase, cherry-pick, conflict resolution, or other integration change alters the tested result.

If no independent reviewer is available, report `NOT-RUN`. Stop before merge unless a higher-authority instruction explicitly waives the review gate.

Source-mutation proof is a project or task rule. Do not impose it universally.

## Choose a pattern

- [Feature team](references/patterns/feature-team.md): implementation, environment observation, and user-level QA.
- [Planner–Generator–Evaluator](references/patterns/planner-generator-evaluator.md): product specification, implementation, graded evaluation, and process audit.
- [AFK runner](references/patterns/afk-runner.md): one decision-complete queue item at a time.
- [Parallel AFK runners](references/patterns/parallel-afk-runners.md): independent queue items with strict ownership.
- [Parallel research](references/patterns/parallel-research.md): read-only investigation by natural boundaries.
- [Structured debate](references/patterns/structured-debate.md): time-boxed adversarial analysis through the orchestrator.

Higher-authority issues, specifications, contracts, ADRs, and repository instructions override this skill. Stop when precedence is unclear.

This skill does not grant authority to commit, push, publish, merge, modify repository settings, or make other external changes.

When a dispatch grants commit authority, also use `git-project-memory`. When it grants creation or revision of a PR description, also use `pr-writing`.
