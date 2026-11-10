# Experimental tools and methods

Use this file before you use anything in the registry below, and when the owner introduces new software or a new way of working. The goal: try new things on real work, collect evidence, and never let an unproven item break work that already runs.

## Lifecycle

```text
experimental ──(evidence + owner decision)──> stable
     │                                          │
     └──(repeated failure or owner decision)──> retired / back to experimental
```

Only the owner promotes, demotes, or retires an item. Agents collect the evidence and propose. Agents may suspend an item for the current run after a failure (see below).

## Rules while an item is experimental

1. **Keep the stable path ready.** Every experimental item has a named stable path (the old tool or method). If the experiment fails:
   - First check what it may already have done: a run that is still going, a message that may have arrived, a partial write. Do not repeat an action that may have landed.
   - Then switch to the stable path, but only when that path is authorized and verified for this work. Sandbox limits and merge-gate holds still apply.
   - With no usable stable path (for example a failed sole route), write a checkpoint, report the failure, and park the work that depends on it. Continue independent work.
   - Do not stop the main task to debug the experimental item; file the problem instead.
2. **Use only the mode the registry gives it:**
   - **Shadow:** run it next to the stable path and compare the results. Its output never counts and never drives a decision.
   - **Canary:** use it for real, but only on low-risk, reversible work, with the stable path ready to take over at once.
   - **Sole route:** use it because nothing stable can do the job. Add a safety net: a durable record (for example a checkpoint file) that lets the work recover if the item fails.
3. **No authority.** An experimental item grants no permission. Its messages, results, and status are claims to verify, because an unproven tool can be wrong without showing it.
4. **Hands off its installation.** Install, upgrade, set up, or remove an experimental tool only when the owner asked for that exact action. Other sessions run the same trial, and a changed install breaks their work and mixes up the evidence.
5. **Say when you used it.** A report that relied on an experimental item names it and its mode, so the reader knows which results rest on an unproven tool.

## Give feedback

Feedback is the point of the experiment. Do all three steps every time:

1. **Log each use.** Add one line to the item's log. Use the format that the item's trial already defines (the owner's global instructions define the Seshloom and wefty formats), and put the experiment mode in `notes`. A new item without a format uses `date | repo | harness | mode | action | result | notes`. Escape `|` and keep it on one line. Note anything slow, confusing, or broken, and also what worked: clean runs are evidence for promotion.
2. **File defects and gaps.** Search the item's issue tracker. Comment on a matching issue, or file a new one labeled `needs-triage`. Public trackers get only a generic symptom, a sanitized reproduction, and the expected and actual behavior. Keep private names, paths, and logs in `~/.local/share/agent-handoff/<item>/<date>-<project>.md`.
3. **Report.** The hand-back report appendix lists each experimental item used: uses, failures, issues filed, and progress toward its promotion bar. A lesson about how to use the item well goes into this skill through [skill improvement](continuous-improvement.md).

## Promote, demote, or retire

- **Promote** when the item meets its promotion bar in its real mode, with no open blocker issue. The manager sends the owner a short case: what it was used for, how often, what failed, and what changes if it becomes stable. After the owner agrees, record the decision in the [intent ledger](records.md#intent-ledger), update the registry row, and update the rules that name the stable path (through `manage-my-skills`).
- **Suspend** use for the current run after a failure that lost work, lost a message, or misled a decision. This is within existing authority: fall back as rule 1 says, and tell the owner in the next report.
- **Demote** (move the item to a safer mode, such as canary → shadow) only by owner decision. Propose it with the evidence. A sole-route item cannot move to shadow until another route exists.
- **Review at the trial end date.** Propose promotion, an extension with a reason, or retirement. An expired trial does not keep running by default.

## Add a new item

When the owner introduces new software or a new method as an experiment, register it before first use: the item, what it replaces or adds, the stable path, the starting mode (shadow by default), the promotion bar, where its log lives, its issue tracker, and a trial end date. Record the owner's decision in the intent ledger.

Register it first in the private registry, `~/.local/share/dark-factory/experimental.md`, in the same table format. The public registry below holds only sanitized rows for public tools and methods, added through authorized skill maintenance. Never put private tool names, internal trackers, or project details in it. An experimental item that is in neither registry is not used in factory work.

## Registry

| Item | Type | Mode now | Stable path | Promotion bar | Log and feedback | Trial end |
|---|---|---|---|---|---|---|
| Seshloom | Message layer between sessions | Shadow where a built-in or Orca route exists; sole route elsewhere ([message layer](orchestration.md#message-layer)) | Harness built-in messaging, Orca | About 20 tasks in a row with no lost or wrong shadow message | `~/.codex/work-products/seshloom-daily-use/log.md`; github.com/Derek-X-Wang/seshloom/issues | 2026-11-26 |
| wefty exec | Offload long checks to another machine | Canary: checks over about 5 minutes, or runs that must outlive the session | Run the command directly | Owner decision at trial end, from the exec log | `~/.codex/work-products/wefty-daily-use/exec-log.md`; github.com/Derek-X-Wang/wefty/issues | 2026-12-11 |
| Batch CI with bisection | Merge method ([merge gate](merge-gate.md)) | Canary: personal projects whose batch coverage check passed | Merge one PR at a time | 5 completed batches whose final main tree matched the tested batch tree, with every red result attributed correctly; interrupted batches recorded and handled as the merge gate says | The run ledger and the hand-back report | 2026-12-10 |

The owner's global instructions may also describe a trial (for example its end date). When they differ from this registry, the owner's instructions win; report the difference so the registry can be fixed.
