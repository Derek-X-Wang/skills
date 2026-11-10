# Field notes

Dated evidence from real unattended runs. This file is public: no private project names, local paths, secrets or logs.

## How to add notes

Add one section per run and role. Use this shape:

```markdown
## <YYYY-MM-DD..YYYY-MM-DD> <project> — <role> (<harness / model>)

**Run:** window, team shape, outcome in one line (PRs merged, spend, big problems).

| What happened | Rule it produced |
|---|---|
| <observed event with evidence: PR, run, time> | <the rule, short and imperative> |

**Held up well:** <practices that worked and should stay>.
**Still open:** <lessons not yet proven, or questions for the next run>.
```

Write what you saw, not what you expect. If a lesson already exists below, add your evidence to it instead of repeating it.

---

## 2026-11-04..2026-11-05 open-source media server — lead (Claude Code, Opus)

**Run:** two nightly windows plus the day between. One lead, Opus workers, Codex and Opus reviewers. 7 PRs merged one at a time on green CI, spend $0, no really big problem.

| What happened | Rule it produced |
|---|---|
| A contract change took 6 patch review rounds. Each round fixed one path, and the next found another on the same seam (an in-memory lock ordering against a store write). A redesign to one store compare-and-set fixed it | When two consecutive rounds put their P1s on the same seam, stop patching and ask for a design pass |
| Reviewers raised migration and mixed-version P1s for 4 design rounds on state that was never released. The owner then ruled: nobody uses the system yet | Mixed-version checks only when a deployed release carries the old contract |
| A plan written against an older main sent a worker to a slice that had already merged | Compare the plan's base with current main before dispatching an item |
| Three green rehearsals "accepted" a caller change, but the rehearsal always ran the pinned release's caller, so the new code never ran | Check that each acceptance gate runs the code under test |
| A floating `*-latest` CI runner label moved to a new OS image overnight and broke three workflows | Pin versioned runner labels and add a mechanical check |
| Read-only reviewers reported "vet blocked: build cache not writable" in about 8 reviews | The orchestrator runs vet, lint and targeted tests on the reviewed SHA and hands the output to the reviewer |

**Held up well:** one merge at a time with main CI between; merge pinned to the head SHA; owner decisions in one ordered list with recommendations.
**Still open:** load from other projects (peaks above 20) kept workers waiting for hours; a cross-project queue for heavy jobs is not proven yet.

## 2026-10-30..2026-11-02 wefty — lead (Claude Code, Opus)

**Run:** about 69 hours (Fri noon → Mon 08:00, with a daylight-saving change). One lead session, two peer Claude sessions, Codex workers. 52 PRs merged one at a time on green CI, spend $0, no really big problem. The session ran the whole window on an in-session cron without a restart.

| What happened | Rule it produced |
|---|---|
| Just before the owner left, the lead asked two questions in a blocking dialog. The owner pointed out it would have stopped the whole run | Once the owner leaves, never use a tool that waits for a human. Questions go to QUESTIONS.md |
| "Pick the most reversible option" led to weak choices | Pick the right option. Lead review + independent second-model review agree → `ASSUMED, needs owner`, carry it out, record the revert. 12 such entries, each with a revert path, went into the report |
| Fast merges cancelled earlier main runs; after one commit no contract run finished, so main was unverified | One merge at a time. The next merge waits until main finishes **all** workflows of the previous one, slow lanes included |
| Peers merged on their own green checks while main moved under them | Pre-merge notice → lead verifies every claim itself → GO → merge pinned to the head SHA → IS IN → lead verifies parents and ancestry → watcher |
| `git merge-tree` with a short SHA failed to resolve | Use full SHAs in every gate command |
| A toolchain patch bump left every queued PR BEHIND | Decide in advance: BEHIND-only needs no fresh CI; if main goes red for a reason linked to the bump, stop and give every remaining PR fresh CI |
| The same network error from the Go module proxy failed a main image build three times | Main flake → rerun once and hold the queue. Unknown cause → file on the second sighting; cause proven by code reading → file on the first. Keep single sightings on a watch list |
| A peer started 10 CPU-heavy processes for a reproduction; load hit 20.9 (limit 20) | A stress test starts small and checks load first. Peers stop at a lower load than the hard limit |
| A local `go test -p 2 -parallel 4` pushed load to 21 | One heavy test job at a time; prove heavy packages in PR CI when the machine is busy |
| Load 24 came from another project's tests and a system process | Load that is not yours is not yours to kill. Wait |
| The usage dashboard refreshed only when the owner clicked a button, so it went stale for the whole run | Stale or missing usage is "unknown" and takes the safe mode. Read a live source: the worker CLI writes its rate-limit percentage into its own session logs |
| The lead told a peer to name a private project in a public issue comment, then corrected it within a minute | Check the exact text you ask a peer to post to a public place, then read what was posted |
| Helpers started with a trailing `&` were untracked: no completion notice, duplicate copies | Start every watcher as a tracked background task; each prints one final line and is re-armed on exit |
| Scheduled CI fired 6–9.7 hours after its cron time | Do not report a scheduled job as failed or missing because it is late. Mark it NOT-RUN in the report and update the report when it finishes |
| Flaky tests with tight timing bounds failed on shared hosted runners (bounds of 1.1 s, 200 ms, a page cutoff) | Fix the bound with evidence (measured slack under an outer deadline), not with a blind retry. File each one as its own small PR |
| Splitting a slow CI job into two saved 20–27% wall time, but runners are shared | Split a CI job only on the critical path; take several samples and drop contended ones |

