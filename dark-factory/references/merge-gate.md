# Merge gate

Use this strict integration policy only when selected by the project/run. It does not authorize merges or apply to Bite private review/local-fix processing. The project execution owner (lead) is the only gate.

**Default flow: batch test, then bisect on red** (owner decision 2026-11-10; it replaces the one-merge-at-a-time rule of 2026-11-02). Each PR passes its own checks and the lead's verification. The lead then tests a batch of ready PRs together as one combined tree, and merges the whole batch when that tree is green. When the batch is red, the lead splits it in half until the failing PR is found, and the green PRs still merge. This keeps the goal of the old rule: every red result maps to one failing PR, or to a small set of PRs that fail only together. It also cuts the wait: with about 1 hour of CI, 10 PRs take about 1 hour when all are green and about 3–5 hours with one bad PR, compared with about 10 hours one at a time.

If the repository already has a merge queue with batching and bisection turned on (for example GitHub merge queue), use it for the batch test and bisect steps instead of the manual branches below; do not run both. Turning a merge queue on is a repository settings change and needs the owner's authority for that repository.

## Pre-merge notice (peer → lead)

```text
PRE-MERGE NOTICE #<PR> (<issue>: <one-line title>)
- Main: <full SHA>
- Head: <full SHA>
- GitHub: CLEAN, <n> pass, <n> skipping, 0 fail, 0 pending
- merge-tree onto <main short SHA>: clean
- BEHIND: <n> commits
- CI base: <SHA> (main at the time PR CI ran; and whether it is the merge base)
- Main changed <n> files since the base. Overlap: <files, hunk locations, why independent>
- Same-package changes on main since the base: <packages, files>. If any: local vet/build/test of the trial merge, with results
- Queue simulation: <the remaining PRs merged in order on top of this one: clean / which conflict>
My view: fresh CI needed / not needed, and why.
```

Send the notice when the PR's own CI is green and its review is done. The lead collects ready PRs for the next batch. The lead may ask for a fresh notice when main moves before the batch is built.

Record the CI base SHA in the run log when PR CI finishes. GitHub does not show it on the PR, and inferring it later from run times is slow and error-prone.

A merge state of `UNKNOWN` means GitHub is recomputing after main moved. Poll until it is `CLEAN`; never report `UNKNOWN` as clean.

## Lead verification (do every step yourself; never copy the peer's claims)

```bash
git fetch -q origin main "pull/$PR/head:refs/remotes/pr/$PR"
git rev-parse origin/main "refs/remotes/pr/$PR"            # both match the notice
gh pr view "$PR" --json state,mergeStateStatus,mergeable,headRefOid
gh pr checks "$PR" --json bucket --jq 'group_by(.bucket)|map("\(.[0].bucket)=\(length)")|join(" ")'
git merge-tree --write-tree origin/main "$HEAD_FULL_SHA" >/dev/null && echo CLEAN   # full SHA; a short SHA can fail to resolve
B=$(git merge-base origin/main "$HEAD_FULL_SHA")
comm -12 <(git diff --name-only "$B" origin/main | sort) <(git diff --name-only "$B" "$HEAD_FULL_SHA" | sort)
# For each overlapping file, compare hunk ranges:
git diff -U0 "$B" origin/main -- "$F" | grep '^@@'; git diff -U0 "$B" "$HEAD_FULL_SHA" -- "$F" | grep '^@@'
```

Simulate the remaining queue in order, not only this PR against main. Each PR can merge cleanly onto main alone and still conflict with a PR ahead of it:

```bash
tree=origin/main; parent=$(git rev-parse origin/main)
for sha in $QUEUE_FULL_SHAS; do        # in merge order
  out=$(git merge-tree --write-tree "$parent" "$sha") || { echo "CONFLICT at $sha"; break; }
  tree=$(echo "$out" | head -1)
  parent=$(git commit-tree "$tree" -p "$parent" -p "$sha" -m sim)
done
```

When a later PR conflicts, give it a merge commit from main and fresh CI now, while the clean PRs keep merging.

Also check what the PR's invariant depends on. Example: a PR that gives every test its own folder is only complete if main added no new test setup since the base. Grep the main diff for that pattern.

Reply `READY #<PR>` (admitted to the next batch) with the facts you checked, or `HOLD` with the reason.

