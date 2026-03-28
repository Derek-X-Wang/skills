---
name: repo-knowledge-share
description: Cross-project knowledge sharing. Catalogs features and tech stacks across repos so you can reuse implementations. Use when building a feature that another project might already have, when the user asks "has any project done X?", or says "scan this project" / "update knowledge". Also triggers automatically on any invocation if the current project's knowledge is stale (>7 days since last scan).
---

# Repo Knowledge Share

Share feature and framework knowledge across projects. When working on project Y, check if project X already solved the same problem — and if so, read the implementation for reference.

## Data Locations

- **Knowledge files (git-tracked):** `<skills-repo>/repo-knowledge-share/knowledge/<project-slug>.md`
  - Skills repo: `/Users/derekxwang/Development/projects/DXW/tools/skills`
  - Remote: `https://github.com/Derek-X-Wang/skills`
- **Local config (device-specific, NOT git-tracked):** `~/.config/repo-knowledge-share.json`

## Local Config Schema

File: `~/.config/repo-knowledge-share.json`

If it doesn't exist, create it with this default structure:

```json
{
  "projects": {},
  "settings": {
    "staleDays": 7
  }
}
```

### Fields

- **projects**: Map of project slug → project config
  - **localPath**: Absolute path to the project root on this machine
  - **lastScanTime**: ISO 8601 timestamp of the last scan
  - **staleDays** (optional): Per-project override for staleness threshold
- **settings.staleDays**: Global default staleness threshold in days (default: 7)

### Example

```json
{
  "projects": {
    "streamerverdict": {
      "localPath": "/Users/derekxwang/Development/incubator/StreamerVerdict/mono",
      "lastScanTime": "2026-03-28T08:00:00Z"
    },
    "life-os": {
      "localPath": "/Users/derekxwang/Development/projects/DXW/mono/os",
      "lastScanTime": "2026-03-25T10:00:00Z",
      "staleDays": 14
    }
  },
  "settings": {
    "staleDays": 7
  }
}
```

## Staleness Check

Run this at the start of EVERY skill invocation (both scan and query modes):

1. Read `~/.config/repo-knowledge-share.json`
2. Match current working directory against `projects[*].localPath`
3. If the project is found, check `lastScanTime`:
   - Calculate staleness using the project's `staleDays` if set, otherwise `settings.staleDays`
   - If stale (older than threshold): run a **scan** before proceeding with the original request
   - If fresh: proceed directly
4. If the project is NOT found: this is a new project — proceed to scan Mode 1 (which will register it)

## Mode 1: Scan (Update Knowledge)

**Triggers:** User says "scan this project" / "update knowledge", or staleness check detects stale/missing project.

### Steps

1. **Identify project** — match `cwd` against `localPath` entries in local config.

2. **Register if new** — if project not found in config:
   - Ask the user for a short slug (lowercase, hyphens only, e.g., "streamerverdict")
   - Ask for the GitHub repo identifier (e.g., "Derek-X-Wang/StreamerVerdict")
   - Save to local config with `localPath` = current working directory

3. **Read project signals** — gather information in this order:
   a. **CLAUDE.md / AGENTS.md** — richest source: architecture, commands, patterns
   b. **Package manifests** — `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml` — for tech stack
   c. **Directory structure** — `ls` top-level + key subdirectories
   d. **Key config files** — auth configs, DB schemas, API routes, CI/CD (e.g., `auth.ts`, `schema.ts`, `tailwind.config.*`)
   e. **Recent git history** — `git log --oneline -30` to catch new features

4. **Drill down when unclear** — if a feature is ambiguous from high-level signals, read the actual source files until the picture is specific and confident. Every feature entry must be clear, not vague.

5. **Write knowledge file** — create/update `<skills-repo>/repo-knowledge-share/knowledge/<project-slug>.md`:

```markdown
---
name: <project-slug>
repo: <owner/repo>
description: <one-line project description>
last_scanned: <YYYY-MM-DD>
---

## Tech Stack
- **Runtime:** ...
- **Frontend:** ...
- **Backend:** ...
- **Auth:** ...
- **Database:** ...
- **Monorepo:** ... (if applicable)
- ... (other relevant stack items)

## Features

### <Feature Name>
<2-3 sentence description of how it works and how it's wired.>
- Key file: `path/relative/to/repo/root`
- Key file: `path/relative/to/repo/root`

### <Another Feature>
...
```

### Feature Granularity Guide

**Good entries** (distinct, reusable capabilities):
- "Email/Password Authentication" — a capability another project might need
- "YouTube RSS Ingestion Pipeline" — a complete subsystem
- "Role-Based Access Control" — a cross-cutting concern

**Too granular** (implementation details):
- "Zod form validation on sign-in" — part of auth, not its own feature
- "TailwindCSS dark mode class" — config detail

**Too vague:**
- "Authentication" — which kind? what provider? be specific
- "API" — every project has APIs; describe what they do

6. **Update local config** — set `lastScanTime` to current ISO 8601 timestamp.

7. **Commit + push knowledge file** in the skills repo:
```bash
cd /Users/derekxwang/Development/projects/DXW/tools/skills
git pull
git add repo-knowledge-share/knowledge/<project-slug>.md
git commit -m "chore(knowledge): scan <project-slug>"
git push
```
If merge conflicts occur, resolve by keeping the newer scan.

## Mode 2: Query (Find Knowledge)

**Triggers:** User invokes the skill while working on a feature, or explicitly asks "has any project done X?"

### Steps

1. **Staleness check** — run the staleness check. If current project is stale, scan first.

2. **Search knowledge files** — read ALL `knowledge/*.md` files from the skills repo. Use semantic understanding to find features/frameworks matching the user's request. This is LLM-driven matching, not keyword search — understand what the user is trying to build and find relevant prior art.

3. **Present matches** — for each match, show:
   - Project name and description
   - Feature name and how it's implemented (from the knowledge file)
   - Key file paths

   Format:
   > **streamerverdict** has **Email/Password Authentication** using Better Auth with `defineAuth()`.
   > Config: `packages/backend/convex/functions/auth.ts` | Client: `apps/web/src/lib/auth-client.ts`

4. **Offer to read** — ask: "Want me to read the implementation from that repo?"

5. **If yes** — resolve `localPath` from local config:
   - **Path exists:** Read the relevant source files and summarize the pattern, adapted for the current project's context and stack.
   - **Path doesn't exist:** Warn the user: "Local path `<path>` not found — the repo may have moved or this is a different machine. Want to update the path, or should I work from the knowledge summary only?"

## Quick Reference

| User says | Mode |
|-----------|------|
| "scan this project", "update knowledge" | Scan |
| "has any project done X?", "check if another repo has Y" | Query |
| "what projects do I have?", "list knowledge" | Read all knowledge/*.md, summarize |
| (skill invoked + project is stale) | Scan first, then proceed |
| (skill invoked + project is unknown) | Register + Scan |
