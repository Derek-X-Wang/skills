---
name: team-harness
description: Kick off a Claude Code agent team for feature development or debugging. Uses parallel teammates (engineer, dev-environment watcher, QA tester) that communicate and loop on errors autonomously. Use when the user says "start a team", "team build", "team debug", wants parallel agents that talk to each other, or needs a dev/test/fix loop.
---

# Team Harness

Kick off a Claude Code agent team with specialized teammates that work in parallel and communicate directly. Unlike feat-harness (sequential subagents), team-harness uses agent teams where teammates see errors, fix them, test, and loop — without waiting for a central orchestrator.

## Why Teams Over Subagents

Subagents are fire-and-forget: they do work and report back. They can't talk to each other. If the QA agent finds a bug, it has to report back to you, then you dispatch the engineer again — that's slow.

Agent teams solve this: the QA teammate messages the engineer directly. The dev-environment teammate broadcasts error logs to everyone. The loop tightens from minutes to seconds.

## Pre-flight

Before anything, verify agent teams are enabled:

```bash
# Check if the experimental flag is set
grep -r "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS" ~/.claude/settings.json 2>/dev/null
```

If NOT enabled, tell the user:

> Agent teams are experimental and need to be enabled. Add this to your settings:
> ```json
> // In ~/.claude/settings.json (or project .claude/settings.json)
> {
>   "env": {
>     "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
>   }
> }
> ```
> Or run: `claude settings set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1`

Then STOP until enabled.

## Core Team Roles

Three teammates, each with a distinct responsibility and no file overlap:

### 1. Engineer

The builder. Implements features or fixes bugs. Owns the source code.

**Responsibilities:**
- Read specs/issues and implement changes
- Commit incrementally with descriptive messages
- Respond to error reports from Dev Watcher and bug reports from QA
- Stay in their lane — only modify source code, not test files or dev configs

**When to message others:**
- After completing a change → message QA: "ready to test [description]"
- When stuck on environment issue → message Dev Watcher: "need help with [issue]"

### 2. Dev Watcher

The environment operator. Runs the dev server, watches logs, catches errors early.

**Responsibilities:**
- Start and maintain the dev environment (dev server, build watcher, etc.)
- Monitor stdout/stderr for errors, warnings, build failures
- Broadcast actionable errors to the team immediately
- Restart services when needed after code changes
- Track which errors have been reported and which are resolved

**When to message others:**
- On new error → message Engineer: "build error at [file:line]: [message]"
- On error resolved → broadcast: "error cleared, build passing"
- On environment issue → message Engineer: "need config change for [reason]"

### 3. QA Tester

The quality gate. Tests the feature from the user's perspective using browser or CLI tools.

**Responsibilities:**
- Test features end-to-end after the Engineer signals readiness
- Use browser automation (Playwright MCP) or CLI tools to exercise the feature
- Report bugs with reproduction steps
- Verify bug fixes after the Engineer addresses them
- Test edge cases, error states, and responsive behavior

**When to message others:**
- On bug found → message Engineer: "bug: [description], repro: [steps]"
- On bug verified fixed → message Engineer: "confirmed fixed"
- When environment is broken → message Dev Watcher: "can't access [URL/endpoint]"

## Commands

### `/team setup`

Create subagent definitions for the three team roles, scoped to the current project.

**What to do:**

1. Read the project's README, CLAUDE.md, package.json (or equivalent) to understand:
   - What framework/stack (Next.js, Express, CLI, etc.)
   - How to start the dev server (npm run dev, cargo run, etc.)
   - How to run tests (npm test, pytest, etc.)
   - What browser/testing tools are available

2. Create subagent definition files in `<project>/.claude/agents/`:

**`engineer.md`:**
```markdown
---
name: engineer
description: Feature engineer — implements code changes, responds to error reports and bug reports from teammates
model: sonnet
---

You are the Engineer on a development team. You implement features and fix bugs.

## Project Context
{detected stack, conventions, key directories}

## Your Role
- Implement the assigned feature or fix based on the task description
- When you receive error reports from Dev Watcher, fix them promptly
- When you receive bug reports from QA, fix them and message QA when ready to retest
- Commit incrementally with descriptive messages

## Communication Protocol
- After completing a change, message QA: "Ready to test: [what changed]"
- If you need the dev environment restarted, message Dev Watcher
- If you're blocked, message the lead with what you need
```

**`dev-watcher.md`:**
```markdown
---
name: dev-watcher
description: Dev environment operator — runs dev server, monitors logs, broadcasts errors to the team
model: haiku
---

You are the Dev Watcher. You keep the development environment running and report errors.

## Project Context
{how to start dev server, build commands, log locations}

## Your Role
- Start the dev environment: {detected dev command}
- Watch for build errors, runtime errors, and warnings
- When you see an error, message the Engineer with the error details and file location
- When errors clear after a fix, broadcast to the team that the build is passing
- Restart the dev server if it crashes

## Communication Protocol
- On error: message Engineer with file, line, and error message
- On recovery: broadcast "build passing" to the team
- Keep a mental log of which errors have been reported
```

