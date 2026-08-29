# Orca host and control plane

Use Orca as a host, control plane, and route for Orca-managed worktrees, terminals, mailboxes, and cross-terminal dispatch. It can host different harnesses and model providers.

## Detection

Check injected runtime data first. Then inspect `ORCA_TERMINAL_HANDLE`, `TERM_PROGRAM`, and the presence of the `orca` CLI. An environment handle can become stale after a pane restart, so verify the live terminal before a long wait.

## Operational handoff

- Load `orchestration` before Orca task, dispatch, mailbox, wait, ask/reply, decision-gate, or worker-lifecycle actions.
- Load `orca-cli` before Orca worktree, terminal, repository, artifact, skill-sharing, or browser-host actions.

This reference owns Orca capability mapping and orchestration invariants. The operational skills own executable resolution and current commands. Use their version-matched live guide when available. If a required skill or guide is unavailable, use verified read-only discovery only, then choose another route. Never guess a mutating command.

## Routing

- Use Orca orchestration for work in another Orca terminal or worktree.

For a supervised run, prefer an explicit task lifecycle that keeps worker messages visible: create the task, dispatch to the verified terminal, wait on the live coordinator mailbox, and inspect task state. Before declaring a timeout, inspect the inbox and task list because a completion message can land on a newer live handle.

Treat model launch flags, built-in agent identifiers, and mailbox behavior as versioned CLI details. Recheck them before use. Never place approval bypass flags into a durable shared playbook.

Use Orca from the start when work needs a durable, visible, interactive, multi-round, or AFK external session. Keep one worktree per editing worker. Dispatch only to the intended live terminal. Do not use Orca to create peer communication between workers.
