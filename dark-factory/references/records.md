# Private configuration and execution records

The JSON files under [templates](../assets/templates/policy.json) are disabled anonymous examples. The canonical default private root on this machine is **`~/.local/share/dark-factory/`**, resolved against the executing user's home, outside source checkouts and disposable worktrees. Use it consistently across sessions and harnesses; do not choose a new weekend/session directory on each invocation. Create needed directories with owner-only access within existing local-write authority. A company storage restriction can require an explicitly approved override; record that binding once and reuse it. A session cannot silently choose its own override. Never populate the public skill checkout with real inventory, account observations, company data, credentials or operational evidence.

These are readable record formats, not configuration consumed by an implemented scheduler. No helper loads them automatically. The manager reads/writes them with ordinary authorized local tools; validate JSON after updates and preserve the previous valid record. No external action follows merely from setting a field.

## Stable project discovery and layout

```text
~/.local/share/dark-factory/
  machine.json                       # this machine's OS Fleet connection only
  machines/<machine-id>/resources.json # optional local data/checkouts, not Fleet
  projects/<project-id>/
    project.json                     # identity, storage binding, authoritative refs
    policy.json                      # this project's existing approved policy
    state.json                       # this project's checkpoint
    INTENT.md                        # what the owner wants (intent ledger)
    hourly.log
    QUESTIONS.md
  factories/<factory-id>/             # only for an explicitly assigned factory
    INTENT.md                        # cross-project intent and priorities
    policy.json
    state.json                       # index/allocation; not copied project status
```

Resolve the exact repository identity before selecting a project directory. Prefer a verified forge hostname/owner/repository identity, normalized across SSH/HTTPS and with a trailing `.git` removed; preserve the forge's identity/case rules. For a local-only project use its verified canonical repository/common-directory identity, not an individual worktree. Derive `<project-id>` as `<slug>-<hash>`: take the final repository-name component of the canonical identity, lowercase it, replace runs outside ASCII `a-z0-9` with `-`, trim `-` (use `project` if empty), and append the first 16 hex characters of SHA-256 of the canonical identity's UTF-8 bytes. Store the identity and evidence in [project.json](../assets/templates/project.json), and verify any existing directory's identity before using it. Worktrees of the same repository share this binding. A known existing binding takes precedence over guessing a new name after a remote/URL change; reconcile identity aliases within project ownership.

Every project supervisor reads only its authorized project's metadata and follows `authoritative_state_ref` and `policy_ref`. A new session discovers these paths from the same repository identity, rather than a remembered conversation. It does not scan unrelated projects' private contents. Explicit storage overrides and legacy state pointers belong in project metadata; a shared path never grants access or multi-project authority. If company policy prohibits even this metadata here, use its approved private binding and report the exception without copying prohibited data.

