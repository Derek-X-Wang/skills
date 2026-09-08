# Codex harness in the app, CLI, or IDE

Treat Codex as a harness that can also expose a native control plane for subagents. The session tool inventory is the source of truth. Route selection and lifecycle checks below belong to the orchestrator. Assigned workers follow [worker intake](../../SKILL.md#worker-intake), reuse the supplied route, and check task checkout/tools/access without repeating host, model, effort, or quota investigation.

## Routing

1. Inspect injected runtime information and native collaboration tools.
2. Use the exposed spawn, follow-up, message, wait, list, and interrupt lifecycle for harness-owned workers.
3. Use the surrounding host only for sessions outside the native agent tree.
4. Keep work local when the current Codex surface exposes no reliable subagent return path.

## Operational handoff

For live browser, native-app, webview, or desktop UI work, load `computer-use-routing` before selecting the local control adapter.

| Chosen action | Operational source |
| --- | --- |
| Native Codex subagent lifecycle | The tools and schemas exposed by the current Codex session |
| Focused `counsel` review | Load `counsel` and follow its target-verification step |
| Durable Orca session | Read [orca.md](orca.md), then load the operational skill it names for the chosen action |
| OpenCode external worker or reviewer | Read [opencode.md](opencode.md), then use only a route that it currently marks proven for the work shape |

This reference owns Codex coordination capability mapping and invariants. Each operational source owns its current mechanics. Do not infer native tools or model controls that the current session does not expose.

## Distinguish the Codex host shapes

Codex runs as a native Desktop app and can also be hosted inside Orca or T3 Code. The harness is similar, but desktop and plugin readiness, the computer-use service, and return routes belong to each session and are never inherited from another host, a copied skill, or the model identity. The orchestrator verifies which shape drives the user from current session metadata and tools; UI workers verify their assigned adapter and actual target locally.

## Documented handoff boundaries

Official documentation (learn.chatgpt.com, reviewed 2026-09-07) describes capability boundaries, not command recipes; check the linked sources for current details:

- [App deep links](https://learn.chatgpt.com/docs/app/commands#deep-links) open a new chat or workspace with an encoded path or prompt; the prompt lands in the composer and is not automatically sent. That is a manual handoff, not a running worker and not a proven return path.
- The [`codex app` developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli) launch the app or a workspace; they are not an automatic worker launch.
- The [app server](https://learn.chatgpt.com/docs/app-server) exposes thread creation, turn input, steering, and event streams. Official docs distinguish stable API methods from gated experimental fields, features, and transports, so verify the selected methods and transport against the installed version. A standalone backend is still not proof that it targets the existing Desktop session or carries its computer-use service, permissions, or tools.
- A `codex queue` submission to an existing session is not proof of delivery to the active Desktop backend by itself.

[Native Computer Use](https://learn.chatgpt.com/docs/computer-use) cannot automate ChatGPT itself, terminal apps, or system security and privacy prompts. Never propose GUI self-control, private storage edits, or undocumented IPC to bypass missing dispatch or approval paths.

## External review routes

- Use `counsel` for a focused fresh Claude review after its dry run proves an eligible target under the [routing matrix](../routing-matrix.md).
- Use Orca for a durable, visible, interactive, or multi-round Claude session.
- Use the OpenCode route when the routing matrix selects an OpenCode reviewer.
- Use a fresh native Codex subagent as an R1 fallback when a different model is unavailable.

Apply the [review policy](../review-policy.md) for budget and independence. Use the [routing matrix](../routing-matrix.md) for current model and route preferences.

Follow the `counsel` skill's target-verification step when its profile or target may have changed. Use the route for a focused opinion and a durable host when the work needs follow-up turns.

Model inheritance, per-role model configuration, concurrency limits, and tool names can change. Verify the current configuration instead of copying an old launch command.

Official reference: <https://learn.chatgpt.com/docs/agent-configuration/subagents>
