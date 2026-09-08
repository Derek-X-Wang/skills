---
name: manage-my-skills
description: Create, edit, validate, publish, install, and remove personal agent skills from Derek-X-Wang/skills. Use as the single entrypoint for managing Derek's skills; delegate authoring guidance to the current harness-maintained creator when available.
---

# Manage My Skills

Own the requested skill lifecycle from source edits through validation and authorized publication/installation.

## Ownership and source

- Local repo: `/Users/derekxwang/Development/projects/DXW/tools/skills`
- Remote: `https://github.com/Derek-X-Wang/skills`
- Each discoverable skill is a root-level directory containing `SKILL.md`.
- Verify the exact source and installation target before editing or removing anything. Skills sourced outside `Derek-X-Wang/skills` are keep/delete-only: do not edit, fork, or silently migrate them into this repo. Delete only when explicitly authorized. Preserve attribution and licenses for existing owned copies with third-party origins.
- Preserve user changes. If the repo is missing, clone it for an authorized management task. Inspect status and use `git pull --ff-only` before source edits when safe; do not overwrite diverged or dirty work.

## Choose authoring guidance

Use the current harness-maintained skill creator when it is exposed in the active skill catalog. Resolve its exact path/provider from that catalog and read it; do not choose a personal skill solely because it has the same `skill-creator` name, and do not load both creators. In Codex this is normally the bundled system `skill-creator`, but other harnesses may expose a different maintained creator.

This skill keeps ownership of repository location, scope, validation, publishing, and installation. The native creator supplies authoring guidance within those boundaries. When no harness-maintained creator is available, use [portable-authoring.md](references/portable-authoring.md); it is a supporting reference, not a separately installed skill. Do not install a creator or change global skill discovery merely to complete an ordinary edit.

## Edit or create

1. Read the target skill and relevant supporting files. For moves/removals, inspect callers and resource use first.
2. Make the requested source changes using the chosen authoring guidance. Match `name` to its directory; use lowercase letters, digits, and hyphens. Keep trigger descriptions precise and preserve supported optional metadata.
3. Run the chosen creator's validator when available. Otherwise use the portable validation guidance. Check local references and inspect behavior against the intended requests; run changed executable helpers where appropriate. Do not require `.skill` packaging for this repo's normal directory-based installation.
4. Review the scoped diff. When commit/push is authorized, load `git-project-memory`, stage only the intended paths, commit with an actual multiline message where needed, and push. An edit request limited to a draft or local change stops there; do not turn it into publication.
5. When installation is authorized, install only the changed/requested skills. Verify the installer result and actual target content, not just the existence of one agent's directory.

## Install and remove

Default target agents for authorized personal-skill installation are `claude-code`, `windsurf`, `antigravity`, `antigravity-cli`, `codex`, `gemini-cli`, and `opencode`; respect a narrower user choice.

```bash
npx skills add Derek-X-Wang/skills --skill <skill-name> -g -y -a claude-code -a windsurf -a antigravity -a antigravity-cli -a codex -a gemini-cli -a opencode
```

An install-only request skips editing and publishing. Use `--all` only for an explicit install-all/sync request. Do not reinstall unrelated skills during a scoped update. Verify current CLI help if its syntax differs from this example.

For deletion, enumerate actual installations with `npx skills list -g --json`, then resolve the selected skill's exact source and installed paths. Historical links may extend beyond today's default installation targets; do not assume the default list is exhaustive. Protect harness-maintained/system copies, especially same-name creators. If a name matches different origins and the removal target is ambiguous, stop for target resolution before removal.

Remove the requested source directory, then commit/push and uninstall only within the granted scope. After confirming that all matching links belong to the authorized target, omit `-a` so removal covers its historical agent links:

```bash
npx skills remove -g -y --skill <skill-name>
```

Re-enumerate installations and inspect the resolved paths after removal. Verify obsolete aliases are gone and protected native/system creators remain. Report what was removed and the recovery location or commit. A source rename or successful removal command alone does not prove an old installed alias has disappeared.

## List and report

For a list or inspection request, read the local repo without pulling or mutating it. Report changed skills, validation evidence and limits, commit/head and push status when applicable, verified installation targets, and any retained aliases or cleanup limits. Keep local, published, and installed state distinct.
