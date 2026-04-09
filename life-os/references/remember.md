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

- If updating a hot cache: edit the file directly
- If creating/updating a wiki page: edit the file, then update `wiki/index.md` if it's a new page
- If saving to auto-memory: update `~/.claude/projects/.../memory/MEMORY.md`

## Step 3: Log It

If a wiki page was touched, append to `wiki/log.md`:
```
## [YYYY-MM-DD] remember | <brief description>
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