## Before the first batch in a repository

Batching is safe only when the batch run checks what main would check. Once per repository (and again after a workflow change), compare the workflow triggers and record the result in the plan:

- The required workflows run on the batch PR event, and do not skip jobs for draft PRs or for that branch name.
- The PR run checks out a tree equal to the batch tree. On `pull_request`, GitHub tests a synthetic merge of the head into the base; that equals the batch tree only while main is still the batch's base.
- List jobs that run only on main (for example on `push` to main or on a schedule). They are not covered by the batch run; the main watcher covers them after the merge.

If required coverage cannot be matched, use a supported merge queue, or keep one merge at a time for that repository.

The lead is the only integrator during a batch. If people or tools outside this gate can merge to main at the same time, use a supported merge queue instead of manual batches.

## Batch test (lead)

**Choose the batch.** Take READY PRs in queue order, up to 8 by default (the plan may set another size). Use smaller batches (2–4) when recent batches were often red, because each red batch costs extra bisect runs. A PR goes in a batch of its own when it changes the toolchain, CI configuration, a schema or data migration, a shared generated artifact, or anything the plan names as a solo item.

**Build the combined tree** on current main, in a clean lead-owned temporary worktree. Stop on any conflict; never publish a partial batch:

```bash
set -e
git fetch -q origin main
BASE=$(git rev-parse origin/main)                    # record: the batch base
git switch -c "batch/$N" "$BASE"
for sha in $BATCH_FULL_SHAS; do                      # in queue order
  git merge --no-ff --no-edit "$sha" || { git merge --abort; echo "CONFLICT at $sha: drop it and rebuild"; exit 1; }
done
for sha in $BATCH_FULL_SHAS; do git merge-base --is-ancestor "$sha" HEAD; done
[ -z "$(git status --porcelain)" ]
BATCH_TREE=$(git rev-parse 'HEAD^{tree}')
git push -u origin "batch/$N"
gh pr create --draft --base main --head "batch/$N" --title "batch $N: #a #b #c (CI only, do not merge)" --body "<PR list and head SHAs>"
```

Record the batch base, the batch tree, and each member's head SHA. The batch PR exists only to run the required workflows; close it when the batch is resolved. Delete the `batch/*` branch only when the plan lists temporary batch branches as deletable; otherwise keep it. This needs the run's existing push and PR authority; without it, park the batch and ask.

**Green:** every required workflow finished with success on the batch head, and main is still the batch base. Merge the members (see below). If main moved, rebuild on the new main and test again.

