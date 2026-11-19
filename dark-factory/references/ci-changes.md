# CI changes

Read this before you change CI, propose a CI change, or measure CI for a report or a plan. A CI change needs an owner decision first; [CI path](ci.md#changing-ci) holds that rule.

## Two numbers

Track these per project in the run log, with the SHA and the push time you recorded, and end times from the Actions API (`gh run view <id> --json jobs`), not from memory. Count runner queue time; it is often the largest part. If you must use the run's `created_at` as the start, label it as a proxy:

- **Push to first actionable failure:** from the push to the moment a failed job names a failing test or step.
- **Final candidate to merge-ready:** from the push of the merge candidate (PR head, or batch head) to the moment every required check on it is green.

Runner minutes are a secondary number. A change that saves minutes but not waiting needs its own reason.

Report each number as a median and a p90, with n. Waiting hurts in the tail: in one project a queue-time median stayed at 0.1 min while its p90 fell from 95 to 28 min after a change. For a before/after comparison, give both windows and their workload (merged PRs, runs); a quieter after-window may explain part of a drop, so say so.

## Changing CI

Inside an approved CI task, use these patterns:

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
