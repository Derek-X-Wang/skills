---
name: dark-factory
description: Coordinate authorized software work across agents, harnesses, and machines, attended or unattended. Use for single-project supervision, explicitly assigned multi-project factory planning, manual resume, task delegation and review, live UI routing, observed skill defects, personal approved-goal execution, or an explicitly requested Bite PR sweep. Select only the mode needed; a routing request does not start a factory or schedule.
---

# Dark Factory

Deliver useful, verified work within approved scope. Unused quota is acceptable. This skill supplies instructions and disabled templates; it does not implement a scheduler, daemon, gateway, or recovery service.

## Select the mode

First preserve the session's assigned role and project scope. An existing supervisor of one named project selects **project management**, even when the user invokes `/dark-factory` or asks to adopt the upgraded skill. The skill name, shared machine, or shared quota never appoints a global manager. Only an explicit multi-project assignment selects factory management. Ordinary dispatched workers/reviewers keep their assigned roles. Resolve only ambiguity that changes a safe action; do not ask a known project owner whether it should manage other projects.

- **Task orchestration:** for delegation, model/route choice, review, takeover, or a bounded audit, read [orchestration](references/orchestration.md). Keep ordinary task calls within that task; do not start a global factory, sweep, loop, or timer.
- **Project management:** for an existing or explicitly assigned single-project supervisor, read [project management](references/project-management.md), [records](references/records.md), and [capacity and fleet](references/capacity-and-fleet.md). Select the project's personal/Bite workflow. A standalone project owner reports directly to the human; no global manager or other project admission is required.
- **Local UI routing:** before live browser, app, or desktop work, read [computer use](references/computer-use.md). A routing request does not grant external-write authority or create another session.
- **Factory management:** for approved multi-project work, read [manager](references/manager.md), [records](references/records.md), and [capacity and fleet](references/capacity-and-fleet.md). Load [personal](references/personal-workflow.md) or [Bite](references/bite-workflow.md) only for the admitted project workflow.
- **Manual resume:** before a new manager continues a previous run, read [continuation](references/continuation.md) and reconcile live state. Stage B is same-machine, manually initiated, across sessions or harnesses. Cross-machine continuation and autonomous manager recovery need later verified routes and separate authorization.
- **Unattended window:** when the owner is away or inside an agreed nightly window, also read [unattended operation](references/unattended.md). Use only existing authorized scope and standing rules. When a decision needs new authority, park that work and continue independent authorized work without waiting for a human.
- **Skill improvement:** when an observed skill defect interferes with work, read [continuous improvement](references/continuous-improvement.md). Apply bounded repairs through `manage-my-skills`; route larger or unresolved changes to the skills repository's maintenance queue.
- **Evolution planning:** when planning the next capability or broader decision authority, read the [roadmap](references/roadmap.md). Use operational evidence and a scoped promotion decision; a later milestone grants no authority by itself.

## Ownership and authority

Fleet inventory and machine availability are shared records owned by the OS repository. Resolve the [shared Fleet source](references/shared-fleet.md); project supervisors reference it rather than creating their own registry. Machine-local data locations and project execution records remain scoped private records.

When a multi-project factory has been explicitly assigned, one active factory manager owns global priority and authorized shared resource allocations; communication follows owner ↔ factory manager ↔ project execution owner ↔ worker/reviewer. Without that assignment, use owner ↔ project execution owner ↔ worker/reviewer. Each project has one execution owner; it coordinates only that project's work. A standalone task has one task orchestrator. Shared storage or account usage does not expand any role.

Within an explicitly assigned multi-project factory, prefer parallel independent projects with owner priority overrides. A project supervisor coordinates only eligible work inside its own project. Serialize coupled work and access to shared mutable targets. Each task, file, and desktop input target has one active writer/controller. Prior owners and workers must be fenced before ownership transfers.

Policy, capability inventory, live observations, and execution records are separate files in configured **private storage**. Tracked examples contain anonymous fake data and are disabled. Local record access never grants commit, push, merge, reply, release, deployment, reset-credit redemption, paid spend, or other external authority. Preserve company disclosure limits when selecting executors or sharing evidence.

Use [R0/R1/R2 review](references/orchestration/review-policy.md) by impact and uncertainty. Preserve stronger project gates. Review cannot supply missing product, spending, release, or scope authority. Runtime operational skills and exposed live schemas own tool mechanics; the shared references own coordination policy.

## Finish with evidence

Separate reported completion from verified completion, local checks from CI or runtime evidence, and domain outcome from cleanup. Preserve checkpoints, prior external actions, and replay limits before teardown. Report useful results, remaining limits, owner decisions, and retained resources. End direct completion reports with `VERIFIED`, `PARTIAL`, or `NOT-RUN` and concrete evidence.

For validation or independent forward testing, use [acceptance cases](references/acceptance-cases.md). They simulate decisions; they do not establish live route support.
