# Mode: Parallel AFK runners

Multiple AFK runners working different issues concurrently. Same loop as the single-runner mode, but with **claim coordination** so two runners don't grab the same issue, and **strict file-disjointness** so their PRs don't conflict.

## When to use

- The `ready-for-agent` queue has multiple issues that are **genuinely independent** — they touch disjoint files and have no transitive dependencies between each other.
- You've verified independence by reading the issue bodies and the planned file lists. Don't just hope; check.
- The repo's CI is fast enough that auto-merge keeps up with concurrent PRs.
- You're optimising overnight throughput hard and the single-runner mode is too slow.

## When NOT to use

- Most monorepos. A typical "service module" PR touches the service file + a shared barrel + the lockfile, and parallel PRs to such a queue are guaranteed to conflict.
- Any queue where you haven't manually verified disjointness — the cost of recovery from a conflict storm exceeds the throughput gain.
- Small queues (≤4 grabbable issues). Spinning up parallel coordination for 3 PRs is not worth it.

**Default to single-runner mode.** Only escalate to parallel when single is the bottleneck.

## What changes vs single-runner

| | Single runner | Parallel runners |
|---|---|---|
| Worktrees | One: `.claude/worktrees/afk-runner/` | One per runner: `.claude/worktrees/afk-runner-1/`, `.claude/worktrees/afk-runner-2/`, ... |
| Issue claim | Just label `in-progress`; no other runner exists | Each runner labels with `in-progress` AND `claimed-by-<runner-name>`; before claiming, check that nothing matches `claimed-by-*` already |
| Conflict risk | None (one PR at a time) | High if disjointness wasn't verified |
| Coordination | Serial polling | Each runner polls its own PR; lead aggregates |
| Recovery | Rebase its single PR | Whichever PR loses the race rebases; other proceeds |

## Topology

```
team-lead (you)
├── afk-runner-1   (worktree: .claude/worktrees/afk-runner-1)
├── afk-runner-2   (worktree: .claude/worktrees/afk-runner-2)
└── ...
```

Two runners is the typical case. Three or more rarely pays off — you usually run out of independent issues before independent runners.

## Setup

### 1. Verify independence (mandatory pre-flight)

For each pair of issues you intend to dispatch concurrently:

1. Read both issue bodies. List the files each will create or modify.
2. Compare the lists. Any overlap = conflict risk = serialize them.
3. Check for shared infrastructure: same lockfile area, same barrel/index file, same generated artifact.

If you can't confidently list non-overlapping file sets, **don't run parallel.** Drop to single-runner.

### 2. Create per-runner worktrees

```bash
git worktree add --detach <project>/.claude/worktrees/afk-runner-1 main
git worktree add --detach <project>/.claude/worktrees/afk-runner-2 main
```

### 3. Reuse the AFK runner agent definition with a coordination addendum

Start from `afk-runner.md` (the single-runner playbook). Add the following block to its **claim** step:

```markdown
### Step 2 — claim (parallel-aware)

Before claiming an issue:
1. Run `gh issue view <n> --json labels --jq '.labels[].name'`
2. If any label matches `claimed-by-*` (other than your own name), this issue is being worked on by a peer. **Skip it; iterate to the next.**
3. Otherwise:
   - Add labels: `in-progress`, `claimed-by-<your-runner-name>`
   - Remove `ready-for-agent`
   - Comment: `> *AI agent <your-name> picked up: starting implementation.*`

After your PR merges (or the issue is otherwise closed), the `claimed-by-*` label is automatically removed via the issue close. If the issue closes without your PR merging (e.g. someone closed it manually), assume your work is moot — drop the branch and loop.
```

The role definition's other rules (serialization within a runner, full local check chain, auto-merge on CI, etc.) are unchanged. **Each runner serializes its own work; the parallelism is across runners.**

### 4. Spawn each runner

In a single message with multiple Agent calls (so they spin up concurrently):

```
Agent({
  subagent_type: "afk-runner",
  team_name: "<project>-afk-parallel",
  name: "afk-runner-1",
  run_in_background: true,
  prompt: "cd <project>/.claude/worktrees/afk-runner-1 FIRST. Verify pwd. Install deps. Read .claude/agents/afk-runner.md. Use the parallel-aware claim procedure (skip issues already claimed-by-*). Your runner name is afk-runner-1. Send READY_FOR_LOOP_PARALLEL when ready."
})
Agent({
  subagent_type: "afk-runner",
  team_name: "<project>-afk-parallel",
  name: "afk-runner-2",
  run_in_background: true,
  prompt: "cd <project>/.claude/worktrees/afk-runner-2 FIRST. ... Your runner name is afk-runner-2. ..."
})
```

### 5. Drive

- Wait for both `READY_FOR_LOOP_PARALLEL` messages.
- Send each runner a one-line dispatch authorising the loop. They'll race to grab the lowest-numbered grabbable issue; the parallel-aware claim ensures only one wins.
- Status messages now arrive interleaved (`STARTED issue #11` from afk-runner-1, `STARTED issue #14` from afk-runner-2, …). Track them via TaskCreate or just by reading the conversation flow.

## Failure modes specific to parallel mode

### Runners both grab the same issue

Race window between "list grabbable issues" and "apply claim labels." If both runners check at the same time, both see the issue unclaimed and both try to claim. The label-add operation isn't transactional.

**Mitigation**: have each runner check labels AGAIN after applying its own claim. If `claimed-by-<other>` is now present, the other runner won the race — drop your work and re-loop. The losing runner has wasted some setup time but the conflict is caught at claim, not at PR creation.

### Issues you thought were independent turn out not to be

You verified disjointness up front, but one of the issues' acceptance criteria turns out to require an edit to a shared file. The PR conflicts with the other runner's PR.

**Mitigation**: the standard recovery procedure (rebase, force-push). The runner whose PR is older usually wins; the newer one rebases. If both runners try to rebase against each other repeatedly (rare but possible), one of them will message `BLOCKED` after a few cycles — at which point the lead picks the loser, sends it `pause`, lets the winner finish, then resumes.

### Lockfile churn

`bun.lock` / `pnpm-lock.yaml` updates from independent dependency adds. Both runners' PRs touch the lockfile. CI fails on the second PR with a frozen-lockfile mismatch.

**Mitigation**: avoid issues that add new deps in parallel mode. Or: build a lockfile-rebase helper into the runner's recovery procedure. For most overnight runs the simpler path is "queue lockfile-touching issues to single-runner mode."

### Two runners in the same team-lead message stream

Status messages from N runners arrive interleaved. Easy to lose track of which `STARTED issue #11` belongs to which runner.

**Mitigation**: every status message MUST include the runner's name as a prefix. Example: `[afk-runner-1] STARTED issue #11`. Bake this into the parallel-aware role definition's communication protocol section.

## Shutdown

```
SendMessage({to: "afk-runner-1", message: {type: "shutdown_request"}})
SendMessage({to: "afk-runner-2", message: {type: "shutdown_request"}})
```

After both confirm, manually remove the worktrees:

```bash
git worktree remove .claude/worktrees/afk-runner-1
git worktree remove .claude/worktrees/afk-runner-2
```

## Cross-references

- Parent: [SKILL.md](../SKILL.md)
- Sibling: [`afk-runner.md`](afk-runner.md) — the single-runner baseline this mode extends
