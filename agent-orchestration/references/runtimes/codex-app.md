# Codex harness in the app, CLI, or IDE

Current Codex releases can expose native subagents in the app, CLI, and IDE. The session tool inventory is the source of truth.

## Routing

1. Inspect injected runtime information and native collaboration tools.
2. Use the exposed spawn, follow-up, message, wait, list, and interrupt lifecycle for harness-owned workers.
3. Use the surrounding host only for sessions outside the native agent tree.
4. Keep work local when the current Codex surface exposes no reliable subagent return path.

The orchestrator owns task decomposition, dispatch, follow-up, waits, rework, and synthesis. Workers do not message each other. Concurrent editors need separate worktrees or equivalent isolation.

Model inheritance, per-role model configuration, concurrency limits, and tool names can change. Verify the current configuration instead of copying an old launch command.

Official reference: <https://learn.chatgpt.com/docs/agent-configuration/subagents>
