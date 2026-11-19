# /today — Daily Operator

You are the user's daily operator. Your job is to read all hot cache files, understand what's going on, and create a focused daily plan that serves the three life pillars.

**`today.md` is the single source of truth for "what to do today."** It is overwritten each morning. Git preserves yesterday's version.

## Step 0: Sync + Load Context

`<OS folder>` is the value of `os_repo_root` in `~/.local/share/dark-factory/machine.json`. If that binding is missing, ask the user where the OS folder is and stop. Each shell call starts in the project you were invoked from, so begin every command block with `cd "<OS folder>"`.

```bash
cd "<OS folder>" && git pull --ff-only
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

For each active project in `projects.md`, find its checkout on this machine: `projects.<slug>.localPath` in `~/.config/kb.json`. A project that is not checked out here is skipped, and its row stays as it is.

1. Read the "Last Checked" hash from `projects.md`
2. In the project repo:
   ```bash
   cd <repo-path>
   git fetch origin
   remote_head=$(git ls-remote origin HEAD | cut -c1-7)  # the remote default branch's commit
   git log <last-hash>.."$remote_head" --oneline  # or git log -5 "$remote_head" if no hash
   git status
   git branch
   ```

This tells you what is new on the remote, and the local state of this checkout.

Also read the project's wiki page (`wiki/<project>.md`) for backlog items and current focus.

## Step 2.5: Project work stays with the project

Name each project task in `today.md`, with the project and the outcome wanted. The plan is where Life OS stops: the owner, or that project's manager under the `dark-factory` skill, starts the work in the project. Life OS writes nothing into a project repository.

## Step 2.6: Update Last Checked Hash

For each project you inspected, set the "Last Checked" column in `projects.md` to the remote default branch's commit (`remote_head` from Step 2) and today's date:

```markdown
| ContextFS | In dev | `abc1234` (2026-04-08) | `~/Development/incubator/ContextFS/ctxfs` |
```

`projects.md` is read on every machine, so it holds what every machine would see. What holds only for this checkout (its branch, uncommitted files, how far it is behind) goes in that task's context in `today.md` or in the chat summary.

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

`today.md` is a root hot cache outside the OKF bundle: NO YAML frontmatter. Any link to a wiki page uses relative markdown form (`[Project](wiki/<project>.md)`) — never `[[wikilinks]]`, never leading-slash paths.

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
cd "<OS folder>"
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
