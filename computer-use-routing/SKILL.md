---
name: computer-use-routing
description: Route live browser, native-app, webview, and desktop UI work through the correct control surface for the current runtime. Use before browser automation, computer-use actions, visual UI inspection or testing, or choosing among in-app browsers, attached Chrome or Edge, DevTools or CDP, host browsers, and OS-level control, including when live-UI work cannot be completed in the current session. This skill selects the local adapter; agent-orchestration selects and contacts sessions. Do not use for ordinary web research or semantic operations that a connector, API, or CLI can complete without UI interaction.
---

# Computer Use Routing

Choose the interaction adapter from the observed runtime, required live state, and task fidelity. Keep eligible work local. When the current session cannot satisfy the requirement, return a capability request to the active orchestrator instead of contacting another session.

## Keep ownership explicit

- This skill owns live-UI classification, local adapter eligibility, state affinity, allowed fallback, and the computer-use result contract.
- `agent-orchestration` owns which session executes, cross-session dispatch, external-write authority, communication topology, and the return path.
- This skill's runtime map owns dated, selection-oriented capability observations. Injected runtime guidance and live schemas override it.
- The selected operational skill, live guide, or advertised tool schema owns commands, flags, setup, recovery, and lifecycle mechanics.

Do not choose an adapter from the model name. The same model can run in different harnesses and hosts with different tools and state.

## Build the smallest useful fingerprint

Before the first UI action, identify only what can change the decision:

- Current harness, host, and advertised tools or skills.
- Requested outcome and target page, app, window, tab, profile, or embedded surface.
- Any explicit browser, app, profile, tab, or host choice from the user.
- Required state: fresh surface allowed, existing login needed, exact tab or window needed, or same desktop session needed.
- Required fidelity: page semantics, accessibility tree, screenshot, browser chrome, console, network, performance, extension, native dialog, or cross-app interaction.
- Visibility and focus constraints, mutation authority, stop conditions, and required evidence.

Trust injected runtime instructions and live tool schemas first. Discover connection and readiness through advertised read-only surfaces or visible state. Never inspect credential stores, cookies, browser profile files, or other secret-bearing storage to infer availability.

Treat exposed, installed, running, connected, and targetable as separate states. Do not infer one from another.

Read [runtime-map.md](references/runtime-map.md) for the current environment before choosing an adapter. Treat it as dated selection guidance, not an executable contract.

## Select the local adapter

Apply these rules in order:

1. Follow higher-authority runtime instructions.
2. Honor an explicitly named browser, app, profile, tab, host, or control surface as a hard constraint. If it is unavailable, report that instead of silently substituting another surface.
3. If the user wants a semantic operation rather than visible or interactive UI work, prefer a purpose-built connector, API, or CLI only when it can preserve the required identity, data, state, and authority; then leave this workflow.
4. Preserve required state locality. Existing authenticated browser or exact-tab state outweighs a more feature-rich isolated browser.
5. Use the most semantic eligible adapter: page or DOM control for page work; the current page or attached-browser adapter for diagnostics it exposes; DevTools or CDP when deeper browser diagnostics are required; and OS-level Computer Use for native apps, browser chrome, dialogs, webviews, or cross-app interaction.
6. Among equally eligible adapters, prefer one already available in the current session, then the simpler and less disruptive activation path.

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

When no local adapter can preserve the outcome and required state, return this capability request to the active orchestrator:

```yaml
status: executor_required
origin: <worker, session, and task identifiers from the verified return path>
executors_attempted:
  - <executor or session identifier and its disqualifying evidence>
outcome: <observable result needed>
target: <page, app, window, or surface>
required_capabilities:
  - <page, DevTools, attached browser, or desktop capability>
required_state:
  - <login, profile, tab, host, or desktop-session affinity>
explicit_constraints:
  - <user-selected surface or none>
local_adapters_checked:
  - <adapter and observed readiness>
disqualifying_evidence:
  - <why each local adapter cannot preserve the requirement>
actions_already_performed:
  - <ordered redacted action identifiers and evidence references, or none>
current_observed_state:
  - <fresh redacted state summary and evidence references after those actions>
replay_constraints:
  - <non-idempotent actions that must not be repeated without proof>
disclosure_constraints:
  - <data and evidence the selected executor is authorized to receive>
authority: <read-only and permitted mutations>
evidence_required:
  - <snapshot, screenshot, visible state, or diagnostic output>
stop_conditions:
  - <authentication, ambiguity, confirmation, or unsupported state>
reason: <why no eligible local adapter exists>
```

- In worker mode, send the request only to the orchestrator and stop. Never recruit or message a peer executor.
- If the worker's return path is unavailable or unverified, do not contact the human or a peer and do not mutate further; stop with `NOT-RUN` in the local result.
- Describe the required capability and disqualifying evidence; do not select the replacement model, harness, or session.
- Keep the packet minimal and redacted. Describe authenticated or private state by reference and evidence class; do not copy page contents, credentials, private data, or unrelated UI state into a cross-session request. If required evidence would exceed existing disclosure authority, record that limit without including the evidence so the orchestrator can resolve the disclosure decision.
- In direct or orchestrator mode, load `agent-orchestration` and treat the request as routing input, not permission to dispatch or expand scope.
- If `agent-orchestration` cannot prove another eligible executor and reliable return path, stop with `NOT-RUN`; do not loop back into the unchanged local route.
- The selected executor must rerun this skill against its own live runtime before acting. Treat prior actions and state as claims to verify, preserve the replay and disclosure constraints, and never repeat a non-idempotent mutation merely because the prior executor did not finish. If landing cannot be verified, do not re-attempt; return `PARTIAL` with the uncertainty. A claimed tool or open browser in another session is not proof of current eligibility.
- When another executor also cannot proceed, append its identifier and disqualifying evidence without discarding earlier attempts. Never route back to an unchanged attempted executor.

This skill does not grant authority to install software, change settings, create sessions, send messages, publish, purchase, or perform other external writes.
