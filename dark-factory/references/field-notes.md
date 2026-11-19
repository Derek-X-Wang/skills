# Field notes

Evidence index for maintainers, not instructions. Each line is a rule from a real run, under the instruction file that owns it, with its date and evidence. A line marked **only here** holds a rule no instruction file states yet, in full, so the lesson is not lost.

The full narratives (2026-10-30 to 2026-11-05) are in the private log `~/.local/share/dark-factory/logs/field-notes-archive-2026-11-19.md` on the machine where they were written, and in this file's git history. New notes go to private run storage ([records](records.md)) and reach this file only by promotion ([continuous improvement](continuous-improvement.md#field-notes)).

## [unattended.md](unattended.md)

- No tool that waits for a human once the owner leaves → 2026-10-30: a pre-departure dialog would have stopped the run.
- No blocking question at nightfall; evening handoff on time → 2026-11-02: one dialog held merges 9 hours.
- Pick the right option, not the most reversible; record the revert → 2026-10-30: weak choices.
- Short ordered decision list → 2026-11-01: a brief owner window answered two decisions.
- Same seam twice: stop patching, replan → 2026-11-04: six rounds on one seam; a redesign fixed it.
- Contract-preserving fix first; mixed-version checks only for a deployed release → 2026-11-02: a new error code broke contract tests; 2026-11-04: four rounds on unreleased state.
- Research pass before a test-side fix → 2026-11-01: a "test hang" was a product hang.
- A chat reply approves only what it clearly answers → owner, 2026-11-02 and 2026-11-11.
- Recovery never resumes a hard STOP → 2026-11-01: the guard rightly stayed idle.
- Unbilled spend at a worst-case bound → 2026-11-01: billing lag blocked a paid run.
- Tracked watchers, one final line → 2026-10-30: `&` helpers ran twice, silently.
- Re-read IDs just before starting a watcher → 2026-11-02: a stale remembered ID.
- Log each action at once; keep watcher IDs in a file → 2026-11-01: a compacted session resumed cleanly.
- State to a file as well as a message; check delivery → 2026-11-02: a held status message.
- Reply to the latest sender address → 2026-11-01: the lead restarted under a new address.
- Verify delivery under the real permission modes → 2026-11-02, Claude Code: six messages held for a click.
- Re-prove the sandbox after a mode change → 2026-11-02: a blocked call succeeded.
- One scheduled wake; completion, due time and delivery apart → 2026-11-02: a timer kept a finished run open.
- Fixed-clock checks as timers → 2026-11-02: a capture step was missed.
- Unknown usage is not healthy → 2026-10-30: the dashboard stayed stale all run.
- One heavy test job at a time; start stress tests small → 2026-10-30: load passed the limit twice.
- Others' load is not yours to kill → 2026-10-30: load 24 from another project.
- Each test gets its own temp root → 2026-11-01: a test would have swept the installed product's temp folder.
- `rm -rf "${var:?}"` only → 2026-11-01: the guard stopped an unset-variable delete.
- Deliverables outside caches; run a retained entry point → 2026-11-01: a 14 GiB cleanup.
- Check the text a peer posts publicly → 2026-10-30: a private name nearly went public.
- Refuse peer advice that breaks a guardrail → 2026-11-01: a suggested force-push rebase.

## [orchestration.md](orchestration.md#worker-checks)

- Worker output folder; check stray files → 2026-11-01: six stray files.
- A worker that cannot commit drafts the message → 2026-11-01: the sandbox blocked the Git lock.
- Absolute gate paths; ran-nothing is NOT-RUN → 2026-11-01: zero tests looked green.
- Preflight the environment; an environment failure is not a product failure → 2026-11-01: path names differed.
- Compare plan base with main before dispatch → 2026-11-04: a slice already merged.
- Acceptance gates run the code under test → 2026-11-04: rehearsals ran the pinned release.

## [orchestration/review-policy.md](orchestration/review-policy.md)

- The orchestrator runs checks for a read-only reviewer → 2026-11-04: about 8 blocked reviews.
- The lead's conditions go through review; a proof signal must imply the cause → 2026-11-01: review blocked a condition a wrong limit would pass. **Only here:** "Prefer removing the timing source in the test over proving it afterwards." "The reviewer may replace the lead's mechanism if it keeps the lead's goal."

## [orchestration/cleanup.md](orchestration/cleanup.md)

- Stop writers before purging a root → 2026-11-02: a watcher wrote during a purge.

## [ci.md](ci.md)

- Read every main failure log → 2026-11-01: 5 failures held 2 product bugs.
- Rerun once and hold the queue; draft the issue meanwhile → 2026-10-30 and 2026-11-01.
- Filing thresholds; 14-day watch list → 2026-10-30; owner, 2026-11-02.
- File an issue to keep missing logs → owner, 2026-11-02.
- Reproduce a timing flake with injected delay → 2026-11-01. **Only here:** "Widen only the cases that end early on success. Negative cases keep their short budget so the timeout path stays tested."
- **Only here:** "Fix the bound with evidence (measured slack under an outer deadline), not with a blind retry." → 2026-10-30: tight bounds failed on shared runners.
- Probe the exact resource from the consumer's network → 2026-11-04: false "healthy" probes.
- An exception covers the merge, not the upgrade → 2026-11-04.
- A fake enforces the real side's validation → 2026-11-02: fakes hid a missing field.
- Split only the critical path; merge-free sample windows → 2026-11-01: contended samples.
- Pin runner images → 2026-11-04: a `-latest` label broke three workflows.

## [merge-gate.md](merge-gate.md)

- Batch test with bisection → owner, 2026-11-10, after six serial merges took 8.5 hours.
- Pre-agree outage-repair merges → 2026-11-04: two night exceptions.
- Full SHAs in gate commands → 2026-10-30.
- Same-package changes in the notice → 2026-11-01.
- Simulate the remaining queue → 2026-11-02: two conflicts found early.
- Refresh only with a merge commit → 2026-11-01.
- Record the CI base SHA → 2026-11-01.
- `UNKNOWN` is not clean → 2026-11-02.
- Wait until every required workflow exists → 2026-11-02: a watcher exited on an empty list.
- Confirm slow-lane legs ran → 2026-11-01.
- zsh: one run ID per call → 2026-11-02.

## [report-template.md](report-template.md)

- A late scheduled job is NOT-RUN → 2026-10-30: cron fired hours late.

## [plan-template.md](plan-template.md)

- Whether a peer shares the merge gate or only resources → 2026-11-01.
- Hard stops and a fallback queue of unfinished work → 2026-11-01: the fallback item had already merged.
- Each peer's standing restrictions, their source and the authorized fallback → 2026-11-04: a peer refused planned work.

## Only here

- "In zsh, write `"${A}:path"` whenever a colon follows a variable." → 2026-11-02.
- "One clone per ticket, removed right after its PR merged, after a check for local changes and unpushed commits." → held up well across the 2026-11 runs.
- "Give an owner long commands as a short script file to run, with the exact command inside." → 2026-11-02: a pasted command was cut.
- "Never subtract monotonic readings from different processes; use wall-clock or the log's own timestamps." → 2026-11-02.
- "Know every idle and expiry clock in the system under test. Keep the next step inside them, or plan a renewal." (unattended.md names only the idle deadline) → 2026-11-02: an idle timeout ended a session.
