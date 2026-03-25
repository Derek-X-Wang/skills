---
name: dx-harness
description: Guide projects to create an internal CLI tool ("dx") that streamlines development workflows for both humans and AI agents. Use when starting a new project, setting up a monorepo, adding internal tooling, creating developer scripts, or when someone asks about project CLIs, developer experience tools, or "dx" packages. Also use when creating a project-level "dx" skill that documents the CLI for AI consumption.
---

# DX Harness

Every project benefits from an internal CLI that wraps common workflows into repeatable, discoverable commands. This skill guides two things:

1. **Building the dx package** — an internal CLI tool that lives in the repo
2. **Creating the dx skill** — a project-level AI skill that documents the CLI so agents can use it effectively

The dx harness serves both humans (tab completion, help text, consistent interface) and AI agents (structured commands that replace fragile multi-step shell invocations). When an agent can run `bun dx test convex` instead of figuring out the right combination of flags, working directories, and environment variables, reliability goes up dramatically.

## Part 1: The DX Package

### What It Is

A CLI tool that lives inside the project repository, typically at `apps/dx/` or `tools/dx/` or `cmd/dx/` depending on language conventions. It wraps internal workflows — dev servers, testing, database operations, deployment, data pipelines — into a single entry point.

The name "dx" stands for developer experience. Some projects alias it to a project abbreviation too (e.g., `bun sv` for StreamerVerdict). The key idea: one command to rule them all.

### When to Create One

Create a dx package when:
- The project has 3+ distinct workflows (dev, test, deploy, seed, migrate, etc.)
- Commands require specific flags, environment setup, or working directory context
- Multiple team members (human or AI) need to run the same operations reliably
- You find yourself documenting shell commands in README that get stale

### Architecture Principles

**1. Thin wrapper, not reimplementation**

The dx CLI delegates to existing tools — it does not replace them. Each command is a thin orchestration layer:

```
dx dev       → starts turbo/docker/process manager
dx test      → runs the right test runner with right config
dx seed      → calls database seeding function
dx deploy    → runs deployment pipeline
```

The value is in knowing which tool to call, with which flags, in which directory, with which env vars — and encoding that knowledge once.

**2. Command hierarchy maps to domains**

Organize commands by what they operate on, not how they work:

```
dx dev [web|backend|all]        # Development servers
dx test [unit|e2e|eval]         # Testing
dx db [seed|migrate|reset]      # Database operations
dx ingest [poll|process|status] # Data pipeline (if applicable)
dx deploy [staging|prod]        # Deployment
dx status                       # Project health overview
```

Each top-level command is a domain. Subcommands are operations within that domain. This maps well to both human mental models and AI tool selection.

**3. AI-friendly output**

Commands should produce output that AI agents can parse and act on:
- Use JSON output for data commands (list, status, query) — add a `--json` flag or make it the default for programmatic commands
- Use clear, structured text for human-facing commands (dev, test)
- Return meaningful exit codes (0 success, 1 error, 2 user error)
- Write status messages to stderr, data to stdout — so piping works

**4. Self-documenting**

Every command has help text. Running `dx` with no args shows available commands. Running `dx <command> --help` shows usage. The CLI itself is the documentation — it never goes stale because it IS the tool.

### Language-Specific Patterns

#### TypeScript / Bun / Node

```
apps/dx/
├── package.json         # commander + consola + dotenv
├── src/
│   ├── index.ts         # Entry: load env, register commands, parse
│   ├── commands/
│   │   ├── dev.ts       # registerDevCommand(program)
│   │   ├── test.ts      # registerTestCommand(program)
│   │   ├── db.ts        # registerDbCommand(program)
│   │   └── ...
│   └── utils/
│       └── exec.ts      # Helpers: exec(), turbo(), bunRun()
└── tsconfig.json
```

**Recommended deps:** `commander` (CLI framework), `consola` (pretty logging), `dotenv` (env loading)

**Monorepo integration:** Add aliases in root `package.json`:
```json
{
  "scripts": {
    "dx": "bun apps/dx/src/index.ts"
  }
}
```

**Command registration pattern:**
```typescript
// commands/dev.ts
import { Command } from "commander";
import { exec } from "../utils/exec";

export function registerDevCommand(program: Command) {
  const dev = program.command("dev").description("Start development servers");
  dev.command("web").description("Web app only").action(async () => {
    await exec("turbo", ["dev", "--filter=web"]);
  });
  dev.command("all").description("All services").action(async () => {
    await exec("turbo", ["dev"]);
  });
  dev.action(async () => {
    // Default: start everything
    await exec("turbo", ["dev"]);
  });
}
```

**Execution helpers pattern:**
```typescript
// utils/exec.ts
import { spawn } from "child_process";

export function exec(cmd: string, args: string[], opts?: { cwd?: string }) {
  return new Promise<number>((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: "inherit",
      cwd: opts?.cwd ?? process.cwd(),
    });
    proc.on("close", (code) => resolve(code ?? 1));
    proc.on("error", reject);
  });
}
```

#### Rust

```
tools/dx/
├── Cargo.toml           # clap + anyhow + serde_json
└── src/
    ├── main.rs          # Entry: parse args, dispatch
    ├── commands/
    │   ├── mod.rs
    │   ├── dev.rs
    │   ├── test.rs
    │   └── db.rs
    └── utils/
        └── exec.rs      # Command::new() wrappers
```

