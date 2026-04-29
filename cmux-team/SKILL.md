---
name: cmux-team
description: Run a Claude Code agent team inside a cmux claude-teams session. Use when the current session was launched via `cmux claude-teams` and you want to spawn teammates that surface as separate cmux panels. Triggers on "spawn a teammate", "launch the team", "use the agent team feature", or any time the user wants parallel agents in a cmux layout. Covers detection, custom-agent definitions, isolated worktree placement under `.claude/worktrees/`, and the orchestrator-vs-teammate communication contract.
---

# cmux Team

You are inside a **cmux claude-teams** session and want to operate the Claude Code agent-team feature so that each teammate appears as its own cmux panel.

This skill is the *operating manual* for the cmux-team flow. For role design (engineer / dev-watcher / qa-tester archetypes), defer to the `team-harness` skill. For non-team cmux topology control, defer to the `cmux` skill.

## When to use

- Current session was launched via `cmux claude-teams` (verify with the detection block below).
- You want parallel teammates that:
  - Are visible to the user as discrete cmux panels.
  - Can DM each other and the lead automatically.
  - Optionally work in isolated git worktrees under `.claude/worktrees/`.
- Useful patterns:
  - **Structured debate** (e.g. Option-A advocate vs Option-B advocate for a design decision).
  - **Parallel research** (multiple read-only investigators on different parts of a codebase).
  - **Engineer / dev-watcher / QA loop** — see `team-harness`.

If you only need a single subagent without a panel, use the `Agent` tool without `team_name` — that runs as an internal subagent, not a teammate.

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

The supported tmux commands the shim understands (for reference, not direct use):

| tmux command | cmux operation |
|---|---|
| `new-session`, `new-window` | new cmux workspace |
| `split-window` | splits current pane |
| `send-keys` | sends text to a surface |
| `select-pane`, `select-window` | focus |
| `kill-pane`, `kill-window` | close |

Source: <https://cmux.com/docs/agent-integrations/claude-code-teams>

## Setup checklist

Follow in order. Skip a step only if it's already done.

### 1. Create the team

```
TeamCreate({
  team_name: "<short-kebab-case>",
  agent_type: "team-lead",  // or any descriptive role
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
model: sonnet  # or haiku for cheap watcher roles
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

## Output location
<file path or "n/a — communication only">
```

Keep the agent definition tight and **disjoint from other roles' files** — overlap causes overwrites.

### 3. Spawn each teammate

```
Agent({
  description: "<short label>",
  subagent_type: "<role-name>",          // matches name in .claude/agents/<role>.md
  team_name: "<the team>",
  name: "<teammate display name>",        // used for messaging
  prompt: "<self-contained kickoff>",
  run_in_background: true,                // recommended for teammates
  isolation: "worktree"                   // OPTIONAL — see "Worktrees" below
})
```

`run_in_background: true` keeps the orchestrator (you) free to keep talking to the user while the teammate cooks. Idle notifications surface as messages when each turn ends — that's normal, not an error.

### 4. Coordinate

- **Track milestones in TaskCreate** so the team list is the shared plan of record.
- **Mark tasks completed** with TaskUpdate as teammates report in.
- **Receive teammate messages automatically** — they appear as new conversation turns.
- **Send follow-ups** with `SendMessage({to: "<teammate name>", message: "..."})`.
- **Shut down** when the work is done: `SendMessage({to: "<teammate>", message: {type: "shutdown_request"}})`.

## Worktrees: `.claude/worktrees/`

Use git worktree isolation when teammates will edit code that could conflict, when you want a clean diff per teammate, or when the user explicitly asks for parallel branches.

**Always place worktrees under `<project>/.claude/worktrees/`.** This keeps them adjacent to the team config but separate from the main checkout.

Pass `isolation: "worktree"` to the Agent tool. The harness creates the worktree, hands the teammate an isolated copy, and (if no changes are made) automatically cleans up.

### Required gitignore

