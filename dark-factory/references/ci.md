# CI path

Use this module when a task pushes code, waits for CI, writes tests that CI will run, or changes CI. On public repositories, hosted runners are free, so the main cost is waiting: agents and people stay idle until CI answers. On private repositories or paid runners, also count the money (see the plan's CI profile). Before you change CI, propose a CI change, or measure CI for a report or a plan, read [CI changes](ci-changes.md).

## Two numbers

Moved to [CI changes](ci-changes.md#two-numbers).

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
- Prefer fake time over wall-clock waits in tests. Wall-clock timing flakes on shared runners. Remove the timing source from a test where you can; that is better than proving the timing afterwards.
- A fake on one side of a boundary enforces the real side's validation, or at least one test crosses the real boundary.
- Set a timing bound from evidence (measured slack under an outer deadline), not with a blind retry. When you widen one, widen only the cases that end early on success; a negative case keeps its short budget, so the timeout path stays tested.

## Changing CI

Changes to required checks, branch rules, tiers, time budgets, or which stage runs a check change what a green result proves. They need an owner decision. A worker routes that need through its manager; an unattended session records it and parks the change. Until a decision exists, keep the coverage that the [merge gate](merge-gate.md) requires, including the main watcher. Before an approved CI change merges, compare it with the approved design; a different design goes back to the owner, even when it looks safer. Inside an approved CI task, use the patterns in [CI changes](ci-changes.md#changing-ci).

## Records

Moved to [CI changes](ci-changes.md#records).