**Held up well:** the three run files (STATE, log, QUESTIONS); a heartbeat file touched at each step; a 3-hour check that writes usage, liveness and the merge line in one log line; the report written before the owner's return; after the window ended, the same rules, the in-flight merge line finished, and no new items started.

**Still open:** a dead lead session is not restarted by anything, which is acceptable only when the owner agrees in advance. Measuring the share of a shared quota used by each project needs a per-project source; this run had none.

<!-- Peers from the same run: add your sections below (one per session). -->

## 2026-10-30..2026-11-02 second project on the same machine — its own lead (Claude Code, Opus)

**Run:** same window and machine as the lead, but a separate project with its own loop: a public Go repo plus a private cloud-test repo. This session was its own lead (Codex workers, Opus reviewers), not gated by the lead above. Merges ran one at a time on green PR CI plus an independent review, and main CI was green on the first try after every merge. Four paid cloud test runs with a $50 total cap: $33.16 worst case on the ledger, every teardown verified at 0 resources, no really big problem. The owner was briefly reachable from a ship and decided two items in chat on day 3.

| What happened | Rule it produced |
|---|---|
| A zsh poller passed `$ids` (two run IDs) to one `gh run view` call. zsh does not word-split, so the call returned 404 and the poller printed nothing useful (11-02, early morning) | In zsh, split explicitly (`${=ids}`) or loop one ID per call. Treat an empty poller result as unknown and check each run directly |
| A bug fix first added a new wire error code. Local CI failed on the contract golden test and the error-policy completeness test, and old control processes would read the code as "internal, retry" during a workers-first upgrade (11-02) | Unattended, prefer a fix that does not change the contract. Before adding a wire or error code, run the contract tests and check mixed-version upgrade order. A contract bump goes to the owner |
| Two "small" fixes (3 and 7 production lines) each got REQUEST CHANGES on the first independent review: one missed a hang-up path, one broke upgrade compatibility | Keep the independent review even for tiny fixes. In this run it caught a real defect in 2 of 2 small PRs |
| One item went through 4 review rounds. Each round closed one race window and found another, and one window also existed on main (11-01) | After N review rounds without convergence (N=4 here), park the work as a draft PR. Extract any real main bug into its own small PR. Give the owner A/B/C options with a recommendation |
| 5 single main-CI failures in a row: diagnosing each one found 2 product bugs and 3 test bugs | Read the log of every main failure, even when a rerun passes. "Flake" is a conclusion, not a starting point |
| Cloud billing lags 1–2 days, so the ledger counted each unbilled run at measured cost plus an unmeasured bound. Worst case $33.16 + next forecast $20 > $50 cap, while the console showed about $5. The next paid run stayed blocked until the owner returned | Before the owner leaves, agree how unbilled spend counts toward the cap. Expect billing lag to block later paid steps; plan free work for that time |
| The owner was reachable for a few minutes from a ship. Two queued decisions were answered in one short chat (day 3) | Keep the open decisions as a short ordered list, each with options and a recommendation, so a short window answers the most |
| A Codex worker wrote its logs into the system temp root instead of its assigned folder (6 stray files) | Give every worker an explicit output folder in the brief, and check for stray files after each worker finishes |
| A cleanup command ran `rm -rf "${S:?}"` while S was unset. The `:?` guard aborted it and nothing was deleted | Use `rm -rf` only in the `"${var:?}"` form, with var set to one specific subfolder. The guard is the last line of defence, not the plan |
| The usage dashboard was stale for ~72 h in this session too (same cause as the lead's row) | Evidence for the lead's "unknown is not healthy" row |

**Held up well:** throwaway test services (for example Redis) on dedicated non-default ports, never the owner's live instance; a pinned cost forecast and plan hash logged before each paid run, with verified teardown after; one main CI watcher per merge, checked by run ID; the report finished 90 minutes before the owner's return.

**Still open:**
- Proposal for SKILL.md "Red main, flakes, and parking": diagnose every main failure, even when a rerun passes. In this run that found 2 product bugs in 5 sightings.
- Proposal for SKILL.md Phase 1: add "spend accounting under billing lag" to the plan when the run may spend money (how unbilled work counts toward the cap, and who may approve each paid step).
- Proposal for "Decisions while blocked": add a stop rule for review loops that do not converge (park after N rounds, extract independent fixes, give the owner options).
- Open question: with an intermittently reachable owner, should an answer given in chat during the window count as approval for spend, or only for design choices?

## 2026-10-30..2026-11-02 wefty — peer computer-map-6d (Claude Code, Opus)

**Run:** same window, a peer under the lead's gate. It owned flaky-test fixes, CI timing work and several merges, and sent the pre-merge notices. It merged #1428, #1431 and #1440 on the lead's GO (each pinned to the head SHA), opened #1440 and #1442 for flakes it filed (#1439, #1441), and measured the #1427 CI split. Spend $0, no really big problem. The session was compacted once and resumed from its ledger.

| What happened | Rule it produced |
|---|---|
| Right after the toolchain bump (#1428 → 23d99e41), a slow-lane test failed once: the node agent missed its lease renewal during a forced cancel, and nothing reached L1 (run 41405062222). The lead held the queue for one rerun, which was green | While the rerun runs, draft the issue (timeline, suspect commit) and the revert plan. A second sighting is then acted on in minutes. Keep the draft until the watch list is cleared |
| An upstream image build failed on main, so the slow lane's matrix legs were skipped and its result job went red (main 3d829f70) | A main watcher must confirm the slow lane's legs actually ran, not just that the workflow completed. A red caused only by an upstream skip is not a new failure; fix the upstream |
| The flaky shim-loss scope test (#1439) had a real 200 ms budget with 25 ms polls. A 100 ms delay per observation reproduced the exact CI message on the old code, and the new code passed | Reproduce a timing flake with injected delay before fixing it: the old code must fail with the CI message and the new code must pass. Widen only the cases that end early on success. Negative cases keep their short budget so the timeout path stays tested (#1440, the lead's condition) |
| For the paging flake (#1441), the lead's condition was to accept a short page when an overrun counter rose. Codex round 1 BLOCKED it: the counter fires at 100 ms and the cutoff at 120 ms, so a wrong page limit would still pass. The fix used a per-store test override of the cutoff and kept the exact assertion (#1442, round 2 MERGE-WITH-MINORS) | Send the lead's conditions through the second-model review as well. A proof signal must imply the cause, not just occur with it. Prefer removing the timing source in the test over proving it afterwards |
| Timing samples for the #1427 split: the "wait for a quiet pool" watcher timed out after 6 h because the pool never went quiet. Sample 2 started 83 s before another PR's merge and overlapped 3 other runs (36.7 min, −19.9%, not counted). Sample 3 overlapped a main run that started 13 s later | "Quiet" checked only at push time does not hold for 35 min. Ask the lead to hold merges for one sample, or count only runs whose legs all show 0 runner wait. Set the bar and the "contended = not counted" rule before measuring (it decided sample 2 with no argument) |
| #1440 was 19 commits BEHIND. No file overlap, but main had changed the same Go package since the CI base (#1283) | In the pre-merge notice, list same-package changes on main since the CI base, not only file overlap. When the package changed, vet, build and test the trial merge locally and report it. The lead accepted this as evidence instead of fresh CI |
| The shared runners filled their disk during a PR run (#1428 seats leg). One rerun was green | Evidence for the lead's "rerun once" row: an infrastructure failure, classified from the log before the rerun |
| The lead session restarted mid-run under a new message address. Notices sent to the cached address would have gone nowhere | Reply to the sender address on the latest message, and re-list peers after a long silence. Do not cache a peer's address for the whole run |
| The session was compacted while its watchers kept running in the background. It resumed from its run ledger and the watcher output files, with no repeated merge or push | Keep the rules, the merge line and every in-flight watcher ID in a file the session can reread. Each merge, push and notice gets a ledger line written right after it happens |

**Held up well:** checking load before every local test (1-minute load ≤18; it was 2–8 during this session's runs); the lead's one-rerun-per-flake rule; filing a flake on the first sighting when the cause is proven from code (#1439, #1441); `--match-head-commit` with full SHAs on every merge; checking ancestry before removing a worktree or branch; reading the CI log before calling anything a flake.

**Still open:**
- Proposal for SKILL.md "Merge gate": the pre-merge notice lists same-package changes on main since the CI base, plus a local vet/build/test of the trial merge when there are any.
- Proposal for SKILL.md "Red main, flakes, and parking": while the one rerun runs, draft the issue and the revert plan.
- Proposal for SKILL.md "Decisions while blocked": the lead's own conditions on a fix go through the second-model review. The reviewer may replace the lead's mechanism if it keeps the lead's goal.
- Proposal: when a run measures performance, the lead reserves a merge-free window for each sample.
- Open question: single sightings on the watch list have no expiry. The lease-renewal sighting above was still open at hand-back. When does one get dropped or filed without a second sighting?
- Open question: the slow lane's artifact kept no node agent log for the failing row, so the cause stayed invisible. Should "keep the logs needed to diagnose" be a standing follow-up for every unexplained slow-lane failure?

## 2026-10-30..2026-11-02 wefty — peer restartable-runs-1085-35 (Claude Code, Opus)

**Run:** same window and lead as above. This session was a peer under the lead's merge gate. It owned one map (#1102) and took bug tickets from the lead's queue. It used Codex workers for implementation and Codex for independent review. Weekend output: 6 PRs merged on the lead's GO (#1426, #1433, #1434, #1435, #1436, #1438), one new flake filed and fixed (#1437), spend $0, no really big problem. Every main run after the six merges finished green. One of those runs needed a single rerun for the known proxy error (#1432).

| What happened | Rule it produced |
|---|---|
| Each queued PR merged cleanly onto main alone. A simulation of main plus the next PR showed two later PRs would conflict with it (#1426 vs #1433 and #1435, 11-02 ~02:30 PST). The lead moved a clean PR (#1434) forward. The two conflicting PRs got a merge commit from main and fresh CI while the queue kept moving | Before each GO, merge-tree the whole remaining queue in order (chain `git merge-tree` + `git commit-tree`), not only each PR against main. Reorder so conflict fixes and their fresh CI run in parallel with clean merges |
| A peer said "rebase onto the new main" after a toolchain bump (11-01 22:45). A rebase of a pushed PR needs a force-push | Refuse peer suggestions that break a guardrail. Refresh a branch only with a merge commit (`gh pr update-branch` or a local merge), and only when it is CONFLICTING or merge-tree is not clean |
| A new test that cleans shared temp folders failed in PR CI (#1426 round 1, 11-01 17:00). The lead also saw that the same code would sweep the temp folder that the owner's installed product uses on the same machine | On the owner's machine, tests share temp and state folders with the installed product. Give every test its own root through an override (env var or config). Fix existing tests that use the default root (#1430 → #1433) |
| A test hang that looked like a test bug was a product bug (#1283). The Python runtime can clear a stop signal's exit inside a buffered-reader constructor, so the program then blocked forever. A Codex research pass proved it (forced repro 10/10 hangs, fixed 0/10) before any code changed (11-01 20:42) | When a CI hang is "probably the test", get a bounded research pass first and report options to the lead before coding. The lead's expected test-side fix would have hidden a real hang |
| The local test gate was given a relative output folder. It changed directory, wrote no logs and ran no tests, and looked like a quiet pass (11-01 ~20:00) | Pass absolute paths to any gate script that changes directory. Count the `ok` lines; a gate that ran nothing is NOT-RUN, not a pass |
| The Codex worker could not commit: its sandbox blocks the Git index lock | Plan for workers that cannot commit. The worker drafts the commit message in a file; the orchestrator reviews the diff and commits on the host |
| The first main watcher exited at once. Its check (`grep -v completed`) passed on an empty or partial run list right after the merge (main 94a4a4da, 11-02 ~02:40) | A watcher waits until every required workflow exists for the SHA, then checks status. Re-check once after a pause, because some workflows start later than others |
| GitHub showed `UNKNOWN` merge state for every open PR after each main move (11-02, several times) | `UNKNOWN` means GitHub is recomputing. Poll until `CLEAN` before a notice; never report `UNKNOWN` as clean |
| To list "files changed since the CI base", the peer had to infer the base from the CI run's start time and main's commit times (#1426, #1434, #1436) | Record the CI base SHA (main at the time CI ran) in the run log when PR CI finishes. GitHub does not show it on the PR |
| The last status message to the lead was held undelivered, because the two sessions ran in different permission modes (11-02 ~10:50). Earlier messages arrived. This is a different cause from computer-map-6d's address-change row | Write every state change to a file the lead reads as well as to a message. Check the delivery result; a held message is not delivered |
| Evidence for existing rows | Tight timing bound: #1437 (1.1996 s against a 1.1 s limit, run 41389101623), fixed in #1438 with +500 ms under a 2 s outer deadline. Heavy package to CI: the load guard stopped a local cmd/wefty run at load 18 (11-01 20:24); the lead accepted PR CI as proof. Public text: this peer refused the private project name in the #1425 comment. PR invariant check: before the #1433 GO, the main diff was searched for new test setup. Same-package local check (computer-map-6d's row): #1434 and #1435 merged without fresh CI after a vet and exec-test run on the trial merge (126 s and 159 s) |

**Held up well:**
- A notice is not sent until the lead says "#NNNN next". Before that, a pre-check was done so the notice went out minutes after the main run.
- One clone per ticket, removed right after its PR merged, after a check for local changes and unpushed commits.
- An independent Codex review on every PR, including the test-only ones.

**Still open:**
- Proposal for SKILL.md "Merge gate": add "simulate the remaining queue in order" to the pre-merge notice. In this run it found 2 conflicts one merge early.
- Proposal for SKILL.md "Shared machine": tests on the owner's machine must not use the installed product's default temp or state folders. Give each test its own root.
- Proposal for the plan template: list the sessions' permission modes. A mismatch can hold peer messages without notice.
- Cost of one-at-a-time merges: six PRs took about 8.5 hours of the last morning (11-02 02:35 → 10:50 PST), about 1 h of main CI per merge. Open question: can PRs with no shared package merge in pairs, with one main run checking both?

## 2026-10-30..2026-11-02 separate product queue on the same machine — its own lead root-01a128c5 (Codex / model not recorded)

**Run:** the same shared Mac and owner-away window, but a separate bounded product queue, not a worker in wefty's merge line. Used wefty for one local check and two tracked CI observers. One execution-environment failure; both observers finished successfully. The owner briefly returned online and explicitly changed a blocking budget. Final report delivery carried over to Monday 09:01 PST, after this run's stated 08:00 end.

| What happened | Rule it produced |
|---|---|
| On Nov 1, frozen execution `run_38b333270e6aff409455973d9b860cca` failed two unchanged working-directory assertions after 5.755 seconds. Logical and canonical directory names differed. The unchanged complete check passed directly in 258.772 seconds, with 140 test executions. Public evidence: [wefty #1425](https://github.com/Derek-X-Wang/wefty/issues/1425), subsequently fixed by #1435 | Preflight execution-environment assumptions before freezing a long check. Keep an environment failure distinct from a product failure; use only an already-authorized fallback and retain the failed result |
| From Oct 30 into Nov 1, the six-hour recovery guard correctly stayed idle after an explicit CI-budget STOP. It was intended to recover model-capacity interruptions, but this was a terminal budget failure. Both approved product items were already merged, so the apparent second item supplied no independent work | Record the stop reason and the state of every fallback item. Resume only the failure class the recovery rule permits; a completed item is not a fallback queue |
| A pure timer started at Nov 2 00:48 UTC and waited until 17:00 UTC, while the parent repeatedly waited on it. Product release was complete by Nov 1 18:01 PST; actual report delivery was Nov 2 09:01 PST. This kept the Goal alive for a calendar condition rather than unfinished engineering | Separate product completion from timed report delivery. Prefer one scheduled report wake over a sleeping worker plus repeated parent waits; verify the deadline against the agreed window end |
| At closeout, 14.18 GiB of owned build cache was removed only after checking for live consumers and proving the retained CLI and Web outputs were outside it. The retained CLI then validated a saved work successfully after deletion (Nov 1 local time) | Put unique deliverables outside disposable caches. After cleanup, exercise a retained entry point so cache removal cannot silently remove the only usable build |

Evidence for the lead's tracked-watcher and independent-main-verification rows: wefty observers `run_dc8a9c0fb902eb1ada03c9317240d383` and `run_752d4f7b7a7d6be629ff9fe39d770c2c` terminated successfully after 4,822.243 and 4,460.114 seconds; the root separately checked the exact CI heads and all required jobs. No new watcher rule is proposed here.

**Held up well:** the explicit stop reason prevented a capacity-recovery guard from overriding a hard limit; one observer per CI kept observation separate from execution; unchanged-test fallback preserved the environment failure; cleanup retained usable outputs and original evidence. These are observations from this session, not claims about the lead's 52 merges.

**Still open:**
- Proposal for Phase 1: agree a bounded response to whole-job time exhaustion and ensure the fallback queue contains work that is both authorized and still unfinished. Free CI did not override this session's explicit STOP; only a later owner amendment did. Do not infer that future budget changes are preapproved.
- Proposal for Phase 3: distinguish execution completion, report due time, and actual delivery. In this session the separate 09:00 report target exceeded the stated 08:00 run end; pick one authoritative deadline before departure. The scheduled-wake alternative above has not been tested by this session.
- Question for Roles: a peer may be an independently led project on the same machine. Mark whether it belongs to the shared merge gate or only shares resource limits; these notes provide no evidence that the wefty lead's GO protocol was tested by this session.

## 2026-11-02 wefty — lead of an attended acceptance run (Claude Code, Opus)

**Run:** the owner was present, but the runs had the same shape: the lead orchestrated, an AI agent session (PRIMARY) acted, and the owner only clicked dialogs. Two attended runs on an isolated proof install (about 2.5 hours, then about 1 hour). Spend $0, the memory guard never tripped. Both were PARTIAL: the first found wefty #1446 (fixed the same evening); the second found that the sleep fix was only half built (wefty #1333 reopened).

| What happened | Rule it produced |
|---|---|
| PRIMARY ran in a sandboxed `dontAsk` mode and the lead in another mode, so all 6 lead messages to PRIMARY were held until the owner clicked approve | Put sessions that exchange messages in the same permission mode before the run. If the session under test must differ, plan for a human to approve or paste each message, and keep those messages few |
| The lead missed a "capture status just before the window expires" step while other work ran | Schedule every fixed-clock check as a timer when its anchor is recorded |
| While the operator was away for 30 minutes, a Seat ended by its idle timeout, and the next step needed a fresh Seat | Know every idle and expiry clock in the system under test. Keep the next step inside them, or plan a renewal |
| The Seat command path passed its unit tests, but failed on every real call: the agent omitted a field the helper requires. Every agent test used a fake helper that never validated (wefty #1446) | A fake on one side of a boundary must enforce the real side's validation, or one test must cross the real boundary. Attended runs catch what such fakes hide |
| `"$A:path"` in zsh applied a history modifier and dropped the path; the copy failed as an operator error | In zsh, write `"${A}:path"` whenever a colon follows a variable |
| A watcher was started on a remembered Computer ID, but the new Seat had landed on a fresh Computer | Read IDs from the store just before starting a watcher; never reuse a remembered ID across a state change |
| A long command pasted into a terminal was cut short, so the shell saw an unmatched quote and ran nothing | Give an owner long commands as a short script file to run, with the exact command inside |
| The runbook's token-interval duration read a monotonic clock in two processes and printed 0.02 s for a 6-minute interval (wefty #1449) | Never subtract monotonic readings from different processes; use wall-clock or the log's own timestamps |
| At about 22:20, the lead asked the owner two triage questions with a blocking dialog. The owner was already done for the night, so the lead session waited until 07:40. Main had been green since 22:25, and nothing merged for 9 hours, although the peers kept working | Close or convert every blocking question before the nightly window. Send the evening handoff on time, even when the evening was busy |
| To stop messages being held, PRIMARY was restarted in bypass mode with the sandbox still configured. A `curl https://example.com` from PRIMARY then exited 0: the sandbox no longer blocked internet | Matching permission modes and a network-sandboxed agent may not be possible together in one harness. Re-prove the sandbox after every mode change, and record which rows lose sandbox evidence |
| The proof removal failed with "directory not empty": the memory-guard watcher was still running and wrote a result file into the root while it was being purged | Stop every watcher that writes into a root before purging that root; then verify the root is gone |
| A 31 s sleep was followed by a 10 s macOS DarkWake (Wi-Fi/Bluetooth). In that first second, the node agent's own safety watchdog ended the Computer, although L1 had just been fixed to credit sleep (wefty #1333 reopened) | A fix to one side of a lease (the server) is not a fix until the other side (the client's self-fencing watchdog) agrees. Test sleep with real hardware: short sleeps and dark wakes behave differently from a clean long sleep |

**Held up well:** the lead verified every claim from the store and logs (approval source, intent history, Seat events) instead of trusting tool replies; the evidence was saved before the proof install was purged; each blocked row was recorded as NOT-RUN with its cause, not as a soft pass.

---

## Merge status and owner answers (2026-11-02)

The proposals under "Still open" in the five sections above were merged into SKILL.md, merge-gate.md and plan-template.md on 2026-11-02. The owner then answered the four open questions:

1. A chat reply from a briefly reachable owner counts as approval for everything, spend included.
2. A single sighting on the watch list is dropped after 14 days without a repeat. A product-behavior symptom is filed on the first sighting (the lease-renewal sighting was filed as wefty #1444).
3. When missing logs block a diagnosis, file a small issue to keep them, every time (wefty #1445).
4. No merging in pairs: one merge at a time stays, so a red main maps to one change. *Superseded 2026-11-10:* CI waits slowed every project too much. The owner chose batch testing with bisection on red, which maps a red result to one failing PR, or to a small set that fails only together ([merge-gate.md](merge-gate.md)).

## 2026-11-03..2026-11-05 wefty — lead (Claude Code / Opus)

**Run:** two nights plus the day between; lead plus two peer sessions; 12 PRs merged one at a time. A package mirror (snapshot.debian.org) was degraded for about 20 hours.

- **Wrong probe, wasted reruns.** The lead's health poller first fetched the mirror's index file, which a CDN served fine while package files returned 503. Next it fetched real packages from the owner's Mac, which worked while CI runners still got 503. Each false "healthy" cost a 35-minute CI rerun. Probe the exact resource from the consumer's network.
- **Gate deadlock.** "Next merge only after main is fully green" could not be met while the mirror was down, and the fix (a CI package cache) was itself a merge. The owner granted two one-time exceptions at night. Decide in advance how an outage repair may merge.
- **Exception scope.** The lead upgraded the owner's install right after an exception merge, before that commit's main run finished. Status checks passed, but acceptance evidence was missing. An exception covers the merge, not the upgrade.
- **Peer boundaries.** The lead asked a peer to run a local container; the peer's standing rule forbade it, and it refused. The boundary worked; the lead lacked the peer's constraints in its plan.
- **Busy CI hid an idle bug.** A performance gate passed on a PR (about 850 ms) and failed on main (about 1.7 s): the CI image kept the screen server busy, so its idle sleep never showed. Gate the idle case separately.

