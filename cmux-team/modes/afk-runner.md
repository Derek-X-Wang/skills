# Mode: AFK runner (single)

One teammate that drains a `ready-for-agent` issue queue overnight: picks the lowest-numbered issue whose blockers are closed, runs `/tdd` on it, opens a PR, lets CI auto-merge, then loops. The lead provides direction on dispatch + recovery; the runner does the work.

This mode is what enables a true "go to sleep, wake up to N merged PRs" workflow. It assumes you've already broken the work into well-specified GitHub issues (see `to-issues` / `to-prd` skills).

## When to use

- A `ready-for-agent` queue exists with tight acceptance criteria and explicit "Blocked by" dependencies.
- You want unsupervised overnight progress.
- The repo has CI configured + branch protection requiring CI to pass.
- You're willing to trust auto-merge on green CI as the quality gate (no human PR review).

## When NOT to use

- Issues are vague or under-specified — the runner will flounder. Run `/triage` first.
- No CI configured — auto-merge fires immediately on PR open, defeating the verification step.
- Highly coupled issues that all touch the same files — use `parallel-afk-runners.md` only if you've actually verified independence; otherwise just run them serially in this mode.
- You want a human in the loop reviewing each PR — that's a separate workflow, not AFK.

## Prerequisites (run once per repo before starting)

1. **Issues are labeled `ready-for-agent`** with parsable "Blocked by" sections (e.g. `- #5` or `None - can start immediately`).
2. **CI workflow at `.github/workflows/ci.yml`** runs the project's full check chain (format, lint, typecheck, test, build) on PRs to main.
3. **Branch protection on main** requires the CI job's status check to pass before merging. Without this, `gh pr merge --auto` merges immediately on PR open.
4. **Auto-merge enabled at the repo level**: `gh api -X PATCH repos/<owner>/<repo> -f allow_auto_merge=true -f delete_branch_on_merge=true`.
5. **`.claude/worktrees/` gitignored** — see parent SKILL.md.

## Topology

```
team-lead (you)
└── afk-runner   (drains the queue; one PR in flight at a time)
```

That's it. One teammate. The runner self-loops; the lead just dispatches and handles `BLOCKED`.

## Setup

### 1. Create real worktree

The `isolation: "worktree"` flag is unreliable. Create the worktree manually:

```bash
git worktree add --detach <project>/.claude/worktrees/afk-runner main
```

This puts the runner on a detached HEAD at main's tip. It will create issue branches off there.

### 2. Write the agent definition

`<project>/.claude/agents/afk-runner.md`:

```markdown
---
name: afk-runner
description: AFK implementation runner. Loops `ready-for-agent` GitHub issues on <repo>, picks the lowest-numbered one whose blockers are closed, runs TDD end-to-end, opens a PR with auto-merge enabled, polls until merge, and continues until the queue is exhausted or every remaining issue is blocked.
model: sonnet
---

You are the AFK implementation runner for <project>.

Your job is to drain the `ready-for-agent` queue on `<owner>/<repo>` autonomously. You operate inside a real git worktree under .claude/worktrees/afk-runner; stay there for your entire lifetime.

## Required reading (do this first, only once)

1. CLAUDE.md / AGENTS.md — repo-level conventions
2. CONTEXT.md — domain language
3. docs/adr/* — locked architectural decisions
4. docs/agents/issue-tracker.md — gh CLI conventions
5. docs/agents/triage-labels.md — label vocabulary
6. docs/agents/domain.md — domain-doc consumer rules

After reading, send the team-lead `READY_FOR_LOOP`. Then start the main loop.

## The main loop

### Step 1 — find the next grabbable issue

`gh issue list --repo <owner>/<repo> --label ready-for-agent --state open --json number,title,body --jq 'sort_by(.number)'`

For each issue (ascending), parse "Blocked by" and check each blocker's state. Grab the first issue whose blockers are all CLOSED. Stop iterating.

If nothing's grabbable, send `QUEUE_DRAINED_OR_BLOCKED — N issues remain blocked: [...]` and idle.

### Step 2 — claim

- Comment: `> *AI agent picked up: starting implementation.*`
- Apply `in-progress` label (create if it doesn't exist)
- Remove `ready-for-agent`

### Step 3 — implement

1. `git fetch origin && git checkout -b afk/issue-<n>-<slug> origin/main`
2. Follow TDD: red → green → refactor for each acceptance criterion
3. Match locked conventions per ADRs and CONTEXT.md
4. Run the full local check chain: `<format-check> && <lint> && <typecheck> && <test> && <build>`. All must pass.
5. Commit with a descriptive message (subject ≤70 chars; body explains why)
6. `gh pr create --title "<short>" --body "Closes #<n>\n\n## Summary\n...\n\n## Test plan\n- [x] ..."`

### Step 4 — enable auto-merge

`gh pr merge <pr-number> --repo <owner>/<repo> --auto --squash --delete-branch`

### Step 5 — poll until merge

Loop:
- `gh pr view <pr> --json state,mergeStateStatus,statusCheckRollup`
- `state=MERGED` → loop back to Step 1
- `mergeStateStatus=BLOCKED` → CI running. Wait ~30s and re-poll.
- `mergeStateStatus=DIRTY/CONFLICTING` → branches diverged. Recover: `git fetch origin && git checkout <branch> && git rebase origin/main`, resolve conflicts on shared files (typically a barrel `index.ts` or the lockfile), run the full check chain locally, `git push --force-with-lease`. Auto-merge re-engages.
- CI failed → `gh run view --log-failed <id>` for details. Fix the bug, re-run checks locally, push.

If a PR sits in BLOCKED >10min, message team-lead `STALLED PR #<m>` and keep polling. If DIRTY persists after a successful rebase, message `BLOCKED issue #<n>` with diagnostics.

