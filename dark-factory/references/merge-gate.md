# Merge gate

Use this strict integration policy only when selected by the project/run. It does not authorize merges or apply to Bite private review/local-fix processing. The project execution owner (lead) is the only gate. Peers merge their own PRs, but only after the lead's GO.

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

Prepare the notice before the lead asks for it, but send it only after the lead says "#N next". It then goes out minutes after the main run finishes.

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

Reply `GO #<PR>` with the facts you checked, or `HOLD` with the reason.

## Merge (peer)

```bash
gh pr merge "$PR" --merge --match-head-commit "$HEAD_FULL_SHA" \
  --subject "merge #$PR: <title>" --body "<title>"
```

`--match-head-commit` refuses the merge if anyone pushed after the GO.

## IS IN (peer → lead), then lead verification

```bash
git fetch -q origin main
git log -1 --format='%h %s%n%P' origin/main          # parents = old main + approved head
git merge-base --is-ancestor "$HEAD_FULL_SHA" origin/main && echo ANCESTOR-OK
```

Then start the main watcher. The next notice is requested only when the watcher says DONE.

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

## Why the spacing rule exists

A new push to main can cancel the previous main run (concurrency groups). If merges come faster than the slowest workflow, some commits never finish CI, and a red result can no longer be tied to one change. Wait for all workflows, slow lanes included, before the next merge.

## Fresh-CI policy

- Same-package changes on main since the CI base, or overlapping files with interacting hunks → fresh CI (`gh pr update-branch`, a merge commit, never a force-push).
- Only BEHIND, merge-tree clean, overlap reviewed as independent → no fresh CI.
- Name exceptions before the run starts (for example a toolchain bump).
- Refresh a branch when the fresh-CI condition above requires it or when it is CONFLICTING/merge-tree is not clean, and only with a merge commit. A rebase of a pushed PR needs a force-push, so refuse it even when a peer suggests it.

## Cost of one-at-a-time

With about 1 hour of main CI per merge, six PRs took about 8.5 hours. Plan for it: start long merge lines early, and keep the queue short near the end of the window. Do not merge PRs in pairs, even when they share no package (owner decision 2026-11-02): when main goes red, the cause must map to exactly one change.
