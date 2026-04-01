---
name: agent-harness
description: Set up and run a Planner-Generator-Evaluator agent harness for building features and apps. Use when the user wants to build a feature with structured agent orchestration, set up agent-driven development for a project, create quality evaluation rubrics, or mentions "harness", "planner/generator/evaluator", "agent loop", or "graded evaluation". Also use when the user says "set up harness", "build with agents", or wants structured multi-agent development workflows.
---

# Agent Harness

A lean orchestration pattern for building features and apps using specialized sub-agents. Based on Anthropic's finding that every harness component encodes an assumption about what the model can't do on its own — and those assumptions go stale as models improve.

This skill provides the **foundation**. Each project gets its own tailored agent configs and evaluation criteria because a CLI app and a web app need fundamentally different quality rubrics.

## Architecture

```
You (1-4 sentence prompt)
  │
  ▼
Planner ──► spec file ──► Generator ──► feature code
  ▲                           │
  │                           ▼
  │                       Evaluator ──► scores + feedback
  │                           │              │
  │                           ▼              │
  │                     (loop if below       │
  │                      threshold)          │
  │                                          │
  └──── External Auditor (optional) ◄───────┘
```

**Four agents, three required:**

| Agent | Role | Communicates with |
|-------|------|-------------------|
| **Planner** | Product architect — ambitious scope, user stories, design direction. No technical implementation details. | You (input), Generator (spec file) |
| **Generator** | Lead engineer — full technical autonomy, works feature by feature from spec, integrates with git. | Planner (reads spec), Evaluator (receives feedback) |
| **Evaluator** | QA adversary — graded rubric scoring, skepticism-tuned. Does not approve mediocre work. | Generator (scores + feedback), Auditor (shares scores) |
| **Auditor** | External second opinion — different model/CLI reviews the spec and evaluation. Optional. | Planner (reviews spec), Evaluator (reviews scores) |

**Communication is file-based.** Each agent writes to files that the next agent reads. This creates an audit trail you can review and works with worktree isolation.

## Commands

### `/harness setup`

Bootstrap agent configs and evaluation criteria for the current project.

**What it does:**
1. Detect project type (web app, CLI, API service, mobile, library)
2. Ask you which quality dimensions matter most for this project
3. Read agent templates from `references/agents/`
4. Read criteria templates from `references/criteria/`
5. Generate project-specific configs into `<project>/.claude/harness/`

**Output structure:**
```
<project>/.claude/harness/
  agents/
    planner.md          # Product architect, scoped to this project
    generator.md        # Lead engineer, aware of this stack
    evaluator.md        # QA adversary with project-specific rubrics
    auditor.md          # External reviewer (optional)
  criteria/
    <dimension>.md      # One file per quality dimension
  specs/                # Planner output goes here
  feedback/             # Evaluator scores go here
```

**Setup flow:**

1. Read the project's README, CLAUDE.md, package.json (or equivalent) to understand the tech stack and project type
2. Ask the user: "What kind of project is this?" — confirm detection
3. Ask the user: "Which quality dimensions matter most?" — present relevant options from criteria templates
4. Read each agent template from `references/agents/`
5. Customize templates with project context (stack, conventions, key files)
6. Read selected criteria templates from `references/criteria/`
7. Customize criteria with project-specific weights and examples
8. Write all files to `<project>/.claude/harness/`
9. Add a pointer in the project's CLAUDE.md if one exists

The agent templates in `references/agents/` are foundations — they define the role, communication protocol, and core behaviors. The setup process layers project-specific context on top: what stack is used, what conventions to follow, what files are important.

The criteria templates in `references/criteria/` are starting points — they define scoring dimensions and rubric structures. The setup process selects relevant ones and customizes weights based on what the user says matters.

### `/harness build <feature>`

Run the full Planner-Generator-Evaluator loop for a feature.

