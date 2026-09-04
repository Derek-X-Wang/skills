# Computer-use runtime map

Last reviewed: 2026-09-04.

These are selection observations, not permanent availability claims. Verify the current host, harness, tool inventory, target state, and operational source before acting. A model name never proves that an adapter exists. Similar skill names can identify different adapters, so match the exact exposed skill to the observed runtime.

| Observed runtime or surface | Eligible work | State and fidelity notes | Operational source |
| --- | --- | --- | --- |
| T3 Code with `preview_*` tools | Page interaction, screenshots, responsive checks, and local web testing in the collaborative preview | Host-bound page surface. Preserve exact tab identity. A closed or missing preview may have a supported open lifecycle; it is not an agent route or the user's external Chrome profile. | Injected T3 preview instructions and live tool schemas |
| Codex with the in-app Browser skill | Page interaction in the browser attached to the current chat | Can hold signed-in state. Explicit browser choices remain hard constraints; let the Browser runtime select defaults only when the user did not choose one. | `browser:control-in-app-browser` and its live documentation |
| Codex with the Chrome or Edge browser adapter | Work requiring the user's connected browser tabs, login state, profile, or extensions | State is attached-browser-specific. Do not replace it with an isolated or in-app browser when that state is required, and do not assume a closed browser can be launched without user action. | `chrome:control-chrome` or the exposed browser-family skill and its live documentation |
| Codex with local Computer Use | Native macOS apps, app webviews, browser chrome, menus, dialogs, and window-level interaction | Accessibility and screenshot control. Prefer a semantic browser or app adapter when it can satisfy the task. App launch and recovery behavior belongs to the current operational skill. | `computer-use:computer-use` |
| Claude Code with Claude-in-Chrome tools exposed | Visible Chrome interaction that depends on the connected user's browser state | Availability belongs to the current Claude Code session, not to the Claude model. Require a proven connection and target permission; do not assume it can launch closed Chrome or enable integration without user action. | Live Claude-in-Chrome tools and current Claude Code guidance |
| Any terminal harness with `chrome-devtools-cli` available | Page automation plus console, network, performance, memory, extension, or CDP diagnostics not satisfied by the current semantic browser adapter | Mode, connection, lifecycle, and profile behavior must be verified. Do not assume it is the user's normal Chrome profile or authenticated session. | `chrome-devtools-cli` and current CLI help |
| Orca embedded browser | Pages hosted inside Orca | Host-owned surface. Use its page-level semantics rather than desktop coordinates, preserve explicit page and host placement, and do not assume state transfers between placements. | `orca-cli` and its version-matched live guide |
| Orca Computer Use | Visible native apps, external browser windows, webviews, dialogs, and OS-level input | Window-level surface. It is not the adapter for Orca's embedded browser or ordinary page-only automation. | `computer-use` and the version-matched Orca guide |
| cmux browser surface | Page interaction in a cmux WKWebView, including focus-preserving inspection | Host-owned independent browser state with explicit surface identity. Do not infer the target from focus or substitute it for Chrome-only CDP diagnostics or the user's Chrome profile. | `cmux-browser` |
| Another or unknown runtime | Only work supported by currently advertised tools and an authoritative operational source | Infer nothing from product branding or remembered tool names. If no source proves the required state and action, return `executor_required` or `NOT-RUN`; report a missing user action through the orchestrator in worker mode and ask the user only in direct mode. | Exposed skill, live guide, or tool schema |

## Resolve common ambiguities

- **Chrome is closed or disconnected:** consult the selected attached-browser adapter's readiness flow. If the user's Chrome state is required and cannot be preserved, report the required user action to the orchestrator in worker mode or ask the user in direct mode; otherwise return `executor_required`. Do not fall back to an isolated browser.
- **No preview or browser tab is open:** use a supported create or open lifecycle only when a fresh surface satisfies the task.
- **A page action is possible through desktop coordinates:** prefer page semantics unless the task needs browser chrome, a native dialog, a webview, or another OS-only feature.
- **A worker knows another harness has better tools:** return `executor_required` to the orchestrator. The worker does not contact that harness.
- **A URL was supplied:** treat it as context, not proof that browser interaction is required. Use a connector, API, CLI, or web retrieval when the requested result is semantic and no visual interaction is needed.
