---
name: agent-orchestration
description: Compatibility entry for task delegation, model and route selection, review, worker takeover, and bounded audit-repo requests. Uses Dark Factory's shared task orchestration without starting multi-project management, sweeps, or schedules.
---

# Agent Orchestration compatibility entry

Read and follow the canonical [task orchestration module](../dark-factory/references/orchestration.md), including its conditional references. For `audit-repo`, use its preserved bounded audit pattern. This alias selects **task orchestration only**. It does not start factory management, admit projects, run Bite intake, or start a schedule. The `dark-factory` skill must be installed alongside this compatibility entry; if its module is unavailable, report the missing dependency without guessing policy.
