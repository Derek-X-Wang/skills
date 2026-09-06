# Worker-task takeover

Use this policy when an assigned worker is stuck in a no-progress loop on its task. Takeover replaces that task's worker. It does not transfer the active orchestrator role, expand authority, waive a required review, or permanently raise future task model defaults. The original orchestrator stays the hub and the integration point.

## Detect the no-progress loop

A loop is repeated work on the same failure or invariant without useful new evidence. Elapsed time alone, a long but healthy test, a CI wait, or productive investigation is not a loop. A missing permission, tool, route, or required decision is a blocker to report upstream, not an intelligence problem for a takeover to solve.

- Default trigger: two substantive failed fix attempts on the same material issue, matching the [review policy](review-policy.md) threshold.
- Trigger earlier when the dispatch's explicit checkpoint is reached, or when observed evidence already shows repetition or a context failure. An early checkpoint takeover may proceed while positive task budget remains; a checkpoint is not budget exhaustion.
- Do not stage deliberate weak failures to reach the trigger, and do not require a second attempt when the evidence already proves the loop.

The worker reports the loop upstream; it never decides its own replacement. The orchestrator may also detect the trigger from primary observed evidence, including when the worker is unresponsive; a responsive worker still reports upstream, and its report is not a prerequisite for takeover. Detection without a worker report does not bypass the exclusivity fencing before an overlapping mutation. Task budgets and stop conditions come from the dispatch: this policy invents no universal minute or token limits, does not forbid work when no numeric limit is supplied, and follows the dispatch's actual stop contract. At the trigger, the orchestrator stops reissuing the unchanged prompt and coordinates the takeover.

## Choose the replacement worker

Default replacement worker: Codex GPT-6 Astra at xhigh effort. The xhigh effort is the user's selected takeover preference for this role, not a measured universal effort. Before dispatch, verify the resolved model, that the serving harness actually supports the requested effort value, the tools, route, checkout, return path, relevant quota, and that positive task budget remains when a finite budget applies.

- No silent downgrade of the model or the effort, including to GPT-5.6 Sol or a lower effort. If Astra is unavailable, report the bounded inability and preserve the work.
- Fable replaces Astra only when the user explicitly selects or authorizes it for this takeover. There is no automatic Fable fallback and no automatic redemption of reset credits.
- Any other replacement is allowed only within existing dispatch authority and must be disclosed as a deviation from the default. Do not repeatedly retry a route that already failed.

## Establish exclusivity before mutation

Before the replacement can edit or act on the task:

1. Stop or verifiably fence the previous worker and every task-owned mutating child process and queued action.
2. Confirm no concurrent writer remains on overlapping files or shared external targets.
3. Request a checkpoint while the previous worker is reachable. If it is unresponsive, the orchestrator builds an equivalent checkpoint from repository, tool, and observed-state evidence.
4. Treat a delivered interrupt, an acknowledged message, or a session exit as claims, not proof that descendants or already-launched external actions have stopped.

If exclusivity cannot be established, block the overlapping mutation and report that limit. Ask the human when the orchestrator cannot resolve it. Never run destructive cleanup or broad process killing. Preserve user-owned dirty changes and the previous worker's uncommitted and committed work.

## Send the compact takeover dispatch

Extend the decision-complete dispatch contract with:

| Field | Content |
| --- | --- |
| Task | Outcome, invariants, and no-touch scope |
| Work state | Exact checkout, base, current head, dirty patch, and artifact references |
| Ownership | Previous worker identifiers and ownership-release evidence |
| Attempts | Attempted hypotheses, fixes, and their verified results |
| Reproduction | The failing check or reproduction with expected and observed results |
| Evidence | Accepted useful evidence and open questions |
| External actions | Prior external actions, current state, and replay and disclosure constraints |
| Budget | Remaining task budget and stop conditions |
| Return | Acceptance criteria and the stop and return contract |

Treat the previous worker's claims as claims; verify material evidence from primary sources. Transfer only relevant, redacted context — never a full chat history. Carry prior attempts and consumed budget across sessions; restarting the task does not reset them. For UI work, continue under `computer-use-routing`, and never replay an uncertain non-idempotent mutation.

## Replace cleanly, then stop cycling

The replacement starts with fresh focused context: verify the current work state, challenge the failed assumptions, and solve only the stalled scope. Preserve useful work; do not repeat failed attempts blindly or redo unrelated work. It reports to the same original orchestrator through a verified return path.

When the takeover also hits the same no-progress threshold, stop the automatic retry and replacement cycle and return the evidence to the orchestrator for replanning or a required decision. When the overall task budget is exhausted, stop there: return the evidence for replanning or an authorized budget decision, with no automatic replacement and no reset of consumed budget. There is no model oscillation and no automatic rescue attempt. Genuinely new, different issues may still advance within the scope and budget.

## Keep review independence

Once the replacement edits, it is an implementer for independence. A required independent reviewer is a different session or agent that did not implement the reviewed scope, and the takeover session cannot review its own work. Mixed-authorship R2 follows the [review policy](review-policy.md) as the owner of these rules: two independent reviewers on different models, and each AI implementer model crossed by at least one reviewer. A reviewer is not required to differ in model from every implementer. Review budgets and authority constraints stay intact with no downgrade.
