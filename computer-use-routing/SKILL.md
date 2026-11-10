---
name: computer-use-routing
description: Compatibility entry for live browser, app, webview, and desktop adapter selection. Uses Dark Factory's shared local UI module; does not start a factory or grant session creation or external-write authority. Excludes semantic work already served by an equivalent connector, API, or CLI.
---

# Computer Use Routing compatibility entry

Read and follow the canonical [local computer-use module](../dark-factory/references/computer-use.md), including its runtime map when applicable. This alias selects **local UI routing only**. It does not start factory management, delegate automatically, or start a schedule. Return an unavailable-adapter request through the task's existing orchestrator. The `dark-factory` skill must be installed alongside this compatibility entry; if its module is unavailable, report the missing dependency without guessing policy.
