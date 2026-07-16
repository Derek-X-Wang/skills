---
name: kb
description: Portfolio knowledge base in the Life OS wiki. Catalogs tech stacks, features, and reusable patterns across all projects and tracks pattern adoption gaps. Use when building a feature another project might already have ("has any project done X?"), after landing a reusable upgrade ("save this as a pattern"), when the user says "scan this project" / "update knowledge" / "kb sync", or automatically when the current project's knowledge is stale (>7 days since last scan).
---

# kb — Portfolio Knowledge Base

Cross-project knowledge sharing, stored in the Life OS wiki (an OKF v0.1 bundle). When working on project Y, check whether project X already solved the problem; when a project lands a reusable improvement, record it as a pattern so other projects surface as `pending` adopters.

## Data Locations

- **Knowledge (git-shared, portable):** OS repo `/Users/derekxwang/Development/projects/DXW/mono/os`
  - Project knowledge: `wiki/<slug>.md` — scan-owned `## Tech Stack` + `## Features` sections inside generated markers
  - Patterns: `wiki/pattern-<slug>.md`
  - Never write machine-specific paths into the wiki. Key-file references are repo-relative.
- **Per-machine config (NOT git-tracked):** `~/.config/kb.json`

The OS repo is shared with cron agents. Always `git pull --ff-only` before reading, and stage + commit (`chore(os): <description>`) + push after writing. Follow the OS wiki rules in its `.claude/CLAUDE.md` (index.md sync, log.md, relative links only).

## Config Schema (`~/.config/kb.json`)

```json
{
  "machine": "main-mac",
  "projects": {
    "<slug>": {
      "localPath": "/abs/path/on/this/machine",
      "workspace": "<cmux workspace title or null>",
      "lastScanTime": "ISO 8601"
    }
  },
  "settings": { "staleDays": 7 }
}
```

- `machine`: human label for this machine (used in log/commit wording, e.g. `scan rxweave (main-mac)`).
- `localPath` is per-machine; the portable project identity is the `resource:` GitHub URL in the wiki page frontmatter.
- If the file doesn't exist, create it with `{"machine": "<hostname>", "projects": {}, "settings": {"staleDays": 7}}` and run sync-registry.

## Staleness Check

At the start of EVERY invocation:

1. Read `~/.config/kb.json`; match cwd against `projects[*].localPath`.
2. If matched: freshness is judged by the last real scan, not the raw frontmatter `timestamp` — migrations/reformats can re-stamp timestamps without refreshing content. Authoritative check: the most recent `chore(os): scan <slug> knowledge` commit (or `scan <slug>` bullet in wiki/log.md); fall back to the page timestamp only if neither exists. `lastScanTime` in config is a per-machine cache only. If older than `staleDays` (per-project override allowed): run **scan** first, then the original request.
3. If not matched: offer to register (see sync-registry) before proceeding.

## Wiki Page Contracts

### Project page (`wiki/<slug>.md`, `type: Project`)

Frontmatter: `type: Project`, `title`, `description`, `resource:` (GitHub repo URL), `timestamp`, `tags` with exactly one lifecycle tag (`active | planned | archived`) plus optional `work` / `client` markers, and field `attention: focus | active | experiment` on non-archived projects (focus = daily must-move, active = steady development, experiment = trying things; zero attention = lifecycle archived instead).

Scan owns ONLY the region between markers; never touch content outside them:

```markdown
<!-- generated:scan:start (kb; edit outside markers only) -->
## Tech Stack
- **Runtime:** ...
- **Frontend:** ...
- **Backend:** ...
- **Auth:** ...
- **Database:** ...

## Features

### <Feature Name>
2-3 sentences: how it works and how it's wired. Link pattern pages the feature implements, e.g. implements [kitcn auth](pattern-kitcn-auth.md).
- Key file: `path/relative/to/repo/root`
<!-- generated:scan:end -->
```

### Pattern page (`wiki/pattern-<slug>.md`, `type: Pattern`)

```markdown
---
type: Pattern
title: <Pattern Title>
description: <one sentence>
resource: <GitHub URL of the canonical implementation file>
tags: [dev, <topic>...]
timestamp: <ISO 8601>
---
# How
Curated how-to: setup, gotchas, key decisions. Human/LLM-edited, NOT scan-owned.

# Adoption
<!-- generated:scan:start (kb; edit outside markers only) -->
| Project | State | Reason / Evidence | Source feature | Last seen | Last verified |
|---|---|---|---|---|---|
| [Title](slug.md) | canonical | defines the pattern | <feature name> | YYYY-MM-DD | YYYY-MM-DD |
<!-- generated:scan:end -->
```