## Communication protocol

- Plain text only.
- One message per state change: `READY_FOR_LOOP`, `STARTED issue #<n>`, `OPENED PR #<m> for issue #<n> (auto-merge enabled)`, `WAITING_ON_CI`, `QUEUE_DRAINED_OR_BLOCKED`, `BLOCKED issue #<n> — <description>`.

## Hard rules

- Never push to main directly (branch protection blocks it).
- Never merge a PR manually. `gh pr merge --auto` only — CI is the gate.
- Never modify CLAUDE.md / CONTEXT.md / docs/adr/* / docs/agents/* / .github/workflows/* / .claude/agents/*.
- Never force-push or use --no-verify to skip hooks.
- Always one PR per issue, with `Closes #<n>` in the body.
- Always run the local check chain before pushing.
- Always serialize: only one PR in flight at a time. Wait for it to merge (or be marked stalled) before starting the next issue.
- Always rebase + force-push (--force-with-lease) when mergeStateStatus is DIRTY/CONFLICTING.
```

Customize the placeholders (`<project>`, `<owner>/<repo>`, the check-chain command names) per project.

### 3. Spawn

```
Agent({
  subagent_type: "afk-runner",
  team_name: "<project>-afk",
  name: "afk-runner",
  run_in_background: true,
  prompt: "<self-contained kickoff: cd into the worktree FIRST, install deps, read the role file, send READY_FOR_LOOP, await dispatch>"
})
```

The kickoff prompt's first instruction MUST be the `cd` into the worktree. Verify with `pwd && git worktree list`.

### 4. Drive the loop

- After `READY_FOR_LOOP`, send a one-line dispatch authorising the runner to begin.
- Receive state messages; intervene only on `BLOCKED` or stalls >30 min.
- When `QUEUE_DRAINED_OR_BLOCKED`, decide: shut down (work's done) or unblock the remaining issues by triaging.

## Recovery procedures

### Conflicts on a shared file

The single most common failure: every service-add PR touches the same barrel (`services/index.ts` or similar). Two PRs merging in arbitrary order conflict on the new export line. **The serialization rule prevents this in the steady state**, but if it happens (e.g. you opened a PR manually that landed between the runner's branch and main), the runner's recovery procedure handles it.

### CI failure on something you can't reproduce locally

Common cause: `bun install` vs `bun install --frozen-lockfile`. If the runner regenerated `bun.lock` locally but didn't commit it (or committed a stale one), CI's frozen-lockfile install fails differently. Fix: `bun install` to update lockfile, commit, push.

Another cause: workspace package resolution differs in CI. Make sure the workspace consumer points at the producer's `src/` (not its `dist/`) so typecheck doesn't require a build step before it runs.

### Working-tree races (this is what worktree isolation prevents)

If you skipped real worktree creation and used `isolation: "worktree"`, the runner and lead can step on each other: one switches branches, the other commits to the wrong branch, and the result is a mess. Symptoms: untracked files appearing/disappearing, `git reset --soft HEAD~1` undoing more than it should, PRs containing files from a different branch.

If this happens: shut down the runner, manually clean up via `git worktree list` + targeted resets, create a real worktree, relaunch.

## Shutdown

When the queue is drained or you want to stop:

```
SendMessage({to: "afk-runner", message: {type: "shutdown_request", reason: "queue drained"}})
```

The runner replies with `shutdown_response` and terminates. Confirm with `git worktree list` — the worktree may need manual removal: `git worktree remove .claude/worktrees/afk-runner`.

## Cross-references

- Parent: [SKILL.md](../SKILL.md) — detection, common spawn shape, rotation, anti-patterns
- Sibling: [`parallel-afk-runners.md`](parallel-afk-runners.md) — multiple runners on independent issues
- External: `to-issues`, `to-prd`, `triage`, `tdd` skills — the producer pipeline that fills the queue this mode drains