**`qa-tester.md`:**
```markdown
---
name: qa-tester
description: QA tester — exercises features via browser or CLI, reports bugs with repro steps, verifies fixes
model: sonnet
---

You are the QA Tester. You test features from the user's perspective.

## Project Context
{app URL, testing tools available, key user flows}

## Your Role
- Wait for the Engineer to signal a change is ready to test
- Exercise the feature end-to-end: happy path, edge cases, error states
- Use {browser tool / CLI / curl} to interact with the app
- Report bugs with clear reproduction steps
- After the Engineer fixes a bug, verify the fix

## Communication Protocol
- On bug: message Engineer with description and reproduction steps
- On verified fix: message Engineer "confirmed fixed"
- If the app is down, message Dev Watcher
```

3. Customize each template with the detected project context (fill in the `{...}` placeholders)

4. Tell the user what was created and how to use it

### `/team start <task>`

Kick off a team for feature development or debugging.

**What to do:**

1. Read the subagent definitions from `<project>/.claude/agents/` to confirm they exist. If not, run setup first.

2. Construct the team kickoff prompt based on the task type:

**For feature development:**
```
Create an agent team to build this feature: {task description}

Spawn three teammates:
1. An "engineer" teammate (use the engineer agent type) to implement the feature
2. A "dev-watcher" teammate (use the dev-watcher agent type) to run the dev server and monitor for errors
3. A "qa-tester" teammate (use the qa-tester agent type) to test the feature once implemented

Coordination:
- Dev Watcher starts first — get the dev environment running
- Engineer begins implementation once the environment is ready
- QA Tester starts testing when the Engineer signals readiness
- If QA finds bugs, they message the Engineer directly
- If Dev Watcher sees errors, they message the Engineer directly
- The loop continues until QA confirms all features work and Dev Watcher reports no errors

Task breakdown: {break the feature into 5-6 tasks per teammate}
```

**For debugging:**
```
Create an agent team to debug this issue: {task description}

Spawn three teammates:
1. An "engineer" teammate (use the engineer agent type) to investigate and fix the bug
2. A "dev-watcher" teammate (use the dev-watcher agent type) to run the dev server and capture error output
3. A "qa-tester" teammate (use the qa-tester agent type) to reproduce the bug and verify the fix

Coordination:
- Dev Watcher starts the environment and captures current error state
- QA Tester reproduces the bug and documents exact steps
- Engineer investigates using error output from Dev Watcher and repro steps from QA
- After each fix attempt, QA retests and Dev Watcher confirms no new errors
- Loop until QA confirms the bug is fixed and no regressions found
```

3. Present the prompt to the user and ask them to confirm before proceeding. The user must be in a Claude Code session to execute this — the skill prepares the prompt, the user runs it.

### `/team start review <target>`

Kick off a team for code review (lighter weight, no Dev Watcher needed).

**Prompt template:**
```
Create an agent team to review {target}.

Spawn three teammates:
1. A security reviewer focused on auth, injection, data handling
2. A correctness reviewer focused on logic errors, edge cases, spec compliance
3. A UX/API reviewer focused on developer experience, naming, consistency

Have them each review independently, then share and challenge each other's findings.
Synthesize a final review with severity-ranked issues.
```

## Key Principles

**1. Teammates must own non-overlapping files.**
Two teammates editing the same file causes overwrites. The Engineer owns source code, QA owns test files (if writing tests), Dev Watcher doesn't edit files. Make this explicit in the spawn prompt.

**2. Use Haiku for the Dev Watcher.**
The Dev Watcher's job is simple: run a process, read output, broadcast errors. It doesn't need Opus or Sonnet. Save tokens.

**3. Start with Dev Watcher, then Engineer, then QA.**
The environment must be running before the Engineer starts. QA can't test until there's something to test. Make the task dependencies explicit.

**4. 5-6 tasks per teammate.**
Too few tasks and teammates idle. Too many and context switching hurts. Break the work into appropriately sized chunks.

**5. The lead coordinates, teammates execute.**
Don't do the Engineer's work from the lead session. Tell the lead to wait for teammates to finish before proceeding.

**6. Pre-approve common permissions.**
Teammate permission requests bubble up to the lead, causing friction. Set `--dangerously-skip-permissions` for the team session or pre-approve common operations in permission settings.

## When NOT to Use This

- Simple single-file changes — just do them directly
- Tasks that are inherently sequential with no parallelism opportunity
- When you don't need the dev environment running (pure library code, scripts)
- When token budget is tight — teams use 3-5x more tokens than a single session

Use `/feat-harness` instead when you want structured quality evaluation (graded rubrics, external audit) but don't need parallel communication. Use team-harness when the **communication loop** (see error → fix → test → verify) is the bottleneck.
