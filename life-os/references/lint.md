# /lint — System Health Check

Run a health check on the Life OS. Find stale content, orphaned pages, missing cross-references, and contradictions.

## Step 0: Sync

```bash
cd /Users/derekxwang/Development/projects/DXW/mono/os && git pull --ff-only
```

## Step 1: Check Hot Cache Staleness

For each hot cache file at the repo root (`goals.md`, `finance.md`, `health.md`, `projects.md`, `study.md`, `career.md`, `family.md`):

```bash
git log -1 --format="%ai" -- <file>
```

Flag any file that hasn't been updated in more than 2 weeks. Empty placeholder files (career.md, family.md) are exempt until they have real content.

## Step 2: Check Wiki Index Consistency

```bash
ls wiki/*.md | grep -v index.md | grep -v log.md
```

Compare the list of wiki files against what's listed in `wiki/index.md`:
- **Orphans:** Files that exist but aren't in the index
- **Dead links:** Index entries pointing to files that don't exist
- **Stale summaries:** One-line descriptions in index that don't match current content (spot-check a few)

## Step 3: Check Cross-References

For each hot cache file, scan for `[[wikilinks]]`. Verify the targets exist:
```bash
grep -o '\[\[wiki/[^]]*\]\]' *.md
```

For wiki pages, check for broken internal links to other wiki pages.

## Step 4: Check for Contradictions

Read `projects.md` and compare project statuses against their wiki pages. Flag any mismatches (e.g., `projects.md` says "active" but `wiki/<project>.md` says "paused").

Read `health.md` current weight and compare against latest entry in `wiki/weight-log.md`.

## Step 5: Suggest Improvements

Look for:
- Important concepts mentioned in multiple places but lacking their own wiki page
- Wiki pages that have grown too large (> 300 lines) and could be split
- Hot cache files that have grown beyond 1-2 pages
- Wiki pages untouched for 3+ months that could be pruned (deleted — git preserves)

## Step 6: Report

```
Life OS Health Check
====================

Hot Caches:
  ✅ goals.md — updated YYYY-MM-DD
  ⚠️ finance.md — last updated YYYY-MM-DD (X weeks ago)
  ...

Wiki Index:
  ✅ All X pages indexed
  ⚠️ Orphan: wiki/foo.md (not in index)
  ⚠️ Dead link: wiki/bar.md (in index but doesn't exist)

Cross-References:
  ✅ All links valid
  ⚠️ Broken: health.md links to [[wiki/foo]] which doesn't exist

Contradictions:
  ⚠️ projects.md says DynaKV is "paused" but wiki/dynakv.md says "active"

Suggestions:
  - Consider creating wiki page for: [topic]
  - wiki/streamerverdict.md is 350 lines — consider splitting
  - wiki/old-thing.md hasn't been touched in 4 months — prune?

Want me to fix any of these?
```

If the user says yes, make the fixes, update index/log, commit and push.
