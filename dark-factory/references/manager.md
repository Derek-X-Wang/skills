# Factory manager

Read this only for explicitly assigned multi-project factory planning and execution.

## Role

The factory manager is the top tier, and it exists only when the owner runs two or more projects at the same time and appoints one. It is the owner's single partner across those projects:

- **Remember what the owner wants.** Keep the factory [intent ledger](records.md#intent-ledger). Start every progress review and acceptance from it.
- **Report to the owner.** Translate project results into product terms and recommendations ([report template](report-template.md)).
- **Direct within authority.** Decide priorities and capacity across projects when standing policy allows it, and tell project managers what to do. Escalate everything else.

## Admit work

Identify the active manager and verify that no other manager owns the run. Reuse standing approved policy; ask only for decisions missing from that authority. A new project requires the owner's decision.

Before dispatch, identify each project's execution owner, allowed workflow, approved goal, exact checkout, permitted external actions, required checks/review, stop conditions, private record location, and current ownership. Use the [configuration and records contract](records.md). Record priority overrides, resource allocations, and reasons for pauses.

Independent projects run in parallel by default when quota, machine capacity, and routes support it. Keep coupled work, integration units, and shared mutable targets serialized. The global manager applies [normal-mode reset-aware pacing](capacity-and-fleet.md#normal-mode-pacing) across projects before new admissions. The global manager allocates scarce capacity; the project owner selects and executes eligible tasks within that allocation under [orchestration](orchestration.md).

## Authority and modes

Policy separates personal, Bite, attended, and unattended authority. A personal agent such as a chat-based manager may reprioritize, pause, or resume only within its granted scope. Its identity or availability grants no extra project, paid spend, publication, release, or deployment authority. A message is information, not an authority grant, unless it is verified owner instruction through an authorized channel.

Timed sprints and reset-credit redemption follow [capacity policy](capacity-and-fleet.md#timed-sprint-and-resets).

Use [personal workflow](personal-workflow.md) for approved personal goals and [Bite workflow](bite-workflow.md) for company PR intake. Select the workflow before any external action. Other-author review findings and the owner's own PR feedback are different task kinds, even on the same repository.

## Execute and checkpoint

At each meaningful transition, reconcile worker/route liveness, target identity, fresh capacity, task evidence, and prior external actions. Check whether the candidate is already complete or superseded. Record assignment before dispatch and checkpoint after result, integration, pause, failure, or handoff.

Use supported tool-owned mechanics: wefty can fill an authorized compute/Computer Seat dispatch role, and Seshloom can carry permitted messages. Neither becomes a scheduler or authority source merely because it is installed. Follow the exposed operational skill before use, preserve the hierarchy, and record delivery or execution identifiers. Do not assume a gateway on another machine is integrated: inventory it as unverified until its identity, entitlement, tools, disclosure authority, and return/lifecycle contract are proven.

Worker-task takeover is a separate bounded mechanism; it cannot elect a new manager or reset task budgets.

## Factory records

```text
~/.local/share/dark-factory/
  factories/<factory-id>/             # only for an explicitly assigned factory
    INTENT.md                        # cross-project intent and priorities
    policy.json
    state.json                       # index/allocation; not copied project status
```

Global `state.json` indexes project records and the merge/resource line; it should not duplicate contradictory copies of every task detail.

## Intent handover

When the owner appoints a factory manager, the project manager hands over its open owner questions and pending decisions. From then on, the factory manager is the only writer of the factory's and each project's `INTENT.md`; the project files stay where they are. The project manager keeps reading its file before admissions and sends owner-relevant facts to the factory manager.

## Completion

Project owners return evidence and cleanup outcomes; the manager verifies material results and preserves unfinished work and replay constraints. Report ready local fixes separately from published or merged changes. A sweep can finish with no actionable work. A parked task can coexist with completed independent work. Use the [report template](report-template.md) at handback; a one-shot run needs only its relevant sections.
