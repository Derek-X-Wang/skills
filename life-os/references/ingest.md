# /ingest — Process Inbox

Process everything in the `inbox/` folder. Extract key information, file it into the right places, and clean up.

## Step 0: Sync

```bash
cd /Users/derekxwang/Development/projects/DXW/mono/os && git pull --ff-only
```

## Step 1: Scan Inbox

```bash
ls inbox/
```

If `inbox/` is empty (or only contains README.md), report "Inbox is empty — nothing to ingest" and stop.

## Step 2: Read Each File

For each file in `inbox/`:
- **Markdown files (.md):** Read the content
- **Images (.png, .jpg, .gif, .webp):** View the image (Claude can read images)
- **PDFs (.pdf):** Read the PDF
- **Other files:** Note the filename and type, ask the user what to do with it

## Step 3: Discuss Ambiguous Items

If any item is ambiguous (could go to multiple places, or you're not sure what it means), ask the user before filing. Don't guess on important decisions.

## Step 4: File Each Item

For each item, determine where it belongs:

| Content type | Destination |
|---|---|
| Thought about a project | Update `wiki/<project>.md` (backlog, notes, or new section) |
| New project idea | Create `wiki/<project>.md` + update `projects.md` |
| Health note | Update `health.md` and/or `wiki/weight-log.md` |
| Financial info | Update `finance.md` and/or relevant wiki page |
| Study/research material | Update `study.md` and/or `wiki/acupuncture-moxiang.md` |
| Career/job info | Update `career.md` |
| Family/errands | Update `family.md` |
| Article/research | Create a new wiki page or update an existing one |
| General idea/thought | Update the most relevant hot cache or wiki page |
| Life goal or priority | Update `goals.md` |

Follow the operating rules from SKILL.md:
- Update `wiki/index.md` if any wiki page was created or significantly modified
- Append to `wiki/log.md` for each item processed

## Step 5: Clean Up Inbox

After processing:
- **Delete markdown files** from `inbox/` (git preserves them)
- **Move binary files** (PDFs, images, screenshots) to `wiki/assets/` with a descriptive filename

```bash
# Example for a binary file
mv inbox/screenshot-2026-04-07.png wiki/assets/covered-call-chart-2026-04.png

# Example for deleting processed markdown
rm inbox/random-thoughts.md
```

## Step 6: Commit + Push

```bash
cd /Users/derekxwang/Development/projects/DXW/mono/os
git add -A
git commit -m "chore(os): ingest inbox — [brief description of what was processed]"
git push
```

## Step 7: Report

```
Inbox processed:
- [item 1] → filed to [destination]
- [item 2] → filed to [destination]
- ...

Wiki pages created/updated: [list]
Hot caches updated: [list]
Binary files preserved: [list in wiki/assets/]
```
