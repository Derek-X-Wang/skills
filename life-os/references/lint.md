# /lint — System Health Check

Run a health check on the Life OS. Find OKF violations, stale content, orphaned pages, broken links, and contradictions.

`wiki/` is an OKF v0.1 bundle; root hot caches are outside it (no frontmatter). `wiki/index.md` and `wiki/log.md` are reserved files.

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

## Step 2: Check for Wikilinks (violation)

All links repo-wide are standard relative markdown. Any `[[wikilink]]` in a content file is a violation:

```bash
grep -n '\[\[' *.md wiki/*.md inbox/*.md 2>/dev/null
```

## Step 3: Check Wiki Frontmatter

Every non-reserved `wiki/*.md` (everything except `index.md` and `log.md`) must start with YAML frontmatter containing a non-empty `type`:

```bash
for f in wiki/*.md; do
  case "$f" in wiki/index.md|wiki/log.md) continue;; esac
  head -1 "$f" | grep -q '^---$' || echo "MISSING FRONTMATTER: $f"
  sed -n '2,/^---$/p' "$f" | grep -q '^type: *[^ ]' || echo "MISSING type: $f"
done
```

Also verify per page:
- **Project status tag:** every `type: Project` page has exactly one of `active`, `planned`, `archived` in its tags — zero or multiple is a violation
- **No all-numeric tags:** every tag needs at least one non-numeric character (e.g. `2026` is a violation)

## Step 4: Check Reserved Files

**wiki/log.md** — allow the H1 and one intro prose line before the first heading, then:
- Every heading matches `^## \d{4}-\d{2}-\d{2}$` (no brackets, no extra text)
- Headings are ordered newest-first, no duplicate dates
- Entries under each heading are `* **Verb**: <summary>` bullets

**wiki/index.md** — frontmatter contains only `okf_version: "0.1"`; entries match `* [Title](page.md) - description`:
- **Orphans:** every non-reserved wiki page must be listed
- **Dead links:** no entry may point to a missing file
- **Description drift:** each entry's description must match the page's frontmatter `description` verbatim (trailing period trimmed)

## Step 5: Check Links

For every relative markdown link in root `*.md` and `wiki/*.md`, verify the target resolves from the linking file's directory (from root: `wiki/x.md`, `projects.md`; from wiki pages: `../health.md`, `other-page.md`). Flag targets that don't exist.

Leading-slash links are violations regardless of whether they appear to resolve:

```bash
grep -n '](/' *.md wiki/*.md 2>/dev/null
```

## Step 6: Check Wiki Timestamp Staleness

For each non-reserved wiki page, compare the frontmatter `timestamp` against the last commit that touched the file:

```bash
git log -1 --format=%cI -- wiki/<page>.md
```

If the last commit is meaningfully newer than the recorded `timestamp`, the page was changed without bumping `timestamp` — flag it.

## Step 7: Check for Contradictions

Read `projects.md` and compare project statuses against their wiki pages. Flag any mismatches (e.g., `projects.md` says "active" but `wiki/<project>.md` says "paused" — or carries the `archived` status tag).

Read `health.md` current weight and compare against latest entry in `wiki/weight-log.md`.

## Step 8: Suggest Improvements

Look for:
- Important concepts mentioned in multiple places but lacking their own wiki page
- Wiki pages that have grown too large (> 300 lines) and could be split
- Hot cache files that have grown beyond 1-2 pages
- Wiki pages untouched for 3+ months that could be pruned (deleted — git preserves)

## Step 9: Report

```
Life OS Health Check
====================

Hot Caches:
  ✅ goals.md — updated YYYY-MM-DD
  ⚠️ finance.md — last updated YYYY-MM-DD (X weeks ago)
  ...

Wikilinks:
  ✅ No [[wikilinks]] found
  ⚠️ health.md:12 — [[wiki/foo]] (convert to relative markdown link)

Frontmatter:
  ✅ All X wiki pages have typed frontmatter
  ⚠️ wiki/foo.md — missing frontmatter / empty `type`
  ⚠️ wiki/bar.md — Project page with 0 (or 2+) status tags
  ⚠️ wiki/baz.md — all-numeric tag: 2026

Reserved Files:
  ✅ log.md format OK | index.md format OK
  ⚠️ log.md — heading "## [2026-07-01] plan | x" doesn't match ## YYYY-MM-DD
  ⚠️ index.md — orphan: wiki/foo.md not listed
  ⚠️ index.md — dead link: wiki/bar.md doesn't exist
  ⚠️ index.md — description drift: wiki/baz.md

Links:
  ✅ All relative links resolve
  ⚠️ wiki/foo.md:8 — target ../gaols.md doesn't exist
  ⚠️ study.md:3 — leading-slash link: (/wiki/x.md)

Timestamp Staleness:
  ⚠️ wiki/foo.md — committed YYYY-MM-DD but frontmatter timestamp is YYYY-MM-DD (bump it)

Contradictions:
  ⚠️ projects.md says DynaKV is "paused" but wiki/dynakv.md says "active"

Suggestions:
  - Consider creating wiki page for: [topic]
  - wiki/streamerverdict.md is 350 lines — consider splitting
  - wiki/old-thing.md hasn't been touched in 4 months — prune?

Want me to fix any of these?
```

If the user says yes, make the fixes, update index/log, commit and push.
