# Private configuration and execution records

The JSON files under [templates](../assets/templates/policy.json) are disabled anonymous examples. The canonical default private root on this machine is **`~/.local/share/dark-factory/`**, resolved against the executing user's home, outside source checkouts and disposable worktrees. Use it consistently across sessions and harnesses; do not choose a new weekend/session directory on each invocation. Create needed directories with owner-only access within existing local-write authority. A company storage restriction can require an explicitly approved override; record that binding once and reuse it. A session cannot silently choose its own override. Never populate the public skill checkout with real inventory, account observations, company data, credentials or operational evidence.

These are readable record formats, not configuration consumed by an implemented scheduler. No helper loads them automatically. The manager reads/writes them with ordinary authorized local tools; validate JSON after updates and preserve the previous valid record. No external action follows merely from setting a field.

## Stable project discovery and layout

```text
~/.local/share/dark-factory/
  machine.json                       # this machine's OS Fleet connection only
  experimental.md                    # private registry of experimental items
  sprint.json                        # owner-given sprints, shared by every project here
  projects/<project-id>/
    project.json                     # identity, storage binding, authoritative refs
    policy.json                      # this project's existing approved policy
    state.json                       # this project's checkpoint
    INTENT.md                        # what the owner wants (intent ledger)
    hourly.log
    QUESTIONS.md
```

An explicitly assigned factory keeps its own records: see [factory records](manager.md#factory-records).

To find or create this repository's project directory, follow [project identity](records-setup.md#project-identity): read it when a session first selects its project directory, and when no `project.json` exists yet for this repository.

Every project supervisor reads only its authorized project's metadata and follows `authoritative_state_ref` and `policy_ref`. A new session discovers these paths from the same repository identity, rather than a remembered conversation. It does not scan unrelated projects' private contents. Explicit storage overrides and legacy state pointers belong in project metadata; a shared path never grants access or multi-project authority. If company policy prohibits even this metadata here, use its approved private binding and report the exception without copying prohibited data.

Resolve **filesystem references** as absolute paths (expanding an explicit `~/` against the executing user's home) or relative to the directory of the file containing that reference, never the process working directory. Record the resolved absolute paths during adoption; prefer absolute legacy paths when the record is being relocated. Validate the resolved target and any symlink against the project's approved private storage locations before access. If the containing-record location or permitted target is unknown, retain the reference as unresolved and block dependent access rather than guessing. Authority IDs, evidence IDs and service URIs are typed references, not automatically filesystem paths; resolve them only through their declared record or operational source. A record moved to a new directory must have its relative filesystem references revalidated/rebased before the canonical switch.

These are four record categories, not a requirement to recreate all four files per project or convert every historical note immediately. Keep event logs and QUESTIONS.md at their existing authorized locations until writers can be switched safely; link them from project metadata. JSON parsing proves readable syntax, not valid authority or fresh observations.

## Adopt existing records without disrupting work

The current project owner performs migration. A skill-maintenance session does not move another active project's state, logs, workers or watchers. Adoption preserves existing authority and needs no repeated policy approval; ask only for a real conflict, missing authority or required storage exception.

When an existing project still points at legacy state, follow the [adoption steps](records-setup.md#adoption-steps).

A newly initialized project uses the canonical layout directly. A disabled/unconfigured template or an existing directory alone never authorizes work.

## Four separate records

- [policy.json](../assets/templates/policy.json): owner-approved goals and scope, workflow, priority, operation authority, budgets, per-pool normal interactive reserve, reset-credit redemption authorization, normal-mode pacing ceilings/estimate source, and recurrence disabled by default. An operation not explicitly allowed remains ungranted. Authority references identify actual owner decisions; examples do not supply those decisions.
- Fleet registry and observations: OS records, not under this root. [Shared Fleet](shared-fleet.md) owns them and links their examples.
- [state.json](../assets/templates/state.json): run, manager epoch, project/task ownership, allocations, checkpoints, reviewed/tested heads, intake ledger, prior actions, replay constraints, resources and cleanup status, unconsumed per-pool commitments, and pacing decisions/reasons/evidence/reevaluation conditions.

One machine-wide record sits beside them: [sprint.json](../assets/templates/sprint.json), the [shared sprint record](capacity-and-fleet.md#shared-sprint-record). It is the only home for a sprint, and every project supervisor on the machine reads it.

Use stable IDs to join these files. Record absence distinctly from zero. `enabled:false` or `status:unconfigured` admits no work. Ignore disabled sprint/redemption entries; their example pool IDs and null values grant nothing. Nullable identity, path, authority, or timing fields require real configuration or live evidence before the corresponding operation. Anonymous example IDs never prove a target exists. The templates illustrate one entitlement/pool, route, project, and task; add records for actual authorized capacity, not imaginary integrations.

## Intent ledger

`INTENT.md` is the memory of what the owner wants. The session that faces the owner keeps it: the factory manager when one is assigned, otherwise the project manager. It is plain Markdown, written in the owner's terms:

- **Goals:** what success looks like for users, and why it matters to the owner.
- **Priorities and taste:** what to do first, what quality bar to keep, and what to avoid.
- **Acceptance:** how the owner will judge "done". Progress reviews and acceptance start from this list.
- **Decisions:** dated owner answers, each with the reason and what it changed. Mark a replaced decision as superseded; do not delete it.
- **Open questions:** what still needs the owner.

Read it before every owner conversation, report, and new admission. Update it in the same turn as an owner decision. It records intent, not authority: grants of authority stay in `policy.json` (and, for a reserve-only sprint, in the shared sprint record), and a line in `INTENT.md` never grants an operation. A restarted or replacement manager rebuilds its understanding of the owner from this file, not from memory of a conversation.

When a project has no `INTENT.md` yet, start one from sourced owner decisions and the approved goal in `policy.json`. Mark anything you inferred as unconfirmed, and confirm it in the next owner conversation.

When the owner appoints a factory manager, follow the [intent handover](manager.md#intent-handover).

## Checkpoint before handoff or pause

For each project/task retain:

- Approved goal, workflow, scope/no-touch boundaries, acceptance and authority references.
- Exact repository identity, checkout/worktree, base and current head, dirty/untracked work and durable patch references; preserve unique work before cleanup.
- Project owner, workers/controllers, route/session/process identifiers, writer scope, queued actions, and release/fencing evidence.
- Task status, next safe step, attempted hypotheses/fixes, consumed/remaining budgets, stop reason, required review, and reviewed/tested SHA plus evidence.
- Prior external actions in order: stable action ID, target, intended effect, verified/not-run/uncertain result, evidence, and forbidden replay. An uncertain landed write remains uncertain across sessions.
- Retained state affinity, resource ownership, output location, cleanup/retention decisions and private disclosure restrictions.

Use local record IO only within the granted private path. Keep the current task record authoritative for task status and link ticket or forge records when authorized; a missing ticket-write permission does not block safe local evidence. Existing `STATE.md`, event logs, and `QUESTIONS.md` can be preserved and linked during migration; pick one authoritative status location and record the relationship.

## Evidence and durability

Write checkpoints at material transitions, not only at session end. Keep previous snapshots until the new record parses and its evidence references resolve. Reconcile claims against live repository and target evidence at resume. A saved heartbeat, `running` string, or manager epoch does not prove liveness or stopped writers. Recalculate [normal-mode pacing](capacity-and-fleet.md#normal-mode-pacing) at manual resume; retain the old decision as evidence rather than inheriting a stale fast mode. Preserve company/private evidence only in authorized storage and send minimal redacted references across sessions.
