---
name: cmux-team
description: Run a Claude Code agent team inside a cmux claude-teams session. Use when the current session was launched via `cmux claude-teams` and you want to spawn teammates that surface as separate cmux panels. Covers detection, the spawn → coordinate → shutdown contract, and a mode index — pick the matching `modes/<mode>.md` for the topology you actually want (feature build, AFK runner, parallel AFK runners, structured debate, parallel research).
---

# cmux Team

You are inside a **cmux claude-teams** session and want to operate the Claude Code agent-team feature so that each teammate appears as its own cmux panel.

This SKILL.md is the **router**. It covers the detection, mechanics, and operating principles common to every cmux-team topology. The actual playbook for how teammates are configured + coordinated lives in `modes/<mode>.md` — pick one and follow it.

## When to use

- Current session was launched via `cmux claude-teams` (verify with the detection block below).
- You want parallel teammates that:
  - Are visible to the user as discrete cmux panels.
  - Can DM each other and the lead automatically.
  - Optionally work in isolated git worktrees.

If you only need a single subagent without a panel, use the `Agent` tool without `team_name` — that runs as an internal subagent, not a teammate.

## Modes

Pick the mode matching the user's intent. **Don't blend modes** — each `modes/<file>.md` is a self-contained playbook with its own role definitions, communication protocol, and shutdown procedure.

| Mode | When | File |
|---|---|---|
| **Feature build** (engineer + dev-watcher + qa-tester) | Build a feature with structured roles: one writes code, one watches dev server, one runs e2e. The classic `team-harness` shape. | [`modes/feature-build.md`](modes/feature-build.md) |
| **AFK runner** (single) | Drain a `ready-for-agent` issue queue overnight. One teammate picks issues, opens PRs, lets CI auto-merge, loops until the queue is exhausted or every remaining issue is blocked. | [`modes/afk-runner.md`](modes/afk-runner.md) |
| **Parallel AFK runners** | Same as AFK runner but multiple runners working different issues concurrently. Requires that the issues are genuinely independent (no shared files) — most queues are not. | [`modes/parallel-afk-runners.md`](modes/parallel-afk-runners.md) |
| **Structured debate** | Two (or more) teammates argue opposing positions on a design decision; the lead synthesises. Useful when the right answer needs adversarial pressure. | [`modes/debate.md`](modes/debate.md) |
| **Parallel research** | Multiple read-only investigators on different parts of a codebase. No code edits — pure exploration in parallel. | [`modes/parallel-research.md`](modes/parallel-research.md) |

If none of the above fit, write a fresh playbook. Don't shoehorn the work into an ill-fitting mode.

## Detection

Run this once at the start of the session. If it fails, tell the user the skill doesn't apply and stop.

```bash
env | grep -E '^(CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS|TMUX|CMUX_PANEL_ID|CMUX_SOCKET_PATH)='
```

Required signals (all must be present):

| Variable | Expected | Meaning |
|---|---|---|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `1` | Agent-team feature is enabled |
| `TMUX` | `/tmp/cmux-claude-teams/...` | Inside the cmux tmux shim |
| `CMUX_PANEL_ID` | UUID | Current cmux panel identifier |
| `CMUX_SOCKET_PATH` | path to `cmux.sock` | cmux control socket |

If `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is missing but the user says they launched with `cmux claude-teams`, the user probably opened the panel before turning on claude-teams mode — ask them to relaunch.

## How spawning becomes a panel

You do **not** invoke `tmux split-window` yourself. The cmux claude-teams shim translates the Agent tool's spawn call into a `new-window` operation on the cmux side, which renders as a fresh panel. Just call `Agent` with `team_name` set; cmux handles the rest.

| tmux command | cmux operation |
|---|---|
| `new-session`, `new-window` | new cmux workspace |
| `split-window` | splits current pane |
| `send-keys` | sends text to a surface |
| `select-pane`, `select-window` | focus |
| `kill-pane`, `kill-window` | close |

Source: <https://cmux.com/docs/agent-integrations/claude-code-teams>

## Common spawn pattern

Every mode follows this shape; specifics live in the mode's playbook.

### 1. Create the team

```
TeamCreate({
  team_name: "<short-kebab-case>",
  agent_type: "team-lead",
  description: "<one-sentence purpose>"
})
```

This creates `~/.claude/teams/<team_name>/config.json` and an associated task list at `~/.claude/tasks/<team_name>/`.

### 2. Write custom agent definitions

For each non-default role, drop a markdown file at `<project>/.claude/agents/<role>.md`:

```markdown
---
name: <role-name>
description: <when to use this teammate, and what they own>
model: sonnet
---

