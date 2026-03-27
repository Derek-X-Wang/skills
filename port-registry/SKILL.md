---
name: port-registry
description: Manages per-project port range assignments so multiple local dev servers never collide. Use this skill whenever starting dev servers, setting up a new project's dev environment, encountering port conflicts (EADDRINUSE), or when the user asks about which ports a project uses. Also use proactively when you notice a project's dev config hardcodes a common port (3000, 3001, 8080) that could conflict with other projects.
---

# Port Registry

When working on multiple projects locally, dev servers compete for the same default ports (3000, 3001, 8080, etc.). This skill manages a central registry at `~/.config/port-registry.json` that assigns each project a dedicated port range.

## Registry Location

`~/.config/port-registry.json`

## Registry Schema

```json
{
  "block_size": 100,
  "next_available": 5200,
  "ranges": [
    {
      "project": "ProjectName",
      "path": "/absolute/path/to/project",
      "start": 5000,
      "end": 5099,
      "assignments": {
        "web": 5001,
        "backend": 5050,
        "cms": 5002
      },
      "notes": "Optional notes about the project's port usage"
    }
  ]
}
```

### Fields

- **block_size**: Ports per project (default: 100). Each project gets `[start, end]` inclusive.
- **next_available**: The start of the next unassigned block.
- **ranges[]**: One entry per project.
  - **project**: Human-readable project name.
  - **path**: Absolute path to the project root. Used to match the current working directory.
  - **start / end**: The reserved range (inclusive).
  - **assignments**: Named port mappings for specific services within the range. These are the ports that should be configured in the project's dev scripts.
  - **notes**: Optional context about the project's port layout.

## Workflow

### 1. Check the Registry

Read `~/.config/port-registry.json`. If it doesn't exist, create it with the default structure (empty ranges, block_size 100, next_available 5000).

### 2. Look Up Current Project

Match the current working directory against `ranges[].path`. A match means the project already has an assigned range.

- **If found**: Report the assigned range and any named assignments. If the user is starting dev servers, remind them which ports to use.
- **If not found**: Assign the next available block. Set `start` to `next_available`, `end` to `start + block_size - 1`, and increment `next_available`. Ask the user for the project name if you can't infer it from the directory.

### 3. Configure Assignments

When you know which services the project runs (web, backend, API, CMS, storybook, etc.), populate the `assignments` map with specific ports within the range. Convention:

- **x001**: Primary web/frontend (e.g., Next.js, Vite)
- **x002**: Secondary web service (e.g., CMS admin, docs site)
- **x050**: Backend / API server
- **x060**: Database or database admin UI
- **x070+**: Additional services

These are conventions, not rules. Adapt to what the project actually needs.

### 4. Update Project Config

After assigning ports, help the user update the project's dev configuration so the assigned ports are actually used. Common patterns:

- **Next.js**: `--port` flag or `PORT` env var in `package.json` scripts
- **Vite**: `server.port` in `vite.config.ts`
- **Convex**: Usually doesn't need a port config (cloud-based)
- **Payload CMS**: `serverURL` in config or `PORT` env var
- **Custom dev scripts**: Look for where ports are hardcoded and update them

Only modify configs if the user asks or agrees. The primary job is to track and advise.

## Commands the User Might Say

| User says | Action |
|-----------|--------|
| "what ports does this project use" | Look up current project in registry |
| "register this project" | Assign a new range to the current project |
| "list all port assignments" | Show the full registry |
| "I'm getting EADDRINUSE" | Check registry for conflicts, suggest resolution |
| "set up ports for a new project" | Assign range + help configure dev scripts |

## Example

User is in `/Users/foo/projects/my-saas` and runs `bun dev` which fails on port 3001.

1. Read registry — no entry for this path
2. Assign range 5200-5299 (next available)
3. Map: web=5201, api=5250, admin=5202
4. Help update `package.json` dev script to use `--port 5201`
5. Save updated registry
