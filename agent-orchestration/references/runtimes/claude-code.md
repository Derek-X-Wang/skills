# Claude Code harness

Treat Claude Code as a harness that can also expose a native control plane for subagents, agent teams, and background sessions. Use only the coordination lifecycle visible in the current session.

## Routing

- Use an internal subagent for bounded background work that does not need its own visible panel.
- Use a named team only when the session exposes the team lifecycle and the host benefits from visible teammates.
- When cmux hosts a Claude team, also read [cmux-team.md](cmux-team.md).
- Keep the team lead as the only communication hub. Do not use teammate direct messages or broadcasts.

Create role prompts with explicit ownership, no-touch areas, stop conditions, and a return contract. Send all worker status, findings, and questions to the lead. The lead relays accepted information to other roles.

## External review routes

- Use the installed Codex plugin for a local Git diff review when its review command and result lifecycle are available.
- Use `counsel` for a focused custom opinion from Codex.
- Use Orca for a durable, visible, interactive, or multi-round Codex session.
- Use a fresh native Claude subagent as an R1 fallback. Follow the [routing matrix](../routing-matrix.md) for current model preferences and exclusions.

Classify review independence from the actual implementer and reviewer models, not from Claude Code or the route used.

Treat experimental flags, tool names, model aliases, team storage paths, and worktree-isolation flags as versioned details. Verify them in the current session. Do not change settings or enable experimental features without authority.
