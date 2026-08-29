# Claude Code harness

Treat Claude Code as a harness that can also expose a native control plane for subagents, agent teams, and background sessions. Use only the coordination lifecycle visible in the current session.

## Routing

- Use an internal subagent for bounded background work that does not need its own visible panel.
- Use a named team only when the current session is the active orchestrator, the session exposes the team lifecycle, and the host benefits from visible teammates.
- When cmux hosts the session, also read [cmux-team.md](cmux-team.md). Apply its team sections only when the overlay is proven.
- Keep the active orchestrator as the team lead and only communication hub. Do not use teammate direct messages or broadcasts.

## Operational handoff

| Chosen action | Operational source |
| --- | --- |
| Native subagent, team, or background-session lifecycle | The tools and schemas exposed by the current Claude Code session |
| Codex plugin review | Load the plugin-owned skill when exposed; otherwise use the current command help |
| Focused `counsel` review | Load `counsel` |
| Durable Orca session | Read [orca.md](orca.md), then load the operational skill it names for the chosen action |
| Direct cmux topology change | Read [cmux-team.md](cmux-team.md), then load `cmux` |

This reference owns Claude Code capability mapping and coordination invariants. Each operational source owns its current mechanics. Do not infer a plugin command or native lifecycle that the current session does not expose.

Apply the main skill's decision-complete dispatch and communication rules to every native role.

## External review routes

- Use the installed Codex plugin for a local Git diff review when its review command and result lifecycle are available.
- Use `counsel` for a focused custom opinion from Codex.
- Use Orca for a durable, visible, interactive, or multi-round Codex session.
- Use a fresh native Claude subagent as an R1 fallback only when the preferred route is unavailable and the [routing matrix](../routing-matrix.md) marks the resolved model eligible for review.

Apply the [review policy](../review-policy.md) for budget and independence. Use the [routing matrix](../routing-matrix.md) for current model and route preferences.

Treat experimental flags, tool names, model aliases, team storage paths, and worktree-isolation flags as versioned details. Verify them in the current session. Do not change settings or enable experimental features without authority.