**Red:** read the log first, as for any failure ([unattended](unattended.md#red-main-flakes-and-parking)). A flake or infrastructure failure gets one rerun of the failed jobs. For a code failure, bisect. Build every subset from the same batch base:

1. If the log clearly points to one member, test that member alone and the batch without it, in parallel.
2. Otherwise split the batch into two halves in queue order and test both halves, in parallel when runners allow. Repeat on a red half until one PR is left.
3. If both halves are green, the failure needs members from both halves. Keep half A whole and bisect half B to the smallest part that still fails with A. Then keep that part of B and bisect A the same way. The result is the smallest failing set, which can have more than two PRs.
4. Send the failing PR, or every PR of the failing set, back to its worker with the log. Mark a failing set as coupled: after the fix, its members go in one batch together. The other members form a new batch on current main.

If bisecting takes more than about 2·log2(n) rounds, stop. Park the members still under suspicion together as one unresolved set, with the logs, and send it back. Do not clear any of them because it passes alone: only a green run of the whole set clears it. Merge the members already proven innocent as a new batch.

## Merge (lead, or the peer the lead names)

`READY` does not authorize a merge. The lead sends one instruction per green batch: `MERGE batch <N>: #a@<head>, #b@<head>, … in this order, base <BASE>`. Only the named executor merges, and only those heads in that order.

Before each merge, check that main is exactly where it should be: the batch base before the first merge, and the previous member's merge commit after that. Then merge pinned to the tested head:

```bash
[ "$(git ls-remote origin refs/heads/main | cut -f1)" = "$EXPECTED_MAIN" ] || { echo "MAIN MOVED: stop"; exit 1; }
gh pr merge "$PR" --merge --match-head-commit "$HEAD_FULL_SHA" \
  --subject "merge #$PR: <title>" --body "<title>"
EXPECTED_MAIN=$(git ls-remote origin refs/heads/main | cut -f1)    # this member's merge commit
```

`--match-head-commit` refuses the merge if anyone pushed to the PR after the test. It does not pin main. If a merge is refused or main moved, stop. The main tip is now an untested combination: run the main watcher on it and rebuild the remaining members as a new batch.

## IS IN, then lead verification

```bash
git fetch -q origin main
for sha in $BATCH_FULL_SHAS; do git merge-base --is-ancestor "$sha" origin/main || echo "MISSING $sha"; done
[ "$(git rev-parse 'origin/main^{tree}')" = "$BATCH_TREE" ] && echo TREE-MATCHES-TESTED
```

A tree that matches the tested batch tree means main holds exactly the code that passed. The intermediate main commits inside the batch are verified only as part of the batch; that is the accepted tradeoff of batching. Start the main watcher on the new main head. It also covers the main-only jobs. The next batch may be built and tested on that head while the watcher runs, but it merges only after the watcher says DONE.

## Main watcher (sketch)

Run as a tracked background task. It ends with exactly one line.

```bash
sha=<short>; end=$(( $(date +%s) + 10800 ))
while [ "$(date +%s)" -lt "$end" ]; do
  j=$(gh run list --branch main --limit 30 --json headSha,workflowName,status,conclusion,databaseId)
  # For each required workflow, read "status conclusion" of the run whose headSha starts with $sha.
  # Path-filtered or matrix workflows: pick the run that actually ran jobs (not an all-skipped run).
  # Any failure/cancelled/timed_out -> echo "MAIN $sha RED ..."; exit
  # All required "completed success" -> echo "MAIN $sha DONE ..."; exit
  sleep 120
done; echo "MAIN $sha TIMEOUT"
```

List the required workflows by name in the plan. A workflow that is missing for this SHA counts as not finished. Right after a merge the run list is empty or partial, and some workflows start later than others: a check like "no run is still in progress" passes at once on an empty list. Wait until every required workflow exists for the SHA, then judge.

For a matrix or slow lane, confirm its legs actually ran. A red result caused only by an upstream job's failure, which skipped the legs, is not a new failure: fix the upstream job.

In zsh, `$ids` with two run IDs is one word. Loop over one ID per call (or use `${=ids}`), and treat an empty watcher result as unknown, not as success.

## Why batches are spaced

A new push to main can cancel the previous main run (concurrency groups). Inside a batch this is acceptable: the batch tree was already tested with the required coverage recorded in the plan, and the batch's final main head runs everything, including main-only jobs. Between batches it is not acceptable: if the next batch merges before main finishes, a red result can no longer be tied to one batch. Wait for all workflows on the batch's final head, slow lanes included, before the next batch merges.

When main goes red after a batch, classify the failure as usual. Merging subsets onto current main cannot isolate a code failure, because main already holds every member. Instead:

- If the log clearly names one member, open a revert PR for that member only.
- Otherwise open one revert PR for the whole batch. Before merging it, check that its tree equals the batch base tree (`git rev-parse "$BASE^{tree}"`). Then find the cause by building subsets from the batch base under the failing job's conditions. If that job runs only on main, reproduce it locally or ask the owner how to run it. Rebatch the innocent members after the cause is known.

## Fresh-CI policy

The batch test runs every member on current main, so it is the fresh CI for a PR that is only BEHIND or that shares packages with recent main changes. A PR does not need its own fresh run before it joins a batch.

- Overlapping files with interacting hunks → refresh the PR branch and run its own CI before it joins a batch (`gh pr update-branch`, a merge commit, never a force-push).
- Name exceptions before the run starts (for example a toolchain bump).
- Refresh a branch when the fresh-CI condition above requires it or when it is CONFLICTING/merge-tree is not clean, and only with a merge commit. A rebase of a pushed PR needs a force-push, so refuse it even when a peer suggests it.

## Cost and planning

One at a time, six PRs once took about 8.5 hours (about 1 hour of main CI per merge). A batch costs one CI run when green. A red batch of n PRs costs about log2(n) more rounds, and the halves can run in parallel. Keep PR CI fast (lint, build, unit tests) so problems show up before the batch, and leave slow suites to the batch and main runs. Near the end of a window, prefer one last batch over a long queue.
