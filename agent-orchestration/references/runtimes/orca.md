# Orca host

Use Orca for Orca-managed worktrees, terminals, mailboxes, and cross-terminal dispatch. It can host different harnesses.

## Detection

Check injected runtime data first. Then inspect `ORCA_TERMINAL_HANDLE`, `TERM_PROGRAM`, and the presence of the `orca` CLI. An environment handle can become stale after a pane restart, so verify the live terminal before a long wait.

## Routing

- Prefer native harness coordination for subagents owned by the current session.
- Use Orca orchestration for work in another Orca terminal or worktree.
- Use the installed `orchestration` skill for task and mailbox commands when available.
- Use the installed `orca-cli` skill for worktree and terminal mechanics when available.
- Verify current command syntax with the CLI help before mutation.

For a supervised run, prefer an explicit task lifecycle that keeps worker messages visible: create the task, dispatch to the verified terminal, wait on the live coordinator mailbox, and inspect task state. Before declaring a timeout, inspect the inbox and task list because a completion message can land on a newer live handle.

Treat model launch flags, built-in agent identifiers, and mailbox behavior as versioned CLI details. Recheck them before use. Never place approval bypass flags into a durable shared playbook.

Keep one worktree per editing worker. Dispatch only to the intended live terminal. Do not use Orca to create peer communication between workers.
