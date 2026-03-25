# /backlog — Project Backlog Manager

You are the user's backlog manager. Your job is to create or update a project's `BACKLOG.md` — the persistent queue of work items for a project.

## Role of BACKLOG.md

`BACKLOG.md` is the **single source of work items** for a project. It replaces the old per-day `TASK_*.md` files.

- **BACKLOG.md** = "all the work that needs doing" (persistent, not time-bound)
- **Daily notes** = "what I'm doing today" (pulled from backlogs each morning by `/today`)
- **SHORT_TERM_PLAN.md** = "what we're building this period" (milestones and goals, not individual tasks)
- **BLUEPRINT.md** = "what this project is and where it's going" (vision, never tasks)

## Arguments

- `$1` = project path (e.g., `cohorts/2026winter/StreamerVerdict`, `cohorts/2026spring/ContextFS`)
- `$2...` = optional: new items to add, or "triage" to review and prioritize

## Step 1: Gather Context

1. Claude's auto-memory is already loaded.
2. Read existing files in the project directory:
   - `BACKLOG.md` (if exists) — current backlog state
   - `BLUEPRINT.md` (if exists) — for vision and goals
   - `SHORT_TERM_PLAN.md` (if exists) — for current milestones
   - `FEEDBACK.md` (if exists) — for learnings that might generate new items
3. **Inspect the actual codebase** if repo path is known:
   - `git log --oneline -10` — what's been shipped?
   - `git status` — any WIP?
   - Check for TODOs, FIXMEs, or open issues
4. Check recent daily notes for completed items that should be checked off in the backlog

## Step 2: Write or Update BACKLOG.md

Location: `<project-path>/BACKLOG.md`

### BACKLOG.md Template

```markdown
---
type: note
area: project
status: active
updated: YYYY-MM-DD
---

# [Project Name] — Backlog

## Context
- One-liner: what this project is
- Repo: path/to/repo
- Current phase: what milestone we're in (from SHORT_TERM_PLAN.md)

## High Priority
<!-- Items that should be pulled into the next daily plan -->
- [ ] Concrete task with enough detail for an AI agent to execute
  - Include file paths, API endpoints, or specific components when possible
  - Estimate: Xm

## Medium Priority
<!-- Important but not urgent — pull these when high-priority is clear -->
- [ ] Task description (estimate: Xm)

## Low Priority / Ideas
<!-- Good ideas, revisit later -->
- [ ] Task description

## Done (recent)
<!-- Move completed items here with completion date for tracking -->
<!-- Clean out items older than 2 weeks -->
- [x] Completed task (done: YYYY-MM-DD)

## Notes / Blockers
- Any credentials, environment setup, or dependencies needed
- Known issues or constraints
```

### Backlog Rules

- **Items should be concrete and actionable** — "Implement the `/api/keys` endpoint" not "Work on API"
- **Include enough context for a fresh AI agent** — file paths, component names, API routes
- **Priorities are relative within the project** — High means "next up", not "emergency"
- **Check off items that are done** — move them to the Done section with a date
- **Clean the Done section** — remove items older than 2 weeks
- When `/today` pulls items into a daily note, it tags them `(scheduled: YYYY-MM-DD)` in the backlog
- Items stay in the backlog until actually completed (checked off in both daily note and backlog)

## Step 3: Chat Output

```
Backlog updated: <project-path>/BACKLOG.md

Items: X high / Y medium / Z low priority
Recently completed: N items

Top 3 next actions:
1. ...
2. ...
3. ...
```

## Rules

- Do NOT modify BLUEPRINT.md, SHORT_TERM_PLAN.md, or daily notes
- Keep items deduplicated — if an item exists, update it rather than adding a duplicate
- Use the frontmatter convention from SKILL.md
- When adding items from user input, ask for priority if unclear
