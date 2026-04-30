# Mode: Feature build (engineer + dev-watcher + qa-tester)

The classic three-role team for building a feature with feedback loops:

- **engineer** — implements code from the plan
- **dev-watcher** — runs the dev server / test runner, surfaces compile + runtime errors back to engineer
- **qa-tester** — exercises the feature once dev-watcher reports green; reports bugs to engineer

This mode is a thin wrapper over the `team-harness` skill. **Read `team-harness` first** for the role archetypes' communication contracts, then come back here for the cmux-specific spawn shape.

## When to use

- Building a non-trivial feature where compile/runtime errors will happen and you want them caught + relayed automatically.
- Debug loops where someone needs to keep poking the running app while engineer fixes.

## When NOT to use

- AFK queue draining — use `afk-runner.md` instead. The qa-tester role is wrong for "verify CI passes."
- Pure research — use `parallel-research.md`.
- Single-issue surgical fix — just use the `Agent` tool without a team.

## Topology

```
team-lead (you)
├── engineer            (writes code; lives in main worktree or its own)
├── dev-watcher         (runs `bun run dev` / equivalent; messages errors)
└── qa-tester           (exercises the feature; messages bugs)
```

## Setup checklist

### 1. Verify cmux teams + gitignore

Per the parent SKILL.md detection block. If editing code, ensure `.claude/worktrees/` is gitignored.

### 2. Create worktrees (recommended for engineer)

```bash
git worktree add --detach <project>/.claude/worktrees/engineer main
```

Dev-watcher and qa-tester usually don't need their own worktrees — they're read-only watchers. Keep them in the lead's checkout (or wherever the dev server is reachable).

### 3. Create the team

```
TeamCreate({
  team_name: "<feature-slug>",
  agent_type: "team-lead",
  description: "Build <feature> with engineer + dev-watcher + qa-tester loop"
})
```

### 4. Write three agent definitions

Drop these at `<project>/.claude/agents/`:

#### `engineer.md`

```markdown
---
name: engineer
description: Implements feature code from the plan. Lives in an isolated worktree; pushes branches and opens PRs.
model: sonnet
---

You are the engineer. Build <feature> from the plan at <path>.

## Required reading
1. The plan
2. CONTEXT.md (domain language)
3. docs/adr/ (locked architectural decisions)
4. .claude/agents/dev-watcher.md and .claude/agents/qa-tester.md (your peers)

## Your role
- Owned files: code under <feature path>
- Forbidden files: CLAUDE.md, CONTEXT.md, docs/adr/*, .github/workflows/*
- Output: feature branches `feat/<slug>`, one PR per task

## Communication protocol
- After each commit, message dev-watcher: `COMMITTED <sha> — <subject>`
- If dev-watcher reports a build error, fix and re-commit before doing anything else
- If qa-tester reports a bug, fix in the same branch
- Message team-lead `BLOCKED` only if you genuinely cannot proceed
```

#### `dev-watcher.md`

```markdown
---
name: dev-watcher
description: Runs the dev server / test runner; relays errors to engineer.
model: haiku
---

You are the dev-watcher. Run `bun run dev` (or the project's equivalent) and watch for compile / runtime errors.

## Required reading
1. The project's README and dev-loop docs
2. .claude/agents/engineer.md (peer)

## Your role
- Owned: terminal running the dev process; nothing else
- Forbidden: editing any files

## Communication protocol
- On dev-server startup success: message engineer `DEV_READY at <url>`
- On compile error: message engineer with the file:line + error message
- On runtime error: message engineer with the stack trace
- On all-clear after engineer's commit: message qa-tester `READY_TO_QA <sha>`
- On dev-server crash: message team-lead `DEV_CRASHED — <reason>`
```

#### `qa-tester.md`

```markdown
---
name: qa-tester
description: Exercises the feature in a browser / curl session and reports bugs to engineer.
model: sonnet
---

You are the qa-tester. Once dev-watcher signals READY_TO_QA, exercise <feature> against the running dev server.

## Required reading
1. The plan's user stories / acceptance criteria
2. .claude/agents/engineer.md and .claude/agents/dev-watcher.md (peers)

## Your role
- Owned: browser automation / curl session against the dev URL
- Forbidden: editing any project files (you may write test scripts under tests/manual/ if asked)

## Communication protocol
- On READY_TO_QA: run the test plan
- For each bug found: message engineer with reproduction steps + expected vs actual
- On all-clear: message team-lead `QA_GREEN <sha>`
- On dev-server reachable but feature broken: message engineer + team-lead

For browser automation, defer to the `cmux-browser` skill.
```

### 5. Spawn

Three Agent calls in parallel (single message). Use the manual-worktree pattern for engineer:

```
Agent({
  subagent_type: "engineer",
  team_name: "<feature-slug>",
  name: "engineer",
  prompt: "cd <project>/.claude/worktrees/engineer FIRST. Verify pwd. Install deps. Read .claude/agents/engineer.md. Begin task <n>.",
  run_in_background: true
})
Agent({
  subagent_type: "dev-watcher",
  team_name: "<feature-slug>",
  name: "dev-watcher",
  prompt: "Run `bun run dev` (or the equivalent) and watch for errors. Stay in the lead's checkout. Read .claude/agents/dev-watcher.md.",
  run_in_background: true
})
Agent({
  subagent_type: "qa-tester",
  team_name: "<feature-slug>",
  name: "qa-tester",
  prompt: "Wait for dev-watcher's READY_TO_QA signal, then exercise the feature per the plan. Read .claude/agents/qa-tester.md.",
  run_in_background: true
})
```

### 6. Drive the loop

- Lead receives status messages, breaks ties, tracks tasks via TaskCreate/TaskUpdate.
- When all tasks complete + qa-tester reports `QA_GREEN`, send `shutdown_request` to all three.

## Operating notes specific to this mode

- **Engineer should rotate first.** Their context grows fastest. Dev-watcher and qa-tester usually survive the whole feature.
- **Don't put engineer and qa-tester in the same worktree.** Engineer is editing; qa-tester is exercising. Race risk.
- **Browser-based qa benefits hugely from `cmux-browser`.** Spawn the qa-tester with that skill loaded.

## Cross-references

- Parent: [SKILL.md](../SKILL.md) — detection, common spawn shape, rotation, anti-patterns
- Sibling: [`afk-runner.md`](afk-runner.md) — for unsupervised queue draining instead of feature build
- External: `team-harness` skill — original three-role archetype design
