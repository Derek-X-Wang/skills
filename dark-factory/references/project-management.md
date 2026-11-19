# Single-project supervisor

Use for a session already supervising one project or explicitly assigned that role.

## Intake and ownership

Identify the named project, current execution owner, approved goal, standing authority, workers, and current canonical record. If another session owns this same project, reconcile ownership before changing shared records or overlapping work. Follow [orchestration](orchestration.md) for project-local delegation/review and [continuation](continuation.md) for an actual owner replacement.

The project manager directs several workers at once when the work is separable ([orchestration](orchestration.md)). It starts each worker in [worker mode](worker.md).

A standalone project manager also does the owner-facing job: it keeps the project's [intent ledger](records.md#intent-ledger), starts progress reviews and acceptance from it, and reports with the [report template](report-template.md). Under a factory, the factory manager does this, after the handover in [intent ledger](manager.md#intent-handover); the project manager keeps its project record up to date and reports through the factory manager. Peer project supervisors do not acquire authority over each other's queues, sessions, load, or quota merely because they share a machine.

## Apply the relevant rules

Checking capacity, recording known authority, and maintaining a checkpoint within an authorized private location are ordinary project management. Adopting these rules does not require repeated owner approval. Ask only for missing product/authority decisions, conflicting ownership, or a genuinely required storage exception. Do not request a separate decision to postpone unrelated multi-project management.

Before dispatch, apply [capacity policy](capacity-and-fleet.md) for quota evidence, reserves and pacing.

Observe other projects' load and protect this project's authorized resource budget; leave their processes and allocations to their owners. Apply an existing shared allocation if one is actually authorized. Without global allocation evidence, do not claim a global reservation or assert that unobserved competing work is absent.

At assignment, merge, decision, pause or handoff, update the project checkpoint and evidence. Return this project's results, blockers and cleanup to its actual parent/human. Keep already-authorized work moving while dependent scope or ownership questions are parked.
