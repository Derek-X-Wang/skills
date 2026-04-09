---
name: life-os
description: >
  Use this skill when the user wants to plan their day, track personal goals, manage side projects,
  process captured notes or ideas, or check on life priorities — even if they don't mention "life OS"
  directly. Triggers on /today, /ingest, /lint, /remember, /status, or phrases like "what should I
  work on", "remember this", "save this for later", "what's my focus", "process inbox", "how are my
  goals", "update my projects", "health check the system", or any mention of life pillars (health,
  financial freedom, MoXiang). Works from any project directory.
---

# Life OS

Personal operating system copilot. Manages daily priorities, planning, and reflection across all life areas.

## OS Folder

**Path:** `/Users/derekxwang/Development/projects/DXW/mono/os`

Always use this absolute path, especially when invoked from a different project.

## Git Sync (MANDATORY)

The OS repo is shared with cron agents. **Always sync before reading and after writing:**

```bash
# Before any OS operation
cd /Users/derekxwang/Development/projects/DXW/mono/os && git pull --ff-only

# After edits
git add <changed files> && git commit -m "chore(os): <description>" && git push
```

## Architecture

Three layers — read `.claude/CLAUDE.md` in the OS folder for full schema details.

**Hot cache** (root `*.md`): `today.md`, `goals.md`, `finance.md`, `health.md`, `projects.md`, `study.md`, `career.md`, `family.md`. Snapshot of NOW, 1-2 pages max, links to wiki/ for depth.

**Wiki** (`wiki/*.md`): Accumulated knowledge. Read `wiki/index.md` first. Update it + append to `wiki/log.md` on every change. Binary files go in `wiki/assets/`.

**Inbox** (`inbox/`): Raw drop zone. Processed by `/ingest` — markdown deleted after processing, binaries moved to `wiki/assets/`.

## Life Pillars

Always read `goals.md` for current state. Priority order:
1. **Health** — always include at least one action (walk, weigh-in, meal prep)
2. **Financial Freedom** — ship side projects, revenue potential > perfection
3. **MoXiang** — bonus, fit in when pillars 1-2 are on track

## Operating Procedure

For any update to the OS:

1. `git pull --ff-only`
2. Read `wiki/index.md` to orient
3. Read relevant hot cache + wiki pages
4. Make changes
5. If wiki page touched → update `wiki/index.md` + append to `wiki/log.md`
6. If project wiki page → inspect actual codebase (`git log -5`, `git status` in the project repo)
7. Commit + push

## Command Dispatch

| User says | Command | Load |
|-----------|---------|------|
| `/today`, "what should I do today", "plan my day" | today | `references/today.md` |
| `/ingest`, "process inbox", "file these notes" | ingest | `references/ingest.md` |
| `/lint`, "health check", "check the system" | lint | `references/lint.md` |
| `/remember`, "remember this", "save this" | remember | `references/remember.md` |
| `/status`, "where am I", "recap", "what's my focus" | status | `references/status.md` |

Read the reference file and follow it exactly.

For natural conversation about projects, goals, or life areas — follow the operating procedure above. Common patterns:

| Intent | Action |
|--------|--------|
| New project idea | Create `wiki/<name>.md` + update `projects.md` + index + log |
| Plan next sprint for X | Read `wiki/x.md` + check repo → update "Current Focus" + `projects.md` |
| Log outcome for X | Update `wiki/x.md` outcomes + hot cache + log |
| Add backlog items | Update backlog section of `wiki/<name>.md` + log |

## Gotchas

- **Always git pull first.** Cron agents update `today.md` overnight. If you read stale state, you'll generate a plan that conflicts with what's already there.
- **Don't overwrite today.md mid-day.** If it already exists for today, read it first and carry forward unfinished items. Only overwrite on a fresh `/today` run.
- **Hot cache files are NOT the source of truth for history.** They change constantly. If the user asks "what was my weight last month?" — check `wiki/weight-log.md`, not `health.md`.
- **Project wiki pages can drift from reality.** Always inspect the actual codebase (`git log`, `git status`) before writing tasks or status updates about a project.
- **wiki/index.md is the nav layer.** If you create a wiki page but forget to add it to the index, the next agent won't find it. Always update the index.
- **Binary files from inbox go to `wiki/assets/`, not deleted.** Git history is a poor retrieval mechanism for PDFs and images.
