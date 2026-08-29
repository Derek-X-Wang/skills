# Codex harness in the app, CLI, or IDE

Treat Codex as a harness that can also expose a native control plane for subagents. The session tool inventory is the source of truth.

## Routing

1. Inspect injected runtime information and native collaboration tools.
2. Use the exposed spawn, follow-up, message, wait, list, and interrupt lifecycle for harness-owned workers.
3. Use the surrounding host only for sessions outside the native agent tree.
4. Keep work local when the current Codex surface exposes no reliable subagent return path.

## Operational handoff

| Chosen action | Operational source |
| --- | --- |
| Native Codex subagent lifecycle | The tools and schemas exposed by the current Codex session |
| Focused `counsel` review | Load `counsel` and follow its target-verification step |
| Durable Orca session | Read [orca.md](orca.md), then load the operational skill it names for the chosen action |
| OpenCode external worker or reviewer | Read [opencode.md](opencode.md), then use the direct or durable route that fits the work shape |

This reference owns Codex capability mapping and coordination invariants. Each operational source owns its current mechanics. Do not infer native tools or model controls that the current session does not expose.

## External review routes

- Use `counsel` for a focused fresh Claude review after its dry run proves an eligible target under the [routing matrix](../routing-matrix.md).
- Use Orca for a durable, visible, interactive, or multi-round Claude session.
- Use the OpenCode route when the routing matrix selects an OpenCode reviewer.
- Use a fresh native Codex subagent as an R1 fallback when a different model is unavailable.

Apply the [review policy](../review-policy.md) for budget and independence. Use the [routing matrix](../routing-matrix.md) for current model and route preferences.

Follow the `counsel` skill's target-verification step when its profile or target may have changed. Use the route for a focused opinion and a durable host when the work needs follow-up turns.

Model inheritance, per-role model configuration, concurrency limits, and tool names can change. Verify the current configuration instead of copying an old launch command.

Official reference: <https://learn.chatgpt.com/docs/agent-configuration/subagents>