You are the <role>. <Crisp role description>.

## Required reading
1. <files the teammate must read first>

## Your role
- <what this teammate owns>
- <files/outputs they produce>
- <files/areas they must NOT touch>

## Communication protocol
- When <event>, message <peer> with <signal>
- When <event>, message the team lead with <signal>
```

Keep agent definitions tight and **disjoint from other roles' files** — overlap causes overwrites.

### 3. Spawn each teammate

```
Agent({
  description: "<short label>",
  subagent_type: "<role-name>",
  team_name: "<the team>",
  name: "<teammate display name>",
  prompt: "<self-contained kickoff>",
  run_in_background: true
})
```

`run_in_background: true` keeps the orchestrator (you) free to keep talking to the user while the teammate cooks. Idle notifications surface as messages when each turn ends — that's normal, not an error.

**About `isolation: "worktree"`:** the official harness flag is supposed to create a per-teammate git worktree, but as of this writing it has been observed to silently fall back to sharing the lead's working tree, causing race conditions and lost commits. **Don't rely on it.** When you need real filesystem isolation, create a worktree manually (see "Worktrees" below) and `cd` into it from the teammate's prompt.

### 4. Coordinate

- **Track milestones in TaskCreate** so the team list is the shared plan of record.
- **Mark tasks completed** with TaskUpdate as teammates report in.
- **Receive teammate messages automatically** — they appear as new conversation turns.
- **Send follow-ups** with `SendMessage({to: "<teammate name>", message: "..."})`.
- **Shut down** when the work is done: `SendMessage({to: "<teammate>", message: {type: "shutdown_request"}})`.

## Worktrees: real isolation

`.claude/worktrees/` **must** be gitignored. Verify + auto-add before spawning any teammate that will edit code:

```bash
GITIGNORE="<project>/.gitignore"
PATTERN=".claude/worktrees/"
if ! grep -qxF "$PATTERN" "$GITIGNORE" 2>/dev/null; then
  printf "\n# cmux-team worktree isolation\n%s\n" "$PATTERN" >> "$GITIGNORE"
fi
```

Create the worktree manually, NOT via `isolation: "worktree"`:

```bash
git worktree add --detach <project>/.claude/worktrees/<teammate-name> main
```

`--detach` puts the worktree on a detached HEAD at main's tip — the teammate creates feature branches off there. If you want the worktree on a named branch instead, use `git worktree add -b <branch>` and tell the teammate to branch off it.

Bake the worktree path into the teammate's spawn prompt as the **first instruction**:

> Run `cd /Users/.../<project>/.claude/worktrees/<teammate-name>` and verify with `pwd && git worktree list`. Stay in this worktree for your entire lifetime; do not `cd` elsewhere. Then `bun install` (or your project's equivalent) and read `.claude/agents/<role>.md`.

## Operating principles (apply to every mode)

- **Idle is the resting state.** A teammate going idle right after sending you a message is normal — they're waiting for your reply. Don't dispatch new work just because a teammate looks idle; only act if you have something for them to do.
- **One teammate, one lane.** Two teammates editing overlapping files cause overwrites. Make each teammate's owned files explicit in their `.claude/agents/<role>.md`. With real worktrees this is structurally enforced; without them, it's a discipline rule.
- **Lead doesn't do teammate work.** Resist the urge to fix a bug yourself when an engineer teammate is on the team — your job is coordination, not execution.
- **Pre-approve common permissions.** Teammate permission requests bubble up to the lead and create friction. Either set `--dangerously-skip-permissions` for the team session or pre-allow common operations in `.claude/settings.local.json`.
- **Shut the team down explicitly when done.** Otherwise teammates linger in the cmux layout.

## Rotating teammates as context degrades

Long-running teams (multi-task milestones, multi-day debugging loops) hit a problem the cmux harness doesn't solve for you: each teammate has a fixed context window. An engineer teammate who's executed three substantive tasks can drop below 30% remaining before you notice, then exhaust mid-Task-4 and produce garbage.

**Watch the teammate's context-remaining %.** It surfaces in the cmux panel header. Roughly:

| Remaining | Action |
|---|---|
| ≥ 50% | Keep going. |
| 30%–50% | Plan a rotation at the next clean handoff point (end of current task). |
| < 30% | Rotate now if a non-trivial task is queued; stretching is risky. |

**Rotate at task boundaries, not mid-task.** A task in flight has un-committed mental state (the engineer's plan-in-progress, the partial test, the half-thought-through edge case). Rotating mid-task forces the new teammate to reconstruct that state from terse handoff text — slow and error-prone. Wait for the current task to commit + reviewers to approve, then swap.

**Reviewers usually don't need to rotate.** Spec/quality reviewers do small, self-contained scans per commit; their context grows slowly. Engineers, planners, and any teammate that *produces* output rotate first.

**Handoff doc shape (~30 lines, drop under `docs/<milestone>-handoffs/<role>-T<n>.md`):**

```markdown
# <Role> handoff — after Task <n>

