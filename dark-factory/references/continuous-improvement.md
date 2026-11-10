# Continuous skill improvement

Use when runtime evidence identifies a defect in a skill. Preserve the main task's priority; skill maintenance is a bounded side task, not permission to redesign the factory during ordinary work.

## Classify the observation

- **Changed runtime facts:** record new models, harnesses, routes, tool availability, or measured behavior in the appropriate dated observations/configuration. Verify facts through supported sources. New catalog entries remain untested until representative evidence supports their use; discovery alone does not promote a default or reviewer. Propose durable profile changes when the evidence warrants them.
- **Clear bounded defect:** a broken reference, wrong path, verified obsolete argument, or narrow missing condition with a reproducible consequence can be repaired in the current session through `manage-my-skills`. Keep the intended behavior and existing authority intact.
- **Broader or unresolved change:** changes to scheduling policy, review requirements, authority, workflow, or architecture enter the maintenance queue. Repeated defects and fixes that grow beyond their bounded scope also enter that queue. A dedicated maintenance task can be scheduled by impact and recurrence; an issue need not immediately start another session.

This standing authorization permits bounded source repairs to Derek-owned skills. A dispatched worker reports through its orchestrator, which assigns the repair; it does not grant itself repository ownership, recruit peers, or leave its assigned scope. For third-party skills, follow `manage-my-skills` ownership rules and report the defect without silently editing or forking them.

## Repair and verify

1. Record the trigger, expected/observed behavior, affected rule, minimal redacted evidence, temporary handling, and proposed repair. Supported live tool contracts and higher-authority instructions still govern the main task while a skill is being repaired.
2. Verify exact source ownership, current changes, and one active editor for the affected files. Reuse an existing maintenance owner or preserve a private patch when someone else owns them. Keep unrelated dirty work intact.
3. Load `manage-my-skills` and its current authoring guidance. Make one bounded repair, then run validation appropriate to it: links, native skill validation, executable checks if mechanics changed, or a realistic behavioral case. Classify actual impact under the shared [review policy](orchestration/review-policy.md); R0 may proceed without independent review, R1 requires independent review, and R2 requires cross-model review. Stronger project gates remain in force.
4. Preserve a change record: cause, changed scope, validation and review evidence, remaining limits, and a verified recovery copy or commit. An inconclusive or growing repair goes to the queue with its evidence; continue independent authorized main-task work.
5. Apply the verified repair to installed copies only when installation is already authorized, through `manage-my-skills`, and read back the actual installed target. Commit, push, publication, and unrelated installations retain their existing authorization requirements. A local repair is not automatic fleet-wide rollout.

Editing a skill does not change the authority or acceptance gates of the task that discovered it. Keep the pre-repair constraints in force until an authorized change is accepted. Model agreement and self-edited instructions cannot supply missing authority, lower required review, expand paid spend, or make an unsupported tool route eligible.

## Maintenance queue

For reusable defects in Derek-owned skills, use GitHub issues in **[Derek-X-Wang/skills](https://github.com/Derek-X-Wang/skills/issues)**. Search for a matching open or closed issue first. Reuse an existing issue for the same cause rather than filing one per session; record distinct new evidence without replying to a human unless authorized. A completed bounded repair needs its change record, not necessarily a new issue. Application defects stay with their owning project; third-party skill defects go to the appropriate owner under its disclosure rules.

The owner authorizes routine filing and maintenance of these skill-defect issues. This does not authorize direct replies to people, unsolicited mentions, assignments, or publication of non-public evidence. Public issue content contains only a generic symptom, sanitized reproduction, expected/actual behavior, affected skill/rule, impact, proposed direction, and verification limits. Keep company names or identifiers, internal PRs, real paths, account details, capabilities, transcripts, and raw logs in approved private storage. If a useful safe public report cannot be made, keep a private queue item instead.

Each queued item retains its status, owner when assigned, private evidence reference, and any temporary handling. Prioritize blockers, recurring defects, and changes affecting several workflows. Validate a durable fix against the affected paths before promotion; preserve the previous version for recovery.
