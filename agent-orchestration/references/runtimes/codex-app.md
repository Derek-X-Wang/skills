# Codex harness in the app, CLI, or IDE

Treat Codex as a harness that can also expose a native control plane for subagents. The session tool inventory is the source of truth.

## Routing

1. Inspect injected runtime information and native collaboration tools.
2. Use the exposed spawn, follow-up, message, wait, list, and interrupt lifecycle for harness-owned workers.
3. Use the surrounding host only for sessions outside the native agent tree.
4. Keep work local when the current Codex surface exposes no reliable subagent return path.

The orchestrator owns task decomposition, dispatch, follow-up, waits, rework, and synthesis. Workers do not message each other. Concurrent editors need separate worktrees or equivalent isolation.

## External review routes

- Use `counsel` for a focused fresh Claude review after its dry run proves an eligible target under the [routing matrix](../routing-matrix.md).
- Use Orca for a durable, visible, interactive, or multi-round Claude session.
- Use a fresh native Codex subagent as an R1 fallback when a different model is unavailable.

Verify a `counsel` route with `--dry-run` when its profile or target may have changed. The route is one-shot and read-only; use a durable host when the work needs follow-up turns.

Model inheritance, per-role model configuration, concurrency limits, and tool names can change. Verify the current configuration instead of copying an old launch command.

Official reference: <https://learn.chatgpt.com/docs/agent-configuration/subagents>
