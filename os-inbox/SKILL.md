---
name: os-inbox
description: >
  Use this skill when starting work in a project repo to check for tasks dispatched from the Life OS
  command center. Triggers on startup, "check inbox", "any tasks from OS", or when the agent notices
  an inbox/ folder with os-*.md files. Also use when completing a task that came from the OS inbox
  to ensure the completion is recorded properly in the git commit message.
---

# OS Inbox

Check for and execute tasks dispatched from the Life OS command center (`/Users/derekxwang/Development/projects/DXW/mono/os`).

## How It Works

The Life OS drops task files in this project's `inbox/` folder (format: `inbox/os-YYYY-MM-DD-<slug>.md`). This skill checks for those tasks, presents them, and records completion in git commit messages so the OS can confirm.

## On Startup: Check for Pending Tasks

Always check both local and remote for inbox tasks — local may be stale:

```bash
# Fetch latest from remote
git fetch origin

# Check remote for inbox tasks (works even if local is behind)
git ls-tree origin/main inbox/ 2>/dev/null | grep "os-"

# Check local inbox too
ls inbox/os-*.md 2>/dev/null
```

If remote has inbox files that local doesn't, pull first:
```bash
git pull --ff-only
```

### If tasks are found

1. Read each `os-*.md` file
2. Present to the user: "You have X task(s) from Life OS:"
   - Show title, priority, and acceptance criteria for each
3. Ask: "Want to work on these now?"

### If no tasks

Report briefly: "No pending OS tasks." and continue with whatever the user asked for.

## Executing a Task

When working on an OS-dispatched task:

1. Follow the acceptance criteria in the task file
2. Work normally — commit as you go with descriptive messages
3. On the **final commit** that completes the task, include this line in the commit body:

```
Completed OS task: os-YYYY-MM-DD-<slug>.md
```

Example:
```bash
git commit -m "$(cat <<'EOF'
feat: add share metadata to game pages

Added generateMetadata() with openGraph, twitter, and canonical
URL fields. Tested with 3 real game URLs.

Completed OS task: os-2026-04-08-share-metadata.md
EOF
)"
```

4. Delete the inbox file and commit the deletion:
```bash
rm inbox/os-YYYY-MM-DD-<slug>.md
git add inbox/
git commit -m "chore: clear completed OS inbox task"
git push
```

## Gotchas

- **Always fetch remote before checking inbox.** The OS may have pushed a task after you last pulled. `git fetch origin` + check `origin/main` catches this.
- **The "Completed OS task:" line in the commit message is the confirmation signal.** The Life OS reads `git log --grep="Completed OS task"` to confirm completion. Don't skip it or change the format.
- **Delete the inbox file after completion.** A clean inbox = all tasks done. The OS checks `ls inbox/os-*.md` to see pending work.
- **Don't modify OS task files.** They're instructions, not editable docs. If a task is unclear, ask the user — don't edit the file.
- **Multiple tasks are fine.** If there are several `os-*.md` files, present them all and let the user prioritize.