`.claude/worktrees/` **must** be gitignored. Before spawning the first worktree-isolated teammate, ensure the project's `.gitignore` contains:

```
.claude/worktrees/
```

Verification + auto-add:

```bash
GITIGNORE="<project>/.gitignore"
PATTERN=".claude/worktrees/"
if ! grep -qxF "$PATTERN" "$GITIGNORE" 2>/dev/null; then
  printf "\n# cmux-team worktree isolation\n%s\n" "$PATTERN" >> "$GITIGNORE"
  echo "added $PATTERN to $GITIGNORE"
fi
```

If the project has no `.gitignore`, create one at the repo root and add the entry. Don't spawn worktree-isolated teammates without this — otherwise the worktree contents leak into git status and confuse the user.

## Operating principles

- **Idle is the resting state.** A teammate going idle right after sending you a message is normal — they're waiting for your reply. Don't dispatch new work just because a teammate looks idle; only act if you have something for them to do.
- **One teammate, one lane.** Two teammates editing overlapping files cause overwrites. Make each teammate's owned files explicit in their `.claude/agents/<role>.md`.
- **Lead doesn't do teammate work.** Resist the urge to fix a bug yourself when an engineer teammate is on the team — your job is coordination, not execution.
- **Pre-approve common permissions.** Teammate permission requests bubble up to the lead and create friction. Either set `--dangerously-skip-permissions` for the team session or pre-allow common operations in `.claude/settings.local.json`.
- **Shut the team down explicitly when done** — see `SendMessage({type: "shutdown_request"})` above. Otherwise teammates linger in the cmux layout.

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
2. <issue + recommended fix>

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
<repo-level invariants the new teammate must internalize: lint config, lock-file rules, B-constraints, tag-push policies, ignored test failures>

## Acknowledge
Reply with `READY_FOR_TASK_<n+1>` + clarifying questions before starting.
```

**Rotation procedure (in order):**

1. Wait for the current task to commit + both reviewers to approve.
2. Write the handoff doc to a milestone-scoped folder. Don't put it in CLAUDE.md or other always-loaded locations — it's transient.
3. Send `SendMessage({to: "<teammate>", message: {type: "shutdown_request"}})` to the outgoing teammate.
4. Spawn the replacement with `Agent({..., name: "<same role name>", prompt: "Read <handoff path> first, then reply READY_FOR_TASK_<n+1>"})`. cmux usually re-uses the role name; if the slot is held it auto-renames to `<role>-2` — accept it.
5. Wait for the new teammate's `READY_*` reply before dispatching the next task.

**The handoff doc is the contract.** A fresh teammate with no conversation history must reach equivalent operating capacity from the doc + the agent definition + the milestone plan. If the doc misses something, the next teammate's clarifying questions will surface it — fix the doc and re-spawn.

**Track handoffs in git.** Even if the milestone-handoffs folder is small, commit it. Future debugging ("why did Task 4 drop test coverage?") benefits from the breadcrumb trail.

## Anti-patterns

## Anti-patterns

- ❌ Manually invoking `tmux split-window` to create a panel. Use `Agent` with `team_name`; cmux handles the panel.
- ❌ Defining teammates without owned-file boundaries. Inevitable overwrites.
- ❌ Spawning worktree-isolated teammates without first verifying `.claude/worktrees/` is gitignored.
- ❌ Treating idle notifications as errors or as "the teammate is done." Idle = available.
- ❌ Reusing role names across unrelated teams. Names are per-team-config; keep them descriptive.

## Cross-references

| Skill | Use for |
|---|---|
| `team-harness` | Default engineer / dev-watcher / qa-tester archetypes for feature dev or debugging |
| `cmux` | Direct cmux topology control (move surfaces, focus panes, list windows) |
| `cmux-browser` | Browser-automation surfaces for QA-tester teammates |
| `cmux-markdown` | Live-reload markdown viewer panel for design docs / specs |

External: <https://cmux.com/docs/agent-integrations/claude-code-teams>
