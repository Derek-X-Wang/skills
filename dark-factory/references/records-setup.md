# Records setup: bind a project and adopt legacy records

Read from [records](records.md) when a session first selects its project directory, when no `project.json` exists yet for this repository, or when an existing project still points at legacy state.

## Project identity

Resolve the exact repository identity before selecting a project directory. Prefer a verified forge hostname/owner/repository identity, normalized across SSH/HTTPS and with a trailing `.git` removed; preserve the forge's identity/case rules. For a local-only project use its verified canonical repository/common-directory identity, not an individual worktree. Derive `<project-id>` as `<slug>-<hash>`: take the final repository-name component of the canonical identity, lowercase it, replace runs outside ASCII `a-z0-9` with `-`, trim `-` (use `project` if empty), and append the first 16 hex characters of SHA-256 of the canonical identity's UTF-8 bytes. Store the identity and evidence in [project.json](../assets/templates/project.json), and verify any existing directory's identity before using it. Worktrees of the same repository share this binding. A known existing binding takes precedence over guessing a new name after a remote/URL change; reconcile identity aliases within project ownership.

## Adoption steps

First apply the rules in the [records adoption section](records.md#adopt-existing-records-without-disrupting-work).

1. Identify the actual owner, current canonical state and all writers/readers. Preserve a private snapshot and existing paths. Create stable project metadata with `migration_status: pending`; its authoritative reference still points to the old state.
2. At a safe checkpoint, prepare candidate policy/state files in the canonical project directory. Copy only verified existing authority and status, with source references and unknown fields retained. Legacy STATE.md or custom JSON is valid migration input; do not demand a full schema rewrite before continuing otherwise safe work.
3. Verify JSON, evidence links, permissions and status against the old record. Coordinate every state writer and relevant reader. Until they acknowledge the new path, the old state remains canonical and the candidate receives no competing writes.
4. The project owner switches metadata references and writers as one coordinated ownership transition, records evidence/time, and marks migration complete. Leave an owner-approved redirect/reference at the old location when safe. Retain old snapshots and logs; do not delete or rewrite active files to tidy the layout. If interrupted, follow the last verified authoritative reference and reconcile before writing.