Resolve **filesystem references** as absolute paths (expanding an explicit `~/` against the executing user's home) or relative to the directory of the file containing that reference, never the process working directory. Record the resolved absolute paths during adoption; prefer absolute legacy paths when the record is being relocated. Validate the resolved target and any symlink against the project's approved private storage locations before access. If the containing-record location or permitted target is unknown, retain the reference as unresolved and block dependent access rather than guessing. Authority IDs, evidence IDs and service URIs are typed references, not automatically filesystem paths; resolve them only through their declared record or operational source. A record moved to a new directory must have its relative filesystem references revalidated/rebased before the canonical switch.

Shared fleet/availability/observation records live in the [OS repository](shared-fleet.md), resolved through `machine.json`; they do not live under this project-state root. An authorized OS publisher coordinates updates, and readers check observation freshness. A project may retain source-attributed task evidence locally when shared publication is unavailable; it remains pending/private evidence, not a second registry or globally current snapshot. Do not overwrite another publisher's data or invent global allocations. Missing shared records do not require a global manager: a project can obtain supported evidence for its own authorized bounded work under existing capacity rules.

These are four record categories, not a requirement to recreate all four files per project or convert every historical note immediately. Keep event logs and QUESTIONS.md at their existing authorized locations until writers can be switched safely; link them from project metadata. JSON parsing proves readable syntax, not valid authority or fresh observations.

## Adopt existing records without disrupting work

The current project owner performs migration. A skill-maintenance session does not move another active project's state, logs, workers or watchers. Adoption preserves existing authority and needs no repeated policy approval; ask only for a real conflict, missing authority or required storage exception.

1. Identify the actual owner, current canonical state and all writers/readers. Preserve a private snapshot and existing paths. Create stable project metadata with `migration_status: pending`; its authoritative reference still points to the old state.
2. At a safe checkpoint, prepare candidate policy/state files in the canonical project directory. Copy only verified existing authority and status, with source references and unknown fields retained. Legacy STATE.md or custom JSON is valid migration input; do not demand a full schema rewrite before continuing otherwise safe work.
3. Verify JSON, evidence links, permissions and status against the old record. Coordinate every state writer and relevant reader. Until they acknowledge the new path, the old state remains canonical and the candidate receives no competing writes.
4. The project owner switches metadata references and writers as one coordinated ownership transition, records evidence/time, and marks migration complete. Leave an owner-approved redirect/reference at the old location when safe. Retain old snapshots and logs; do not delete or rewrite active files to tidy the layout. If interrupted, follow the last verified authoritative reference and reconcile before writing.

A newly initialized project uses the canonical layout directly. A disabled/unconfigured template or an existing directory alone never authorizes work.

## Four separate records

- [policy.json](../assets/templates/policy.json): owner-approved goals and scope, workflow, priority, operation authority, budgets, per-pool interactive reserve, sprint/reset authorization, normal-mode pacing ceilings/estimate source, and recurrence disabled by default. An operation not explicitly allowed remains ungranted. Authority references identify actual owner decisions; examples do not supply those decisions.
- [fleet.json](../assets/templates/fleet.json): shared OS capability-inventory example for the Fleet maintainer. The canonical OS registry owns machine/route identities, entitlements, state affinity, disclosure boundaries and operational-source references. Projects reference it; no live healthy flags belong in static inventory.
- [observations.json](../assets/templates/observations.json): shared OS observation example for the authorized publisher, including machine availability and timestamped quota/readiness evidence. Each applicable limit has units, remaining value, reset and freshness or unknown status. Consumption samples retain source, baseline and uncertainty. Private project evidence is not another authoritative copy.
- [state.json](../assets/templates/state.json): run, manager epoch, project/task ownership, allocations, checkpoints, reviewed/tested heads, intake ledger, prior actions, replay constraints, resources and cleanup status, unconsumed per-pool commitments, and pacing decisions/reasons/evidence/reevaluation conditions. The epoch is a record of ownership, not an implemented lock or automatic fencing system.

Use stable IDs to join these files. Record absence distinctly from zero. `enabled:false` or `status:unconfigured` admits no work. Ignore disabled sprint/redemption entries; their example pool IDs and null values grant nothing. A selected-reset record, when used, names a pool ID, one absolute expected reset time/timezone, and the source/condition that confirms that occurrence. Nullable identity, path, authority, or timing fields require real configuration or live evidence before the corresponding operation. Anonymous example IDs never prove a target exists. The templates illustrate one entitlement/pool, route, project, and task; add records for actual authorized capacity, not imaginary integrations.

## Intent ledger

`INTENT.md` is the memory of what the owner wants. The session that faces the owner keeps it: the factory manager when one is assigned, otherwise the project manager. It is plain Markdown, written in the owner's terms:

- **Goals:** what success looks like for users, and why it matters to the owner.
- **Priorities and taste:** what to do first, what quality bar to keep, and what to avoid.
- **Acceptance:** how the owner will judge "done". Progress reviews and acceptance start from this list.
- **Decisions:** dated owner answers, each with the reason and what it changed. Mark a replaced decision as superseded; do not delete it.
- **Open questions:** what still needs the owner.

Read it before every owner conversation, report, and new admission. Update it in the same turn as an owner decision. It records intent, not authority: grants of authority stay in `policy.json`, and a line in `INTENT.md` never grants an operation. A restarted or replacement manager rebuilds its understanding of the owner from this file, not from memory of a conversation.

## Checkpoint before handoff or pause

For each project/task retain:

- Approved goal, workflow, scope/no-touch boundaries, acceptance and authority references.
- Exact repository identity, checkout/worktree, base and current head, dirty/untracked work and durable patch references; preserve unique work before cleanup.
- Project owner, workers/controllers, route/session/process identifiers, writer scope, queued actions, and release/fencing evidence.
- Task status, next safe step, attempted hypotheses/fixes, consumed/remaining budgets, stop reason, required review, and reviewed/tested SHA plus evidence.
- Prior external actions in order: stable action ID, target, intended effect, verified/not-run/uncertain result, evidence, and forbidden replay. An uncertain landed write remains uncertain across sessions.
- Intake identity/head/update/feedback ledger for Bite; retain superseded evidence separately.
- Retained state affinity, resource ownership, output location, cleanup/retention decisions and private disclosure restrictions.

Use local record IO only within the granted private path. Keep the current task record authoritative for task status and link ticket or forge records when authorized; a missing ticket-write permission does not block safe local evidence. Global `state.json` indexes project records and the merge/resource line; it should not duplicate contradictory copies of every task detail. Existing `STATE.md`, event logs, and `QUESTIONS.md` can be preserved and linked during migration; pick one authoritative status location and record the relationship.

## Evidence and durability

Write checkpoints at material transitions, not only at session end. Keep previous snapshots until the new record parses and its evidence references resolve. Reconcile claims against live repository and target evidence at resume. A saved heartbeat, `running` string, or manager epoch does not prove liveness or stopped writers. Recalculate [normal-mode pacing](capacity-and-fleet.md#normal-mode-pacing) at manual resume; retain the old decision as evidence rather than inheriting a stale fast mode. Preserve company/private evidence only in authorized storage and send minimal redacted references across sessions.