**Last commit (HEAD):** <sha> — <subject>
**Status:** <closed / blocked / mid-flight>; <reviewer outcomes>

## What landed in <sha>
- <files touched>
- <key decisions / deviations>
- <tests added>

## Carry-forward minors (fold into Task <n+1>)
1. <issue + recommended fix>

## Next: Task <n+1>
**Plan reference:** <path>:<line range>
**Scope:** <one paragraph>
**Items to create/modify:** <bullet list>
**Tests:** <bullet list>
**No-touch:** <areas this task explicitly does NOT change>

## Read order for fresh teammate
1. `.claude/agents/<role>.md`
2. This handoff
3. <plan §>
4. <relevant code files for style reference>

## Constraints
<repo-level invariants the new teammate must internalize>

## Acknowledge
Reply with `READY_FOR_TASK_<n+1>` + clarifying questions before starting.
```

**Rotation procedure (in order):**

1. Wait for the current task to commit + reviewers to approve (or, in AFK runner mode, for the current PR to merge).
2. Write the handoff doc to a milestone-scoped folder. Don't put it in CLAUDE.md or other always-loaded locations — it's transient.
3. Send `SendMessage({to: "<teammate>", message: {type: "shutdown_request"}})` to the outgoing teammate.
4. Spawn the replacement with `Agent({..., name: "<same role name>", prompt: "Read <handoff path> first, then reply READY_FOR_TASK_<n+1>"})`. cmux usually re-uses the role name; if the slot is held it auto-renames to `<role>-2` — accept it.
5. Wait for the new teammate's `READY_*` reply before dispatching the next task.

**Track handoffs in git.** Even if the milestone-handoffs folder is small, commit it. Future debugging benefits from the breadcrumb trail.

## Anti-patterns

- ❌ Manually invoking `tmux split-window` to create a panel. Use `Agent` with `team_name`; cmux handles the panel.
- ❌ Defining teammates without owned-file boundaries. Inevitable overwrites.
- ❌ Trusting `isolation: "worktree"` for real filesystem isolation. Create the worktree manually.
- ❌ Spawning worktree-isolated teammates without first verifying `.claude/worktrees/` is gitignored.
- ❌ Treating idle notifications as errors or as "the teammate is done." Idle = available.
- ❌ Reusing role names across unrelated teams. Names are per-team-config; keep them descriptive.
- ❌ Blending modes — running an "AFK runner" with a "QA tester" peer that doesn't fit the queue model just creates noise. Pick one.

## Cross-references

| Skill | Use for |
|---|---|
| `team-harness` | Reference shape for the engineer / dev-watcher / qa-tester archetypes; this skill's `modes/feature-build.md` builds on it. |
| `cmux` | Direct cmux topology control (move surfaces, focus panes, list windows) |
| `cmux-browser` | Browser-automation surfaces for QA-tester teammates |
| `cmux-markdown` | Live-reload markdown viewer panel for design docs / specs |

External: <https://cmux.com/docs/agent-integrations/claude-code-teams>
