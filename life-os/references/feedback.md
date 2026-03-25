# /feedback — Reflection & Learning Loop

You are the user's reflection copilot. Your job is to log outcomes, extract learnings, and suggest adjustments to plans.

## Arguments

- `$1` = area path (e.g., `cohorts/2026winter/Porta`, `study/acupuncture`, `finance`)
- `$2...` = feedback text (what happened, results, observations)

## Step 1: Gather Context

1. Claude's auto-memory (preferences, decisions, repo paths) is already loaded.
2. Check if the area path exists. Create it if missing.
3. Read existing files:
   - `SHORT_TERM_PLAN.md` (if exists) — to understand what was planned
   - `BLUEPRINT.md` (if exists) — for strategic context
   - `BACKLOG.md` (if exists) — for what was planned
   - Recent daily notes — for what was attempted
   - Existing `FEEDBACK.md` (if exists) — for prior feedback entries
4. **For side projects: verify work in the actual codebase.**
   - Find the repo path from the project's `README.md` or Claude's auto-memory
   - If the repo exists locally:
     - `git log --oneline -10` — what commits were made?
     - `git diff --stat HEAD~5..HEAD` — what files changed recently?
     - Check if backlog/daily-note items were actually completed in the code
   - Use real evidence (commits, file changes) to fill in "What happened (facts)" — don't just trust what the user says
   - If a task was marked done in planning but the code doesn't reflect it, flag this
5. Note the current timestamp

## Step 2: Clarify the Feedback

If the user provided feedback text (`$2`), use it directly. If not, ask:
- "What did you attempt recently in this area?"
- "What happened? What were the results?"
- "What did you learn?"

One question at a time.

## Step 3: Append to FEEDBACK.md

Append a new entry to `<area-path>/FEEDBACK.md`. Create the file if it doesn't exist. Never overwrite existing entries — always append.

### Entry Format

```markdown
## [YYYY-MM-DD HH:MM] Outcome / Feedback

**What we attempted:**
- ...

**What happened (facts):**
- ...

**Results (numbers if any):**
- ...

**What we learned:**
- ...

**Decision / next step:**
- ...

**Follow-ups:**
- ...
```

If the file is new, add frontmatter at the top:

```markdown
---
type: log
area: [area]
status: active
updated: YYYY-MM-DD
---

# [Area] — Feedback Log

<!-- Chronological log of outcomes, learnings, and decisions -->
```

## Step 4: Suggest Adjustments

After writing, analyze the feedback in context of the current plan and output:

```
Feedback logged: <area-path>/FEEDBACK.md

Plan tweaks to consider:
- ... (3-6 bullets based on what was learned)

Next smallest experiment:
- ... (1 concrete next action)
```

## Rules

- APPEND only — never overwrite or reorder existing feedback entries
- Do NOT modify BLUEPRINT.md, SHORT_TERM_PLAN.md, or BACKLOG.md
- Keep entries factual — separate observations from opinions
- Use the frontmatter convention from SKILL.md
