# cmux host and Claude teams overlay

Treat cmux as a host. Use the operational handoff whenever the current session runs in cmux. Apply the team coordination, isolation, and rotation sections only when the current Claude session uses the cmux Claude teams integration or runtime evidence proves an equivalent setup.

## Detect the host and overlay

Inspect injected metadata and `CMUX_SOCKET_PATH` for the host. Inspect exposed Claude team tools and these additional signals for the team overlay when present:

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
- `TMUX` with a cmux Claude-team shim path
- `TMUX_PANE`

Do not require every variable when native tools and visible panel behavior already prove the runtime. If only the cmux host is proven, use the operational handoff but skip the team sections. If the team evidence is partial and spawning could alter the layout, do not spawn. A worker reports the limit to the orchestrator. The active orchestrator may ask the human to relaunch.

## Operational handoff

- When the team overlay is proven, use the native Claude Code team lifecycle for teammate creation, messages, follow-up work, waits, and shutdown.
- Load `cmux` before changing cmux windows, workspaces, panes, surfaces, focus, or placement.

This reference owns cmux capability mapping and the Claude-team overlay invariants. Claude Code owns teammate mechanics. The `cmux` skill owns current topology commands. If that skill is unavailable, keep the existing layout and do not guess cmux commands.

## Spawn and coordinate

Use the native Claude team lifecycle exposed in the session. When supported, a teammate spawn with a team name becomes a separate cmux panel. Do not create agent panels with raw tmux commands.

Apply the global hub-and-spoke rule even though Claude teams can support peer messages:

```text
cmux active-orchestrator panel
├─ worker panel   ── reports only to orchestrator
├─ watcher panel  ── reports only to orchestrator
└─ reviewer panel ── reports only to orchestrator
```

Treat idle as available, not failed or complete. Send explicit follow-up work through the orchestrator. Shut down teammates explicitly when the run ends.

## Isolate edits

Verify worktree behavior before relying on a harness isolation flag. If reliable isolation is not proven, create each editing worker's worktree with normal Git commands and pass its absolute path as the first dispatch instruction.

Before creating a project-local worktree directory, verify that the directory is ignored or choose a location outside the checkout. Do not edit `.gitignore`, assume the base branch name, install dependencies, or change permission settings without authority.

## Rotate long-running roles

Rotate an editing role at a clean task boundary when its context is degraded. Do not rotate in the middle of uncommitted reasoning or partial verification. If the panel exposes context remaining, plan a boundary below 50% and rotate before assigning substantial new work below 30%.

Use a short handoff artifact:

```markdown
# <role> handoff after <task>

- Last accepted commit or artifact: <identifier>
- Outcome and verification: <evidence>
- Accepted decisions: <list>
- Open same-invariant findings: <list>
- Next task scope and no-touch areas: <contract>
- Read order: <paths>
- Stop conditions: <conditions>
```

The replacement must acknowledge the contract to the orchestrator before work starts.

External reference: <https://cmux.com/docs/agent-integrations/claude-code-teams>
