---
name: pr-writing
description: Write or revise pull request descriptions that preserve repository templates, explain product meaning first, show only material technical decisions, and give honest verification evidence. Use whenever creating, drafting, reviewing, or updating a PR description or moving long PR context into comments.
---

# PR Writing

## Workflow

1. Read the repository instructions, PR template, linked issue, specification, contract, and ADRs that apply.
2. Inspect the actual diff, commits, and available verification evidence. Do not infer work or test results from intent.
3. Preserve required headings, checklists, release notes, issue links, and repository-specific wording.
4. Draft for a human reviewer. Put product meaning before implementation detail.
5. Check every claim against the diff or cited evidence.

For a non-trivial PR, preserve these three layers even when the repository template uses different headings:

## Spirit

Explain what changes for the user or product and why it matters. A reader with no implementation context must understand the direction from this section.

## Technical details

Include only decisions that help a reviewer understand the design, contract, risk, or important limitation. Do not write a file-by-file tour.

Prefer a Mermaid diagram when it explains a flow, architecture change, state transition, or data movement faster than prose. Prefer a table for compact comparisons or repeated fields. Do not add a visual when it does not improve understanding.

## Evidence

State:

- What data or behavior you inspected.
- What observation caused or justified the change.
- How a reviewer can verify it.
- What result the reviewer should expect.

Label the verification result as `VERIFIED`, `PARTIAL`, or `NOT-RUN`. Name unavailable hardware, credentials, services, or environments. Never invent evidence or hide an unavailable check.

Use a compact evidence table when several checks apply:

| Status | Check | Evidence or expected result |
| --- | --- | --- |
| `VERIFIED` | `<command or observation>` | `<result>` |

## Keep the front page readable

Put long logs, investigation journals, session transcripts, rejected alternatives, and other archival detail in PR comments. Keep the description as the stable front page.

This skill does not grant authority to publish a PR, edit an existing remote PR, post comments, push a branch, or merge. Perform those actions only when the user or dispatch grants that authority.
