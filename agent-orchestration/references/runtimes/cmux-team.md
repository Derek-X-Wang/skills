# cmux Claude teams overlay

cmux is a host overlay for a Claude Code team. Use this file only when the current Claude session is running through `cmux claude-teams` or current runtime evidence proves an equivalent setup.

## Detect the overlay

Inspect injected metadata, exposed Claude team tools, and these environment signals when present:

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
- `TMUX` with a cmux Claude-team shim path
- `TMUX_PANE`
- `CMUX_SOCKET_PATH`

Do not require every variable when native tools and visible panel behavior already prove the runtime. If the evidence is partial and spawning could alter the layout, stop and ask the orchestrator or human to relaunch correctly.

## Spawn and coordinate

Use the native Claude team lifecycle exposed in the session. When supported, a teammate spawn with a team name becomes a separate cmux panel. Do not create agent panels with raw tmux commands.

Apply the global hub-and-spoke rule even though Claude teams can support peer messages:

```text
cmux lead panel
├─ worker panel   ── reports only to lead
├─ watcher panel  ── reports only to lead
└─ reviewer panel ── reports only to lead
```

Treat idle as available, not failed or complete. Send explicit follow-up work through the lead. Shut down teammates explicitly when the run ends.

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

The replacement must acknowledge the contract to the lead before work starts.

External reference: <https://cmux.com/docs/agent-integrations/claude-code-teams>