**Recommended deps:** `clap` (derive macro), `anyhow`, `serde_json`, `colored`

**Monorepo integration:** Build the binary and alias it:
```toml
# Cargo.toml
[[bin]]
name = "dx"
path = "src/main.rs"
```

#### Go

```
cmd/dx/
├── main.go              # Entry: cobra root command
├── commands/
│   ├── dev.go
│   ├── test.go
│   └── db.go
└── internal/
    └── exec/
        └── run.go       # os/exec wrappers
```

**Recommended deps:** `cobra` (CLI framework), `viper` (config)

#### Python

```
tools/dx/
├── pyproject.toml       # click + rich
├── dx/
│   ├── __init__.py
│   ├── cli.py           # @click.group() entry
│   ├── commands/
│   │   ├── dev.py
│   │   ├── test.py
│   │   └── db.py
│   └── utils/
│       └── exec.py      # subprocess wrappers
```

**Recommended deps:** `click` (CLI framework), `rich` (pretty output)

### Essential Commands

Every dx CLI should have these baseline commands:

| Command | Purpose | Why it matters for AI |
|---------|---------|----------------------|
| `dx dev` | Start dev environment | Agent can verify changes in running app |
| `dx test` | Run tests | Agent validates work after implementation |
| `dx status` | Project health/state | Agent understands current state before acting |
| `dx db seed` | Seed dev database | Agent can reset to known state |

Beyond the baseline, add commands for your project's specific workflows — data pipelines, deployment, content management, API testing, etc. The rule of thumb: if you've explained a workflow to someone (human or AI) more than twice, it belongs in dx.

### Design Checklist

When building or reviewing a dx package:

- [ ] Every command has a description and `--help` text
- [ ] Commands that produce data support JSON output
- [ ] Environment variables are loaded automatically (no manual sourcing)
- [ ] Commands work from the monorepo root (resolve paths internally)
- [ ] Errors show actionable messages ("Run `dx db seed` first" not just "Error: no data")
- [ ] Long-running commands show progress feedback
- [ ] Commands are idempotent where possible (safe to retry)

---

## Part 2: The DX Skill

Once the dx package exists, create a **project-level skill** so AI agents know how to use it. This skill lives in the project repo (not in a global skills directory) and gets referenced from the project's CLAUDE.md or similar AI config.

### Why a Separate Skill

CLAUDE.md should contain high-level project context — architecture, conventions, key decisions. The dx skill contains operational knowledge — what commands to run, in what order, with what arguments. Separating them keeps both focused and prevents CLAUDE.md from becoming an unreadable wall of text.

### Where to Put It

Create a project-level skill. The exact location depends on your AI tool setup:

```
# Option A: In the project's .claude/skills/ directory
.claude/skills/dx/SKILL.md

# Option B: In the dx package itself
apps/dx/SKILL.md
```

### What to Include

The dx skill should contain:

1. **Command reference** — every command with description, common flags, and examples
2. **Workflow recipes** — multi-command sequences for common tasks (e.g., "add a new feature", "debug a pipeline failure")
3. **When to use what** — decision guidance so the agent picks the right command

### Template

```markdown
---
name: dx
description: Internal CLI commands and workflows for [project name]. Use when
  running dev servers, tests, database operations, or any project-specific
  workflow. Reference this before running shell commands — dx likely has a
  command for it.
---

# [Project] DX Commands

## Quick Reference

| Command | Purpose |
|---------|---------|
| `dx dev` | Start development servers |
| `dx test` | Run tests |
| ... | ... |

## Commands

### dx dev
Start development servers.
- `dx dev` — all services
- `dx dev web` — frontend only
- `dx dev backend` — backend only

### dx test
Run tests.
- `dx test` — all tests
- `dx test unit` — unit tests only
- `dx test e2e` — end-to-end tests

[... continue for each command ...]

## Workflows

### Adding a new feature
1. `dx dev` — start servers
2. Write tests first
3. `dx test` — verify tests fail
4. Implement feature
5. `dx test` — verify tests pass

### Debugging a pipeline failure
1. `dx status` — check current state
2. `dx pipeline run --dry-run` — identify stuck step
3. Fix the issue
4. `dx pipeline run` — retry

## Tips
- Always run `dx status` before starting work to understand current state
- Prefer `dx test` over raw test runner — it sets up env correctly
- Use `--json` flag when you need to parse output programmatically
```

### Referencing from CLAUDE.md

Add a pointer in CLAUDE.md so the agent knows the skill exists:

```markdown
## DX CLI
This project uses an internal CLI. See the `dx` skill for full command
reference and workflows. Prefer `dx` commands over raw shell commands.
```

---

## When to Evolve the DX Package

Add new dx commands when:
- A workflow gets documented in a PR, README, or chat message — capture it as a command instead
- An AI agent repeatedly constructs the same multi-step shell sequence — wrap it
- A new team member (human or AI) asks "how do I...?" for the third time
- You add a new service, pipeline, or integration that has its own operational surface

Remove or refactor commands when:
- A command hasn't been used in months
- The underlying tool it wraps has changed its interface
- Two commands overlap significantly — merge them

The dx package is a living artifact. It grows with the project and reflects the team's actual workflows, not aspirational ones.
