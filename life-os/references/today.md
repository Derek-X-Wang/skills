# /today — Daily Operator

You are the user's daily operator. Your job is to scan all life areas, understand what's going on, and create a focused daily plan that serves the three life pillars.

**The daily note is the single source of truth for "what to do today."** All actionable todos live here — not in project folders. Project folders hold vision, plans, backlogs, and decisions.

## Step 0: Load Context

**Read `goals/pillars.md`** for the north-star goals and their current state. Claude's auto-memory (repo paths, active decisions, preferences) is already loaded into the session.

Use memory to inform decisions (e.g., skip paused projects, use known repo paths, respect scheduling preferences). Every daily plan should move at least one pillar forward.

## Step 1: Scan All Areas

For each area, gather context by reading relevant files. Only include areas that have content (see SKILL.md area content detection rules).

### Cohorts / Side Projects (Pillar 2: Financial Freedom)

1. Find all cohort directories: `ls cohorts/`
2. For each cohort (e.g., `cohorts/2026winter/`):
   - List project directories
   - Read `BACKLOG.md` if it exists — extract unfinished items (`- [ ] ...`)
   - Read `SHORT_TERM_PLAN.md` if it exists (first 100 lines)
   - Read `BLUEPRINT.md` if it exists (first 50 lines for context)
3. **Check the actual codebase** for each project:
   - Read the project's `README.md` to find the implementation repo path
   - Also check Claude's auto-memory for known repo paths
   - If the repo path exists locally, inspect its current state:
     - `git log --oneline -5` in the repo — what was last worked on?
     - `git status` — any uncommitted work in progress?
     - `git branch` — what branch are we on?
     - Quick scan of key files (package.json, README, etc.) for project status
   - This tells you the **real** state of the project, not just what the planning docs say
4. Summarize: which projects have momentum, which are stalled, which have urgent items
5. **Prioritize projects closest to generating revenue.** Ship > perfect.

### Finance

1. Read `finance/dashboard.md`
2. Find current month budget: `finance/budget/YYYY-MM.md`
3. Check for recent investment decisions: `finance/decisions/`
4. Check portfolio positions: `finance/*/positions.md`
5. Summarize: any budget reviews due, positions to check, decisions pending

### Study (Pillar 3: Chinese Medicine / MoXiang)

1. Read `study/*/dashboard.md` (e.g., `study/acupuncture/dashboard.md`)
2. Check `study/acupuncture/moxiang/` for book project status
3. Check for upcoming course deadlines or assignments
4. Check recent study notes
5. Summarize: what's due, what to study next
6. **Lower priority** — only include study tasks when pillars 1-2 are on track

### Health (Pillar 1: Weight Loss)

1. Read `health/dashboard.md` and `health/weight.md`
2. Check latest weigh-in and trend
3. Look for recent entries or metrics
4. Summarize: current weight, trend direction, what health action to suggest today
5. **Always include a health action** — even on low-energy days (walk, meal prep, weigh-in)

### Goals

1. Check for quarterly/yearly goal files
2. Read current goal progress
3. Summarize: which goals need attention

### Projects

1. Check `projects/_active/` for active side projects
2. Read any status or tracking files
3. Summarize: what's in flight

## Step 2: Interactive Prioritization

After scanning, ask the user 1-2 questions using AskUserQuestion:

**Question 1: Time & Energy**
- "How much time and energy do you have today?"
- Options: "Full day (4h+)", "Half day (2h)", "Quick session (1h)", "Low energy (30m)"

**Question 2 (optional, only if multiple areas have content):**
- "Any specific focus or constraints today?"
- Options based on what was found: e.g., "Focus on projects", "Budget review day", "Study deadline", "Balanced"

## Step 3: Generate Daily Note

Create the daily note file at: `daily/YYYY/MM/DD.md`

- Create intermediate directories if needed (e.g., `daily/2026/03/`)
- If the file already exists, read it first and update rather than overwrite
- **Pull today's tasks from project `BACKLOG.md` files**, the `SHORT_TERM_PLAN.md` weekly milestones, and codebase state. The daily note is where these become concrete, time-boxed todos for today.

### Daily Note Template

```markdown
---
type: log
area: daily
status: active
updated: YYYY-MM-DD
---

# YYYY-MM-DD (Day of Week)

## Today's Focus
- Time budget: Xh | Energy: level
- Theme: [what today is about in one line]

## Pillar 1: Health (Weight: XXX lbs → 175 lbs)
- [ ] Health action for today (Xm)
<!-- Always include at least one: walk, workout, meal prep, weigh-in -->

---

## Pillar 2: Financial Freedom ($X/mo → $1,000/mo)

### [Project Name]
**Context:** Why this project today (1 line)
**Repo:** path/to/repo (so a coding agent can jump straight in)

#### Must-do
- [ ] Task description — include file paths, components, or API routes when known (Xm)

#### Should-do
- [ ] Task description (Xm)

### Finance
- [ ] Task description (Xm)

---

## Pillar 3: MoXiang / Study
<!-- Only include when pillars 1-2 are on track -->
- [ ] Task description (Xm)

---

## End-of-day Success Check
- [ ] What must be true by tonight?

## Pillar Scorecard
<!-- Fill in at end of day -->
| Pillar | Moved forward? | Note |
|--------|---------------|------|
| Health | | |
| Financial Freedom | | |
| MoXiang | | |

---

## Log
<!-- Fill in during/after the day -->

## Reflection
<!-- End of day -->
```

### Task Detail Rules

- **Include enough context for a fresh AI agent.** When a project section references code work, include: repo path, relevant file paths, what's been done recently (from git log), and what to do next. A coding agent should be able to start working from the daily note alone.
- Pull context from `BLUEPRINT.md` (what the project is) and `SHORT_TERM_PLAN.md` (current milestone).
- Pull actionable items from `BACKLOG.md` — select the highest-priority items that fit the time budget.
- **Inspect the actual codebase** before writing tasks:
  - If the repo exists locally, run `git log --oneline -5` and `git status`
  - Reference specific files, functions, or components from the real codebase
- Tasks should be concrete and actionable — "Implement the `/api/keys` endpoint with create and revoke" not "Work on API".
- Must-do tasks should fit within the time budget. Should-do tasks are stretch goals.

### Template Rules

- Only include sections for areas that have content AND are selected for today
- Use `---` horizontal rules between area sections for visual clarity
- Keep tasks concrete with time estimates
- Check yesterday's daily note for unfinished items — carry them forward or drop them with a note

## Step 3.5: Update BACKLOG.md

After generating the daily note, update each project's `BACKLOG.md` to reflect what was selected:
- Items pulled into today's daily note can be marked with a `(scheduled: YYYY-MM-DD)` tag
- This keeps the backlog in sync without removing items prematurely (they get checked off in the daily note when done)

## Step 4: Chat Summary

After writing the file, output a summary:

```
Daily plan written to daily/YYYY/MM/DD.md

Today's project focus:
- [Project]: [brief summary of tasks]

Pillar status:
  1. Health: [current weight] → 175 lbs | Today's action: [what]
  2. Financial Freedom: [income status] → $1k/mo | Today's focus: [project]
  3. MoXiang: [status] | Today: [action or "resting"]

Areas skipped (no content): [list]

Highest-leverage task today:
> [The single most impactful thing to do]
```
