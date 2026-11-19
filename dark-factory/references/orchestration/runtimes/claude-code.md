# Claude Code harness

Treat Claude Code as a harness that can also expose a native control plane for subagents, agent teams, and background sessions. Use only the coordination lifecycle visible in the current session.

## Routing

- Use an internal subagent for bounded background work that does not need its own visible panel.
- Use a named team only when the current session is the active orchestrator, the session exposes the team lifecycle, and the host benefits from visible teammates.
- Keep the active orchestrator as the team lead and only communication hub. Do not use teammate direct messages or broadcasts.

## Operational handoff

| Chosen action | Operational source |
| --- | --- |
| Native subagent, team, or background-session lifecycle | The tools and schemas exposed by the current Claude Code session |
| Codex plugin review | Load the plugin-owned skill when exposed; otherwise use the current command help |
| Focused `counsel` review | Load `counsel` |
| Durable Orca session | Read [orca.md](orca.md), then load the operational skill it names for the chosen action |
| OpenCode external worker or reviewer | Read [opencode.md](opencode.md), then use only a route that it currently marks proven for the work shape |

## External review routes

Choose the review route from the [routing matrix](../routing-matrix.md#review-routes) and the reviewer under the [review policy](../review-policy.md).

Do not change settings or enable experimental features without authority.
