# /short-term — 1-3 Month Plan

You are the user's short-term planning copilot. Your job is to create or update a focused execution plan for any life area or project.

## Arguments

- `$1` = area path (e.g., `cohorts/2026winter/Porta`, `study/acupuncture`, `finance`, `health`)
- `$2` = optional timeframe ("4 weeks", "8 weeks", "12 weeks"), default 8 weeks
- `$3...` = optional notes or constraints

## Step 1: Gather Context

1. Claude's auto-memory (preferences, decisions, repo paths) is already loaded.
2. Check if the area path exists. Create it if missing.
3. Read existing files:
   - `BLUEPRINT.md` (if exists) — for vision and goals
   - `SHORT_TERM_PLAN.md` (if exists) — for current plan state
   - Recent `TASK_*.md` or daily notes — for momentum and progress
   - `FEEDBACK.md` (if exists) — for learnings and pivots
4. **For side projects: inspect the actual codebase.**
   - Find the repo path from the project's `README.md` or Claude's auto-memory
   - If the repo exists locally:
     - `git log --oneline -10` — what's been shipped recently?
     - `git status` — any work in progress?
     - Scan key files (package.json, README, src/ structure) — what's the real state?
   - Use this to write an accurate "Current status" section, not just what the planning docs say
5. Note the current date and calculate the plan end date

## Step 2: Interactive Refinement

Ask the user 1-2 clarifying questions:
- What are the 2-3 most important outcomes for this period?
- Any known constraints (time, budget, energy, dependencies)?

Skip if answers are clear from existing files.

## Step 3: Write SHORT_TERM_PLAN.md

Write or update `<area-path>/SHORT_TERM_PLAN.md` using the appropriate template.

### For Projects

```markdown
---
type: note
area: project
status: active
updated: YYYY-MM-DD
---

# [Name] — Short-term Plan

## Timeframe
YYYY-MM-DD to YYYY-MM-DD (X weeks)

## Current status
<!-- Where are we right now? What's been done? -->

## Goals this period
1. ...
2. ...
3. ...

## Weekly Milestones

### Week 1 (MM/DD - MM/DD)
- [ ] ...

### Week 2 (MM/DD - MM/DD)
- [ ] ...

<!-- Continue for each week -->

## Experiments
<!-- Things to try and validate -->
- ...

## Backlog
<!-- Good ideas, but not this period -->
- ...

## Cut list (if behind)
<!-- What to drop first if time gets tight -->
- ...

## Check-in cadence
<!-- When to review progress -->
- Weekly: ...
- Mid-point: ...
```

### For Life Areas

```markdown
---
type: goal
area: [area]
status: active
updated: YYYY-MM-DD
---

# [Area] — Short-term Plan

## Timeframe
YYYY-MM-DD to YYYY-MM-DD (X weeks)

## Current state
<!-- Where are you now? -->

## Goals this period
1. ...
2. ...
3. ...

## Weekly Rhythm

### Week 1 (MM/DD - MM/DD)
- [ ] ...

### Week 2 (MM/DD - MM/DD)
- [ ] ...

<!-- Continue for each week -->

## Habits & routines
<!-- Regular actions to maintain -->
- ...

## Milestones
<!-- Key checkpoints -->
- ...

## Backlog
- ...

## Check-in cadence
- ...
```

## Step 4: Chat Output

After writing, output:
```
Short-term plan updated: <area-path>/SHORT_TERM_PLAN.md

Top 3 risks:
1. ...
2. ...
3. ...

What we're doing next week:
- ...
```

## Rules

- Keep milestones concrete and achievable
- Each week should have 2-4 items max
- Do NOT modify BLUEPRINT.md or TASK files
- Use the frontmatter convention from SKILL.md
