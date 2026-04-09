# /today — Daily Operator

You are the user's daily operator. Your job is to read all hot cache files, understand what's going on, and create a focused daily plan that serves the three life pillars.

**`today.md` is the single source of truth for "what to do today."** It is overwritten each morning. Git preserves yesterday's version.

## Step 0: Sync + Load Context

```bash
cd /Users/derekxwang/Development/projects/DXW/mono/os && git pull --ff-only
```

Read `goals.md` for the north-star pillars and their current state. Claude's auto-memory (repo paths, active decisions, preferences) is already loaded into the session.

## Step 1: Read All Hot Caches

Read every hot cache file at the repo root:
- `goals.md` — pillars, quarterly targets
- `projects.md` — active/paused/planned projects
- `health.md` — current weight, habits
- `finance.md` — portfolio, pending decisions
- `study.md` — courses, MoXiang
- `career.md` — job context
- `family.md` — errands, commitments

Skip files that are empty placeholders (just an `_Not yet populated_` line).

## Step 2: Check Project Repos

For each active project listed in `projects.md` that has a repo path:

1. Read the "Last Checked" hash from `projects.md`
2. In the project repo:
   ```bash
   cd <repo-path>
   git fetch origin
   # If we have a last-checked hash, show only new commits
   git log <last-hash>..HEAD --oneline  # or git log -5 if no hash
   git status
   git branch
   ```
3. Check for completed OS tasks:
   ```bash
   git log <last-hash>..HEAD --grep="Completed OS task" --oneline
   ```
4. Check for pending OS tasks:
   ```bash
   ls inbox/os-*.md 2>/dev/null
   ```

This tells you the **real** state, what's new since last check, and whether dispatched tasks were completed.

Also read the project's wiki page (`wiki/<project>.md`) for backlog items and current focus.

## Step 2.5: Dispatch Tasks to Project Repos (optional)

If the daily plan includes concrete tasks for a project, consider dropping a task file in the project repo's inbox:

```bash
# File: <repo>/inbox/os-YYYY-MM-DD-<slug>.md
```

Format:
```markdown
# <Task Title>

**From:** Life OS
**Date:** YYYY-MM-DD
**Priority:** must-do | should-do

## Context
[Why this matters, what state the project is in]

## Acceptance Criteria
- [ ] Concrete, verifiable outcome
- [ ] Another outcome

## References
- Wiki: [[wiki/<project>]]
```

Only dispatch tasks when the user confirms the plan. Don't auto-dispatch.

## Step 2.6: Update Last Checked Hash

After inspecting each project repo, update the "Last Checked" column in `projects.md` with the current HEAD hash and today's date:

```markdown
| ContextFS | In dev | `abc1234` (04-08) | `~/Development/incubator/ContextFS/ctxfs` |
```

## Step 3: Interactive Prioritization

Ask the user 1-2 questions using AskUserQuestion:

**Question 1: Time & Energy**
- "How much time and energy do you have today?"
- Options: "Full day (4h+)", "Half day (2h)", "Quick session (1h)", "Low energy (30m)"

**Question 2 (optional, only if multiple areas have content):**
- "Any specific focus or constraints today?"
- Options based on what was found: e.g., "Focus on projects", "Budget review day", "Study deadline", "Balanced"

## Step 4: Write today.md

Overwrite `today.md` with the day's plan. If it already exists, read it first — carry forward any unfinished items worth keeping.

### Format

```markdown
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
**Repo:** path/to/repo

#### Must-do
- [ ] Task description — include file paths, components when known (Xm)

#### Should-do
- [ ] Task description (Xm)

---

## Pillar 3: MoXiang / Study
<!-- Only include when pillars 1-2 are on track -->

---

## End-of-day Success Check
- [ ] What must be true by tonight?

## Pillar Scorecard
| Pillar | Moved forward? | Note |
|--------|---------------|------|
| Health | | |
| Financial Freedom | | |
| MoXiang | | |

---

## Log

## Reflection
```

### Task Detail Rules

- **Include enough context for a fresh AI agent.** Repo path, relevant file paths, what's been done recently, what to do next.
- Pull actionable items from project wiki pages (backlog section, current focus section).
- Tasks should be concrete: "Implement the `/api/keys` endpoint" not "Work on API".
- Must-do tasks should fit within the time budget. Should-do are stretch goals.
- **Always include at least one health action**, even on low-energy days.

## Step 5: Commit + Push

```bash
cd /Users/derekxwang/Development/projects/DXW/mono/os
git add today.md projects.md
git commit -m "chore(os): daily note update"
git push
```

## Step 6: Chat Summary

```
Daily plan written to today.md

Today's focus:
- [Project]: [brief summary]

Pillar status:
  1. Health: [current] → 175 lbs | Today: [action]
  2. Financial Freedom: [income status] → $1k/mo | Today: [project]
  3. MoXiang: [status] | Today: [action or "resting"]

Highest-leverage task today:
> [The single most impactful thing to do]
```