**What it does:**
1. Read project harness configs from `<project>/.claude/harness/`
2. Dispatch the **Planner** sub-agent with your feature description
3. Planner writes spec to `<project>/.claude/harness/specs/<feature>.md`
4. **You review the spec** — approve or request changes
5. Dispatch the **Generator** sub-agent (optionally in a worktree)
6. Generator builds the feature, commits work to git
7. Dispatch the **Evaluator** sub-agent
8. Evaluator scores against criteria, writes to `<project>/.claude/harness/feedback/<feature>.md`
9. If any dimension scores below threshold → feed back to Generator for another pass
10. If all dimensions pass → done
11. Optionally dispatch the **Auditor** for an external review

**Dispatch pattern for each agent:**
- Use the `Agent` tool with the agent's config as the prompt foundation
- Pass relevant file paths (spec, code, criteria) as context
- Generator can use `isolation: "worktree"` for safe parallel work

### `/harness audit`

Run the external auditor on the latest spec and evaluation.

**What it does:**
1. Find the most recent spec in `<project>/.claude/harness/specs/`
2. Find the most recent feedback in `<project>/.claude/harness/feedback/`
3. Route to the opposite agent (follows the `counsel` pattern)
4. The auditor reviews the spec for ambiguity, missing edge cases, scope issues
5. The auditor reviews evaluator scores for blind spots or too-lenient grading
6. Results written to `<project>/.claude/harness/feedback/<feature>-audit.md`

The auditor uses the `counsel` skill's principle: tight prompt, file-based handoff, opposite model. If running in Claude Code, route to Codex or Gemini CLI. The key is independence — a different model catches different blind spots.

## Key Principles

These come directly from Anthropic's harness research:

**1. Planning is product-level, not technical.**
The planner defines *what* to build and *why*, using user stories and expected outcomes. It does not prescribe how to implement. Detailed upfront technical specs cause cascading errors when they're wrong — and with capable models, the generator makes better implementation decisions in context.

**2. The evaluator is an adversary, not a rubber stamp.**
Out of the box, models are poor QA agents — they identify issues then talk themselves into approving anyway. The evaluator prompt must be tuned for skepticism. It approaches every review from the premise that bugs exist. It uses graded rubrics, not pass/fail.

**3. Graded evaluation, not binary.**
Each quality dimension gets a 1-5 score with explicit criteria for each level. The generator and evaluator both know the rubric. Any single dimension below threshold (typically 3) fails the sprint. This is what makes the evaluator actually useful — it knows what "good" looks like for your project.

**4. Every component is an assumption about model limitations.**
If the model improves and a harness component is no longer load-bearing, remove it. Sprint contracts, context resets, micro-task sharding — all were useful for less capable models. With Opus 4.6, the spec + single evaluation pass is usually sufficient. Keep stress-testing.

**5. File-based communication creates accountability.**
Specs, feedback, and scores are written to files. This means you can review them, the audit trail persists, and agents don't need to share context windows.

## When NOT to Use This

- Simple, single-file changes — just do them directly
- Bug fixes where the problem and solution are clear
- Tasks that take less than 10 minutes of focused work
- When you want to iterate quickly with direct feedback (brainstorming is better)

The harness adds overhead. It pays off for features that take 30+ minutes, involve multiple files, or have subjective quality requirements.

## Reference Files

Agent templates and criteria templates are in the `references/` directory. Read them during `/harness setup` to understand the foundation before customizing for a project.

- `references/agents/planner.md` — Product architect agent template
- `references/agents/generator.md` — Lead engineer agent template
- `references/agents/evaluator.md` — QA adversary agent template
- `references/agents/auditor.md` — External reviewer agent template
- `references/criteria/web-app.md` — Web application quality rubric
- `references/criteria/cli-app.md` — CLI application quality rubric
- `references/criteria/api-service.md` — API/backend service quality rubric
- `references/criteria/mobile-app.md` — Mobile application quality rubric
