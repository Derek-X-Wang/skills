---
name: kb
description: Look up project features and reusable patterns in the Life OS portfolio wiki, or update knowledge when the user requests a scan, pattern, adoption change, or kb sync. Lookups are read-only and report stale evidence.
---

# kb — Portfolio Knowledge Base

Cross-project knowledge sharing, stored in the Life OS wiki (an OKF v0.1 bundle). When working on project Y, check whether project X already solved the problem; when a project lands a reusable improvement, record it as a pattern so other projects surface as `pending` adopters.

## Data Locations

- **Knowledge (git-shared, portable):** OS repo `/Users/derekxwang/Development/projects/DXW/mono/os`
  - Project knowledge: `wiki/<slug>.md` — scan-owned `## Tech Stack` + `## Features` sections inside generated markers
  - Patterns: `wiki/pattern-<slug>.md`
  - Never write machine-specific paths into the wiki. Key-file references are repo-relative.
- **Per-machine config (NOT git-tracked):** `~/.config/kb.json`

The OS repo is shared with cron agents. Lookups use existing local knowledge without pulling, scanning, creating config, committing, or pushing. Report missing or stale evidence. Refresh, write, and publish only when requested or already authorized. For an authorized update, inspect the worktree, `git pull --ff-only` before writing, and stage only the intended wiki changes; commit (`chore(os): <description>`) and push when publishing is authorized. Follow the OS wiki rules in its `.claude/CLAUDE.md` (index.md sync, log.md, relative links only). Load `git-project-memory` before inspecting project history or creating commits. KB work does not require reinstalling Life OS or other skills.

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
- If the file does not exist during a lookup, continue from available wiki pages and report unavailable local-path/freshness data. Create it with `{"machine": "<hostname>", "projects": {}, "settings": {"staleDays": 7}}` only for an authorized registry/config setup.

## Staleness Check

For the relevant project, check available freshness evidence:

1. Read `~/.config/kb.json`; match cwd against `projects[*].localPath`.
2. Freshness is judged by the last real scan, not the raw frontmatter `timestamp` — migrations/reformats can re-stamp it. Prefer a `scan <slug>` entry in wiki/log.md or, when history inspection is needed, the most recent `chore(os): scan <slug> knowledge` commit. Fall back to the page timestamp with that limitation; `lastScanTime` is only a per-machine cache. If older than `staleDays` (per-project override allowed), report staleness with the answer. Run **scan** only when requested or already authorized.
3. An unmatched cwd or missing config does not block a wiki lookup or trigger registration. Report the missing mapping when relevant.

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

**Triggers:** "scan this project" / "update knowledge", or an already authorized refresh.

1. Identify project via config; register first if unknown.
2. Read project signals in order: CLAUDE.md/AGENTS.md → package manifests → directory structure → key configs (auth, schema, routes, CI) → `git log --oneline -30`. Drill into source until every feature entry is specific and confident.
3. `git pull --ff-only` in the OS repo. Rewrite ONLY the marker-fenced region of `wiki/<slug>.md`. Bump frontmatter `timestamp`.
4. Link features to existing pattern pages (read `wiki/index.md` → Patterns section). For each pattern this project relates to, update its adoption row evidence (`Last seen`, and `Last verified` when you actually confirmed the implementation matches the pattern). Match adoption rows by exact slug/link — beware near-identical slugs (e.g. `rxweave` vs `rxweave-cloud` are different projects).
5. Pattern proposal: if a capability now appears in 2+ projects, or this scan found a clearly reusable upgrade, PROPOSE promotion to the user (name, description, canonical project, candidate adopters). Create the pattern page only after user confirms. Never auto-create.
6. Update `wiki/index.md` descriptions if changed. Append to `wiki/log.md` ONLY if page content actually changed (no-op scans don't log).
7. When publishing is authorized, commit `chore(os): scan <slug> knowledge` + push. Update `lastScanTime` in local config for the completed scan; report any unpublished changes.

### Feature ordering
Group Features by architectural layer (core → protocol → apps/tooling) when the existing list already reads that way; otherwise append new features at the end. Don't reshuffle existing entries just to insert one.

### Feature granularity

Good: "Email/Password Authentication", "YouTube RSS Ingestion Pipeline", "Role-Based Access Control" — distinct reusable capabilities.
Too granular: "Zod validation on sign-in form". Too vague: "Authentication", "API".

## Mode: query

**Triggers:** "has any project done X?", or invoked while building a feature.

1. Check available freshness evidence; keep stale or unknown freshness visible in the answer.
2. Read local `wiki/index.md`, then relevant project + pattern pages. Semantic matching — understand what the user is building, find prior art. Do not pull or scan as part of the lookup.
3. Present matches: project, feature/pattern, how it works, key files. Prefer pointing at the pattern page's canonical implementation when one exists.
4. Offer to read the real implementation. Resolve `localPath` from `~/.config/kb.json`; if the path is missing on this machine, say so and offer to work from the knowledge summary or update the path.

## Mode: adopt (manual override)

**Triggers:** "mark <project> as adopted for <pattern>", "that pattern doesn't apply to <project>".

Primary adoption tracking is scan-verified. This verb is the escape hatch: flip the project's row in the pattern's Adoption table (`adopted` after a migration, `n/a` to permanently silence a candidate), set `Last verified` to today, bump pattern `timestamp`, and log. Commit + push when publishing is authorized.

## Mode: sync-registry

**Triggers:** "kb sync" or an authorized registry setup/update.

1. Run `cmux list-workspaces --json` → title + current_directory per workspace. cmux is an intent SIGNAL, not authority: absence from cmux on this machine never implies the project is globally inactive, and repos worked outside cmux may be registered manually.
2. Diff against config + wiki Project pages (match by GitHub remote URL: `git -C <dir> remote get-url origin`).
3. New repo → confirm slug + GitHub URL unless already provided or approved. Add to config; create stub wiki page (frontmatter + one-liner + `resource` + approved lifecycle/attention) if none exists; update index + log, then commit + push when publishing is authorized.
4. Wiki-active project with no workspace on this machine → report as candidate-stale ONLY. Never auto-demote lifecycle or attention.
5. Skip non-project workspaces (the OS vault itself, duplicate workspaces pointing at the same repo).

## Quick Reference

| User says | Mode |
|-----------|------|
| "scan this project", "update knowledge" | scan |
| "has any project done X?" | query |
| "save this as a pattern" | scan step 5 (proposal) directly |
| "mark X adopted / n-a" | adopt |
| "kb sync", authorized registry setup | sync-registry |
| "what projects do I have?" | read wiki/index.md, summarize |
| lookup + stale project | answer with staleness; refresh only when authorized |
