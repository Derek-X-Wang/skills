# /status — Quick Read

Give the user a brief status report across all life areas.

## Step 0: Sync

`<OS folder>` is the value of `os_repo_root` in `~/.local/share/dark-factory/machine.json`. If that binding is missing, ask the user where the OS folder is and stop. Each shell call starts in the project you were invoked from, so begin every command block with `cd "<OS folder>"`.

```bash
cd "<OS folder>" && git pull --ff-only
```

## Step 1: Read Everything

Read these files:
- `goals.md` — pillar progress
- `today.md` — what was planned, what's done (check for `[x]` vs `[ ]`)
- `projects.md` — active project status
- `health.md` — current metrics
- `finance.md` — current focus
- `study.md` — current focus
- `career.md` — current focus (skip if empty placeholder)
- `family.md` — current focus (skip if empty placeholder)

## Step 2: Output Report

```
Life OS Status
==============

Pillars:
  1. Health: [current weight] → 175 lbs | [trend or habit status]
  2. Financial Freedom: $[X]/mo → $1k/mo | [active project + status]
  3. MoXiang: [status]

Today ([date]):
  Plan: [theme]
  Done: [X/Y tasks completed]
  Remaining: [list unchecked items]

Active Projects:
  - [Project]: [status] | Next: [action]
  - [Project]: [status] | Next: [action]

Needs Attention:
  - [anything stale, blocked, or overdue]
```

Keep it brief. The user wants a glance, not a deep dive. If they want more detail on any area, they'll ask.
