# Orca host and control plane

Use Orca as a host, control plane, and route for Orca-managed worktrees, terminals, mailboxes, and cross-terminal dispatch. It can host different harnesses and model providers.

## Detection

Check injected runtime data first. Then inspect `ORCA_TERMINAL_HANDLE`, `TERM_PROGRAM`, and the presence of the `orca` CLI. An environment handle can become stale after a pane restart, so verify the live terminal before a long wait.

## Operational handoff

- Load `orchestration` before Orca task, structured dispatch, mailbox, wait, ask/reply, decision-gate, or worker-lifecycle actions.
- Load `orca-cli` before Orca account or quota inspection and before worktree, terminal, terminal-level prompt delivery, repository, artifact, skill-sharing, or browser-host actions.

This reference owns Orca capability mapping and orchestration invariants. The operational skills own executable resolution and current commands. Use their version-matched live guide when available. If a required skill or guide is unavailable, use verified read-only discovery only, then choose another route. Never guess a mutating command.

## Routing

- Use Orca orchestration for work in another Orca terminal or worktree.
- When current subscription usage can change the worker route, read it through Orca's version-matched public account surface whenever the current machine can reach its local Orca CLI and runtime. Use this surface even when another harness or host UI contains the session. Treat missing, stale, or failed provider data as unverified. Do not read credential storage.

For a supervised run, prefer an explicit task lifecycle that keeps worker messages visible: create the task, dispatch to the verified terminal, wait on the live coordinator mailbox, and inspect task state. Use this only when the live guide or observed route proves support for the selected harness. An agent identifier or successful terminal launch does not prove prompt delivery or completion reporting. Before declaring a timeout, inspect the inbox and task list because a completion message can land on a newer live handle.

The current OpenCode manual fallback is not a successful task lifecycle. Create or target it through Orca's terminal and worktree surface. A failed structured OpenCode task can leave a usable TUI, but its `failed` record describes the automation failure, not the later manual worker result. Verify that result from fresh terminal and repository evidence.

For terminal-level prompt delivery, prove from a fresh terminal read that the intended agent is the foreground process before every send. A terminal handle proves terminal identity only. Treat interrupt behavior as harness-specific. Do not assume that an interrupt pauses the agent. After any interrupt or agent exit, prove foreground-agent readiness again before sending text. Never deliver an agent brief to a shell prompt.

After Orca creates a worktree, verify that its actual HEAD equals the intended commit before dispatch. A named base branch can resolve through a stale local ref. Prefer an explicit remote ref or commit SHA when exact base identity matters.

Treat model launch flags, built-in agent identifiers, and mailbox behavior as versioned CLI details. Recheck them before use. Never place approval bypass flags into a durable shared playbook.

Use Orca from the start when work needs a durable, visible, interactive, multi-round, or AFK external session and the selected harness has a proven dispatch and return path. Keep one worktree per editing worker. Dispatch only to the intended live terminal and foreground agent. Do not use Orca to create peer communication between workers. Read [opencode.md](opencode.md) before routing an OpenCode worker because the current field-tested path has stricter limits.
