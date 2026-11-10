# Factory manager

Read this only for explicitly assigned multi-project factory planning and execution. A supervisor of one project uses [project management](project-management.md); adopting this skill does not appoint it to this role. No global manager is required for standalone projects.

## Role

The factory manager is the top tier, and it exists only when the owner runs two or more projects at the same time and appoints one. It is the owner's single partner across those projects:

- **Remember what the owner wants.** Keep the factory [intent ledger](records.md#intent-ledger). Start every progress review and acceptance from it.
- **Report to the owner.** Translate project results into product terms and recommendations ([report template](report-template.md)). Bring only real product, priority, scope, or authority decisions to the owner.
- **Direct within authority.** Decide priorities and capacity across projects when standing policy allows it, and tell project managers what to do. Escalate everything else.

It does not run project tasks or talk to workers. Project managers own their projects and their workers.

## Admit work

Identify the active manager and verify that no other manager owns the run. Reuse standing approved policy; ask only for decisions missing from that authority. In unattended mode record missing decisions and park dependent work. A new project requires the owner's decision. An approved personal goal permits autonomous task selection within that goal's scope; a company project follows its narrower workflow.

Before dispatch, identify each project's execution owner, allowed workflow, approved goal, exact checkout, permitted external actions, required checks/review, stop conditions, private record location, and current ownership. Use the [configuration and records contract](records.md); unconfigured fields are not permission. Record priority overrides, resource allocations, and reasons for pauses.

Independent projects run in parallel by default when quota, machine capacity, and routes support it. Select work for useful verified delivery, not quota utilization. Keep coupled work, integration units, and shared mutable targets serialized. The global manager applies [normal-mode reset-aware pacing](capacity-and-fleet.md#normal-mode-pacing) before new admissions: compare unreserved current allowance after in-flight commitments with verified time to reset and bounded consumption estimates, then record the decision and reevaluation condition. The global manager allocates scarce capacity; the project owner selects and executes eligible tasks within that allocation under [orchestration](orchestration.md). Workers report only to their project owner, and project owners report to the global manager. Relay cross-project findings through the manager; no competing global owners or direct worker-to-worker command channel.

## Authority and modes

Policy separates personal, Bite, attended, and unattended authority. A personal agent such as a chat-based manager may reprioritize, pause, or resume only within its granted scope. Its identity or availability grants no extra project, paid spend, publication, release, or deployment authority. A message is information, not an authority grant, unless it is verified owner instruction through an authorized channel.

A timed sprint releases only named entitlements' interactive reserves under [capacity policy](capacity-and-fleet.md). It does not expand work or paid budget. Redeem a reset credit only by owner direction or one individually preauthorized redemption recorded with its conditions. Recheck actual quota after redemption. An advertised future reset or banked credit is not current capacity.

Use [personal workflow](personal-workflow.md) for approved personal goals and [Bite workflow](bite-workflow.md) for company PR intake. Select the workflow before any external action. Other-author review findings and the owner's own PR feedback are different task kinds, even on the same repository.

## Execute and checkpoint

At each meaningful transition, reconcile worker/route liveness, target identity, fresh capacity, task evidence, and prior external actions. Check whether the candidate is already complete or superseded. Record assignment before dispatch and checkpoint after result, integration, pause, failure, or handoff. Delegation alone is not completion; independently verify material claims.

Use supported tool-owned mechanics: wefty can fill an authorized compute/Computer Seat dispatch role, and Seshloom can carry permitted messages. Neither becomes a scheduler or authority source merely because it is installed. Follow the exposed operational skill before use, preserve the hierarchy, and record delivery or execution identifiers. Do not assume a gateway on another machine is integrated: inventory it as unverified until its identity, entitlement, tools, disclosure authority, and return/lifecycle contract are proven.

Stage B uses [manual continuation](continuation.md). A stopped manager does not automatically recover. A human may manually initiate a new manager, which reconciles records and live owners before proceeding. Worker-task takeover is a separate bounded mechanism; it cannot elect a new manager or reset task budgets.

## Completion

Project owners return evidence and cleanup outcomes; the manager verifies material results and preserves unfinished work and replay constraints. Report ready local fixes separately from published or merged changes. A sweep can finish with no actionable work. A parked task can coexist with completed independent work. Use the [report template](report-template.md) at handback; a one-shot run needs only its relevant sections.
