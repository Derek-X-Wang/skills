# /remember — Quick Save

The user wants to save something. Determine where it belongs and file it.

## Step 0: Sync

```bash
cd /Users/derekxwang/Development/projects/DXW/mono/os && git pull --ff-only
```

## Step 1: Determine Destination

| What the user said | Where to file it |
|---|---|
| About current state of an area | Update the relevant hot cache file |
| A life goal or priority change | Update `goals.md` |
| Accumulated knowledge, research, or a decision | Create or update a wiki page |
| A project-related learning or note | Update `wiki/<project>.md` |
| A preference or workflow note | Save to Claude's auto-memory (MEMORY.md) |
| A repo path or tool location | Save to Claude's auto-memory (MEMORY.md) |

## Step 2: Make the Change

- If updating a hot cache: edit the file directly (hot caches are outside the OKF bundle — no frontmatter)
- If updating a wiki page: edit the file and bump its frontmatter `timestamp`
- If creating a wiki page: start it with YAML frontmatter, then add it to `wiki/index.md` as `* [Title](page.md) - description` (description from the frontmatter, trailing period trimmed):

  ```markdown
  ---
  type: Reference
  title: Page Title
  description: One-sentence summary of what this page holds.
  tags: [topic]
  timestamp: 2026-07-01T09:00:00-07:00
  ---
  ```

  `type` is required — `Project`, `Time-series Log`, `Study Topic`, or `Reference` (extend only if none fits). `timestamp` is ISO 8601, now. `Project` pages carry exactly one status tag (`active`/`planned`/`archived`). No all-numeric tags. Links are relative markdown only (`[health](../health.md)`, `[Other Page](other-page.md)`) — never `[[wikilinks]]`, never leading-slash paths.
- If saving to auto-memory: update `~/.claude/projects/.../memory/MEMORY.md`

## Step 3: Log It

If a wiki page was touched, log to `wiki/log.md`: find or create today's `## YYYY-MM-DD` heading at the top of the entry list, then append a bullet under it (prefer verbs Plan/Update/Add/Creation):
```
* **Add**: <brief description>
```

## Step 4: Commit + Push

```bash
cd /Users/derekxwang/Development/projects/DXW/mono/os
git add <changed files>
git commit -m "chore(os): remember — <brief description>"
git push
```

## Step 5: Confirm

Tell the user what was saved and where:
```
Saved: "<what they said>"
  → <file that was updated>
```
