---
name: dark-factory
description: Coordinate authorized software work across agents, harnesses, and machines, attended or unattended. Use for single-project supervision, explicitly assigned multi-project factory planning, manual resume, task delegation and review, worker sessions (`/dark-factory worker`), trying or promoting new or experimental tools and methods, live UI routing, observed skill defects, personal approved-goal execution, or an explicitly requested Bite PR sweep. Select only the mode needed; a routing request does not start a factory or schedule.
---

# Dark Factory

Deliver useful, verified work within approved scope. Unused quota is acceptable. This skill supplies instructions and disabled templates; it does not implement a scheduler, daemon, gateway, or recovery service.

**Worker or reviewer?** If you were dispatched to do a task, or invoked as `/dark-factory worker`, read only [worker mode](references/worker.md) and stop reading here.

## Roles

| Tier | Role | Exists when | Owns |
|---|---|---|---|
| 1 | Factory manager | The owner runs two or more projects at once and appoints one | The owner's intent across projects, reports to the owner, priority and capacity across projects |
| 2 | Project manager (project execution owner) | Every project; one per project | Its project's queue, workers, integration gate, and records. With no factory manager, it also does tier 1's owner-facing job |
| 3 | Worker / reviewer | Dispatched per task | One bounded task; reports only to its project manager |

Messages go one step at a time: owner ↔ (factory manager) ↔ project manager ↔ worker. Preserve the session's existing role. The skill name, a shared machine, or shared quota never appoints a factory manager; only an explicit owner assignment that you can trace to the owner (the owner's own message, or a record the owner approved) does. A standalone task has one task orchestrator.

## Select the mode

- **Project management:** an existing or assigned single-project supervisor. Read [project management](references/project-management.md), [records](references/records.md), and [capacity and fleet](references/capacity-and-fleet.md), and the project's [personal](references/personal-workflow.md) or [Bite](references/bite-workflow.md) workflow.
- **Factory management:** explicitly assigned multi-project work. Read [manager](references/manager.md), [records](references/records.md), and [capacity and fleet](references/capacity-and-fleet.md).
- **Task orchestration:** delegation, model/route choice, review, takeover, or a bounded audit. Read [orchestration](references/orchestration.md). It does not start a factory, sweep, loop, or timer.
- **Local UI routing:** before live browser, app, or desktop work, read [computer use](references/computer-use.md). It grants no external-write authority and creates no session.
- **Manual resume:** before a new manager continues a previous run, read [continuation](references/continuation.md) and reconcile live state, then continue in that role's mode (project or factory management).
- **Unattended window:** when the owner is away or in the nightly window, also read [unattended operation](references/unattended.md). Use only standing authority; park work that needs new authority and continue independent work.
- **Experimental items:** before using anything in the experimental registry (for example Seshloom, wefty exec, batch CI), or when the owner introduces new software or a new method, read [experimental](references/experimental.md).
- **Skill improvement:** when a skill defect interferes with work, read [continuous improvement](references/continuous-improvement.md).
- **Evolution planning:** when planning new capability or broader authority, read the [roadmap](references/roadmap.md).

## Authority

- Fleet inventory and machine availability belong to the OS repository ([shared Fleet](references/shared-fleet.md)). Projects reference it; they keep no registry of their own.
- Policy, inventory, observations, execution records, and the owner's [intent ledger](references/records.md#intent-ledger) are separate files in private storage. Tracked examples are fake and disabled. Record access never grants commit, push, merge, reply, release, deployment, spend, or other external authority. Keep company disclosure limits.
- Each task, file, and desktop input target has one active writer. Serialize coupled work and shared mutable targets. Fence prior owners before ownership transfers.
- Use [R0/R1/R2 review](references/orchestration/review-policy.md) by impact and uncertainty, and keep stronger project gates. Review cannot supply missing product, spending, release, or scope authority.

## Talk to the owner

The owner usually lacks implementation context. Lead with why the work exists, where it stands for users, and the recommendation with its reason. Ask only real product, priority, scope, or authority decisions, each with enough context to answer. Keep technical evidence in an appendix ([report template](references/report-template.md)) unless the decision depends on it.

## Finish with evidence

Separate reported from verified completion, local checks from CI or runtime evidence, and domain outcome from cleanup. Preserve checkpoints, prior external actions, and replay limits before teardown. End direct completion reports with `VERIFIED`, `PARTIAL`, or `NOT-RUN` and concrete evidence. For validation or forward testing, use [acceptance cases](references/acceptance-cases.md).
