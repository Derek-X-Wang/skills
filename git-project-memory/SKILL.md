---
name: git-project-memory
description: Use Git history as project memory and write commit messages that preserve significant decisions. Use whenever creating or drafting a commit, or before making or researching a significant past architecture, product, data, safety, or compatibility decision.
---

# Git Project Memory

## Research before a significant decision

1. Read repository instructions and local history conventions.
2. Search the history around the affected path, concept, issue, and invariant.
3. Read the relevant commits and blame context before choosing an approach.
4. Treat history as evidence, not current authority. Current specifications, contracts, ADRs, and repository instructions take precedence.

Choose the smallest useful search:

```bash
git log --all --oneline -- <path>
git log --follow --oneline -- <renamed-path>
git log --merges --oneline
git log --all --grep='<term>'
git log -S'<exact text>' -- <path>
git log -G'<pattern>' -- <path>
git blame <path>
git show <commit>
```

Do not run broad searches when a path or term can narrow the result.

## Write a commit as durable memory

1. Inspect the staged diff and verification evidence.
2. Follow the repository's required subject style, prefixes, scopes, trailers, signing rules, release metadata, and issue references.
3. Write a concise subject that names the coherent change.
4. Add a body only when future readers need important context that the diff cannot explain.

Record these details when they matter:

- The requirement, invariant, or constraint that drove the change.
- The trade-off or rejected alternative that shaped the design.
- A meaningful architecture or data-model decision.
- Non-obvious reasoning, compatibility limits, or an upstream quirk.

Omit routine diff details, file lists, self-evident renames, and claims that are not supported by the staged change.

Use this shape when a body is useful:

```text
<repository-compliant concise subject>

<Why the change was needed. State the important constraint or decision.>

<Optional: explain the trade-off, rejected alternative, or compatibility limit.>
```

This skill does not grant authority to stage files, create a commit, amend history, push, or publish. Perform those actions only when the user or dispatch grants that authority.
