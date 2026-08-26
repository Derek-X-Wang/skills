# Claude Code harness

Use the coordination tools actually exposed by the Claude Code session. The available native paths can include internal subagents or a named agent team.

## Routing

- Use an internal subagent for bounded background work that does not need its own visible panel.
- Use a named team only when the session exposes the team lifecycle and the host benefits from visible teammates.
- When cmux hosts a Claude team, also read [cmux-team.md](cmux-team.md).
- Keep the team lead as the only communication hub. Do not use teammate direct messages or broadcasts.

Create role prompts with explicit ownership, no-touch areas, stop conditions, and a return contract. Send all worker status, findings, and questions to the lead. The lead relays accepted information to other roles.

Treat experimental flags, tool names, model aliases, team storage paths, and worktree-isolation flags as versioned details. Verify them in the current session. Do not change settings or enable experimental features without authority.