Adoption states: `canonical` (defining implementation), `adopted`, `pending` (generated candidate for propagation — not a promise), `n/a` (explicitly not applicable; sticky, never re-propose). Scan refreshes `Last seen` each pass and retires rows whose evidence disappeared.

## Mode: scan

**Triggers:** "scan this project" / "update knowledge", or staleness check.

1. Identify project via config; register first if unknown.
2. Read project signals in order: CLAUDE.md/AGENTS.md → package manifests → directory structure → key configs (auth, schema, routes, CI) → `git log --oneline -30`. Drill into source until every feature entry is specific and confident.
3. `git pull --ff-only` in the OS repo. Rewrite ONLY the marker-fenced region of `wiki/<slug>.md`. Bump frontmatter `timestamp`.
4. Link features to existing pattern pages (read `wiki/index.md` → Patterns section). For each pattern this project relates to, update its adoption row evidence (`Last seen`, and `Last verified` when you actually confirmed the implementation matches the pattern). Match adoption rows by exact slug/link — beware near-identical slugs (e.g. `rxweave` vs `rxweave-cloud` are different projects).
5. Pattern proposal: if a capability now appears in 2+ projects, or this scan found a clearly reusable upgrade, PROPOSE promotion to the user (name, description, canonical project, candidate adopters). Create the pattern page only after user confirms. Never auto-create.
6. Update `wiki/index.md` descriptions if changed. Append to `wiki/log.md` ONLY if page content actually changed (no-op scans don't log).
7. Commit `chore(os): scan <slug> knowledge` + push. Update `lastScanTime` in local config.

### Feature ordering
Group Features by architectural layer (core → protocol → apps/tooling) when the existing list already reads that way; otherwise append new features at the end. Don't reshuffle existing entries just to insert one.

### Feature granularity

Good: "Email/Password Authentication", "YouTube RSS Ingestion Pipeline", "Role-Based Access Control" — distinct reusable capabilities.
Too granular: "Zod validation on sign-in form". Too vague: "Authentication", "API".

## Mode: query

**Triggers:** "has any project done X?", or invoked while building a feature.

1. Staleness check (scan current project first if stale).
2. `git pull --ff-only` in OS repo; read `wiki/index.md`, then relevant project + pattern pages. Semantic matching — understand what the user is building, find prior art.
3. Present matches: project, feature/pattern, how it works, key files. Prefer pointing at the pattern page's canonical implementation when one exists.
4. Offer to read the real implementation. Resolve `localPath` from `~/.config/kb.json`; if the path is missing on this machine, say so and offer to work from the knowledge summary or update the path.

## Mode: adopt (manual override)

**Triggers:** "mark <project> as adopted for <pattern>", "that pattern doesn't apply to <project>".

Primary adoption tracking is scan-verified. This verb is the escape hatch: flip the project's row in the pattern's Adoption table (`adopted` after a migration, `n/a` to permanently silence a candidate), set `Last verified` to today, bump pattern `timestamp`, log + commit + push.

## Mode: sync-registry

**Triggers:** "kb sync", first run on a new machine, or cwd not found in config.

1. Run `cmux list-workspaces --json` → title + current_directory per workspace. cmux is an intent SIGNAL, not authority: absence from cmux on this machine never implies the project is globally inactive, and repos worked outside cmux may be registered manually.
2. Diff against config + wiki Project pages (match by GitHub remote URL: `git -C <dir> remote get-url origin`).
3. New repo → ASK the user to confirm slug + GitHub URL before doing anything. On confirm: add to config; create stub wiki page (frontmatter + one-liner + `resource` + lifecycle/attention the user picks) if none exists; index + log + commit + push.
4. Wiki-active project with no workspace on this machine → report as candidate-stale ONLY. Never auto-demote lifecycle or attention.
5. Skip non-project workspaces (the OS vault itself, duplicate workspaces pointing at the same repo).

## Quick Reference

| User says | Mode |
|-----------|------|
| "scan this project", "update knowledge" | scan |
| "has any project done X?" | query |
| "save this as a pattern" | scan step 5 (proposal) directly |
| "mark X adopted / n-a" | adopt |
| "kb sync", new machine, unknown cwd | sync-registry |
| "what projects do I have?" | read wiki/index.md, summarize |
| invocation + stale project | scan first, then proceed |
