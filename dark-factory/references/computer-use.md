# Computer Use Routing

Choose the interaction adapter from the observed runtime, required live state, and task fidelity. Keep eligible work local. When the current session cannot satisfy the requirement, return a capability request to the active orchestrator instead of contacting another session.

## Keep ownership explicit

- This module (computer-use routing) owns live-UI classification, local adapter eligibility, state affinity, allowed fallback, and the computer-use result contract.
- [task orchestration](orchestration.md) owns which session executes, cross-session dispatch, external-write authority, communication topology, and the return path.
- The selected operational skill, live guide, or advertised tool schema owns commands, flags, setup, recovery, and lifecycle mechanics.

Do not choose an adapter from the model name. The same model can run in different harnesses and hosts with different tools and state.

## Build the smallest useful fingerprint

Before the first UI action, identify only what can change the adapter decision: the executing session and machine, adapter and target state owner, and any required host/state affinity. A supplied identity never proves inherited desktop/plugin readiness. Then record:

- Requested outcome and target page, app, window, tab, profile, or embedded surface.
- Any explicit browser, app, profile, tab, or host choice from the user.
- Required state: fresh surface allowed, existing login needed, exact tab or window needed, or same desktop session needed.
- Required fidelity: page semantics, accessibility tree, screenshot, browser chrome, console, network, performance, extension, native dialog, or cross-app interaction.
- Visibility and focus constraints, mutation authority, stop conditions, and required evidence.

Trust injected runtime instructions and live tool schemas first. Discover connection and readiness through advertised read-only surfaces or visible state. Never inspect credential stores, cookies, browser profile files, or other secret-bearing storage to infer availability. When host identity changes adapter eligibility, use current session metadata, live exposed tools, and scoped read-only ownership checks; never infer it from the model, installed apps, a reachable Orca CLI, a shared catalog, or project directory. Leave unknown or conflicting fields unknown and resolve them only when they change a safe action, through the orchestrator in worker mode. Incomplete host identity alone is not a refusal when the adapter and target state owner are independently proven. Exposed T3 preview tools prove that browser surface only. Refresh affected adapter/target evidence after a handoff, reconnect, restart, or actual evidence change; the orchestrator owns renewed session routing.

Treat exposed, installed, running, connected, and targetable as separate states. Do not infer one from another.

Read [runtime-map.md](computer-use/runtime-map.md) for the current environment before choosing an adapter. Treat it as dated selection guidance, not an executable contract.

## Select the local adapter

Apply these rules in order:

1. Honor an explicitly named browser, app, profile, tab, host, or control surface as a hard constraint. If it is unavailable, report that instead of silently substituting another surface.
2. If the user wants a semantic operation rather than visible or interactive UI work, prefer a purpose-built connector, API, or CLI only when it can preserve the required identity, data, state, and authority; then leave this workflow.
3. Preserve required state locality. Existing authenticated browser or exact-tab state outweighs a more feature-rich isolated browser.
4. Use the most semantic eligible adapter: page or DOM control for page work; the current page or attached-browser adapter for diagnostics it exposes; DevTools or CDP when deeper browser diagnostics are required; and OS-level Computer Use for native apps, browser chrome, dialogs, webviews, or cross-app interaction.
5. Among equally eligible adapters, prefer one already available in the current session, then the simpler and less disruptive activation path.

```text
live UI goal
├─ exact user-selected surface ──────────────> only adapters for that surface
├─ semantic result; no UI required ──────────> equivalent connector, API, or CLI
├─ login, tab, profile, or host-owned state ─> adapter proven to own that state
├─ page interaction or visual web testing ──> page-automation adapter
├─ browser diagnostics ──────────────────────> current semantic adapter if sufficient,
│                                              otherwise DevTools or CDP
├─ host-embedded page ───────────────────────> that host's browser adapter
├─ native app, dialog, webview, OS chrome ───> desktop Computer Use adapter
└─ no eligible local adapter ────────────────> `executor_required`
```

## Treat readiness separately from eligibility

A closed browser, unattached preview, empty tab list, or stopped helper is not automatically an unavailable adapter. Load the selected operational source and use only its supported readiness or attachment flow.

Keep a valid adapter binding for the task. Rerun selection only when the requirement changes or fresh evidence invalidates that adapter.

- If a fresh surface is allowed, another eligible local adapter may be selected after the preferred default proves unavailable.
- Replay constraints survive every local adapter change. If a non-idempotent action may have landed but the target cannot confirm its result, do not repeat it through the same or another adapter; return `PARTIAL` when that is the governing unverified-result status.
- If the user explicitly chose the surface or required its authenticated state, do not switch browsers, profiles, or sessions unless the task already authorizes that switch. Route any new approval request through the orchestrator in worker mode and to the user only in direct mode.
- Do not install an extension, change persistent settings, restart a harness, or switch profiles merely to make a route available unless the task already authorizes it.
- Treat authentication, MFA, ambiguous targets, and unsupported risky actions according to the selected operational source and higher-authority policy.

## Hand off mechanics and verify

Before the first adapter-specific action, load every operational skill named by the applicable runtime map and then follow its live guide or tool schema. Do not copy remembered commands across adapters.

This routing decision does not grant permission to mutate external state, send human-facing communication, expose private data, or bypass an adapter's confirmation requirements. Reinspect the target after material actions and return evidence from the target surface rather than inferring success from a successful tool call.

Use the reporting vocabulary required by the governing contract. Name the selected adapter, target class, preserved state constraint, observed result, and remaining limit. Keep unavailable, blocked, attempted failure, not-run, and unverified state distinct; do not invent a completion status that the governing contract does not define.

## Escalate through the orchestrator

When no executor you can reach is eligible for the action (no local adapter can preserve the outcome and required state), read [computer-use escalation](computer-use-escalation.md). Read it also before you route an `executor_required` request, or act as the executor one selects.

This skill does not grant authority to install software, change settings, create sessions, send messages, publish, purchase, or perform other external writes.
