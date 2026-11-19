# CI path

Use this module when a task pushes code, waits for CI, writes tests that CI will run, or changes CI. CI is a tool to find problems early. On public repositories, hosted runners are free, so the main cost is waiting: agents and people stay idle until CI answers. On private repositories or paid runners, also count the money (see the plan's CI profile).

## Two numbers

Track these per project in the run log, with the SHA and the push time you recorded, and end times from the Actions API (`gh run view <id> --json jobs`), not from memory. Count runner queue time; it is often the largest part. If you must use the run's `created_at` as the start, label it as a proxy:

- **Push to first actionable failure:** from the push to the moment a failed job names a failing test or step.
- **Final candidate to merge-ready:** from the push of the merge candidate (PR head, or batch head) to the moment every required check on it is green.

Runner minutes are a secondary number. A change that saves minutes but not waiting needs its own reason.

Report each number as a median and a p90, with n. Waiting hurts in the tail: in one project a queue-time median stayed at 0.1 min while its p90 fell from 95 to 28 min after a change. For a before/after comparison, give both windows and their workload (merged PRs, runs); a quieter after-window may explain part of a drop, so say so.

## Before you push

- Run the project's local gate in CI order (for example `make check-quality`) and the tests of the packages you changed. Check the machine load first; run heavy suites only when the 1-minute load allows it.
- Push a coherent revision. Where the repository cancels superseded PR runs, each push restarts the PR's CI, so do not push small fixups while CI runs unless they fix a failure.
- A check that needs an environment you do not have (another OS, real timing, built release binaries) is NOT-RUN locally. Say so; CI decides.
- Never pipe test output through `tail`, `head`, or `grep` in a gate: it hides the exit code.

## While CI runs

- One watcher per run. Take the run ID from the live list just before you start the watcher; a remembered ID can be stale. Poll job status at most every 120 s (`gh run view <id> --json jobs`, or `gh run watch <id> --interval 120`; plain `gh run watch` polls every 3 s). Several fast pollers exhaust the GitHub API limit.
- Watch jobs, not only the aggregate gate. The first failed job with a named test is actionable at once; the aggregate can turn red much later (once 46 minutes later).
- On the first failed job, read its log and classify it (code, flaky test, or infrastructure) as [red main, flakes, and parking](#red-main-flakes-and-parking) says. Reruns, filing thresholds, and parking follow that section, not a shortcut here.
- A code failure inside your assigned scope: start the fix now. Do not wait for the rest of the run. A failure outside your scope, or one that needs a rerun, an issue, or another external write you have no authority for: report it with the evidence to your manager (or park it, unattended).
- A re-run keeps the commit and ref of the original run. For a `pull_request` run that is the merge commit built when the run was first created, so a green re-run says nothing about a base that moved afterwards. Evidence on the current base comes from a new run (a new push, or another event the workflow triggers on) or from the batch test under the [merge gate](merge-gate.md#fresh-ci-policy).
- Who watches what: a worker watches its own PR until it is green or handed back. The project manager watches batch heads and main. Workers do not wait on the batch or main. A worker that returns through a one-message channel (a native child) stops watching when it returns; its manager watches from then on.

## Red main, flakes, and parking

External fixes, filings, reruns and merges in this section require the relevant project/run authority; otherwise prepare private evidence/drafts and park the action.

- Read the log of **every** main failure, even when a rerun passes. "Flake" is a conclusion, not a starting point: in one run, 5 single failures held 2 product bugs.
- Classify: code, flaky test, or infrastructure (network, runner disk, registry, an upstream job whose failure skipped the slow lane).
- **Main red from code:** open a revert PR. Never force-push.
- **Main red from a flake or infrastructure:** rerun the failed jobs once and hold the queue. While it runs, draft the issue and the revert plan, so a second failure is handled in minutes. A second failure parks the queue.
- **External outage** (a package mirror, registry or proxy down for hours): after the queue parks, reopen only when a probe of the exact resource the consumer needs (package, version, arch) succeeds through the consumer's own network, preferably from CI itself. A probe of an index file, or from another machine, proves nothing. A good probe earns one rerun of the failed jobs, not a claim of recovery; allow at most 3 such reruns, at least 1 hour apart, then wait for the owner.
- **Outage repair:** before a PR that repairs a verified external outage merges while main is red, read [outage repair](merge-gate.md#outage-repair-while-main-is-red); it needs the owner's pre-approval.
- **Owner exceptions** cover the named merge only. Upgrading the owner's install still waits until that commit's main run is verified, unless the owner says otherwise.
- **PR flake:** rerun once; file the flake and fix it as its own small PR. Reproduce a timing flake with injected delay first: the old code must fail with the CI message and the new code must pass.
- **Filing:** an unknown cause is filed on its second sighting; a cause proven by reading the code is filed on the first. A symptom of product behavior (a lost lease, lost data, a wrong state) is filed on the first sighting too, even when the cause is unknown.
- **Watch list:** keep the other single sightings on a watch list in the report. Drop an entry after 14 days without a repeat.
- **Missing diagnostics:** when a failure cannot be explained because the artifacts lack a log, file a small issue to keep that log, every time. The next failure can then be diagnosed.
- **Park an item** (one PR or task, as distinct from the queue above) after 3 unexplained CI failures of its own, with notes and a reproduction.

## Writing tests that CI runs forever

Every test you add runs on every future push. Keep that cost honest:

- A regression fix comes with the smallest test that fails on the old code and passes on the fix. Show both results.
- Extend an existing test when it already covers the path. Add a new test only for behavior no current test protects, and say which behavior.
- A new slow test (over about 30 s, or one that needs a special runner) states in its PR what it alone protects, and which tier it belongs to.
- Prefer fake time over wall-clock waits in tests. Wall-clock timing flakes on shared runners.
- A fake on one side of a boundary enforces the real side's validation, or at least one test crosses the real boundary.

## Changing CI

Changes to required checks, branch rules, tiers, time budgets, or which stage runs a check change what a green result proves. They need an owner decision. A worker routes that need through its manager; an unattended session records it and parks the change. Until a decision exists, keep the coverage that the [merge gate](merge-gate.md) requires, including the main watcher. Before an approved CI change merges, compare it with the approved design; a different design goes back to the owner, even when it looks safer. Inside an approved CI task, use these patterns:

- **Stages, as a proposal.** A common target: member PRs get fast, actionable checks; the final candidate (PR head or batch head) runs the expensive combined checks; main and schedules keep what only they can show. Moving a check off member PRs, off main, or onto a schedule is a coverage change: propose it with run evidence of what the check has caught. A batch tested as a pull request skips jobs that run only on `push` to main; the [merge gate](merge-gate.md#before-the-first-batch-in-a-repository) says how to cover them. When a check leaves member PRs, a PR that merges from its own run (a solo PR) still needs it: give it an explicit opt-in, for example a `full-ci` label with the `labeled` trigger. A run started by any other label must skip every job and use its own concurrency group, so it cannot cancel a real run.
- **One aggregate required check.** It fails closed: any needed job that failed, was cancelled, is missing, or was skipped when it should run is red. A second workflow must never emit the same check name.
- **Change classifier.** Decide the short path from a local `git diff` of the event's base and head, never from a paged API. Only an exact allowlist (for example docs that no test reads) takes the short path. Renames, deletes, mode changes, unknown paths, CI or script changes, an empty diff, and pushes to main take the full path. Find which tests read the "doc" files first.
- **Cancel superseded PR runs.** Do not cancel main runs.
- **Timeouts.** Every job and long step has one, and a step or package timeout is shorter than its job, so a hang leaves a log. A timeout is a design signal: report it and propose either more time or a split; the budget is an owner decision. Do not raise a budget on your own.
- **Splitting.** Split or shard only the job on the critical path, and measure several runs before and after. Parallel jobs cost startup and runner slots; on GitHub Free, macOS slots are few (about 5 at once), so macOS demand is often the real queue. A split that adds a macOS job can add more queue time than it saves: record each job's queue time (`created_at` to `started_at`) before and after. Performance samples need a merge-free window per sample, agreed with the lead before measuring, and a "contended = not counted" rule set in advance.
- **Stable inputs.** Pin runner images (no `-latest`) and enforce the pin with a script. Cache pinned downloads and verify their checksums every run. Use native runners, not emulation.
- **Cheapest platform that proves the claim (proposal).** A platform-neutral check may run once on the cheapest runner with a small witness on the other platform. Reducing an existing platform's coverage is a coverage decision for the owner; keep it until then. Do not call Linux evidence Mac evidence.
- **Free before paid.** Use hosted runners first. A new lane that spends money or needs secrets should be manual or main-only, not on PRs; moving an existing PR lane is a coverage decision for the owner.
- **Keep CI-about-CI small.** Tests of the workflow itself catch real mistakes but also add time and false reds. Adding snapshot or history tests of workflows needs owner approval.

## Records

Keep a CI profile per repo in the project plan: the required check name and whether a branch rule enforces it, the two numbers above (median and p90), macOS jobs per run, main-only jobs, free or paid runners, open flake issues, and the date of the last measurement.
