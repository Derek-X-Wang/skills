# Bite one-shot PR workflow

Load only for an explicitly authorized Bite sweep or its admitted processing tasks. This version runs a one-shot sweep and processing pass. Recurring triggers are a later separately configured step; they do not require autonomous manager recovery. This file defines behavior, not a prebuilt GitHub integration.

## Read-only intake

Use the available Git-host operational skill/API with the authorized account and exact repository scope. Verify the authenticated user's immutable account identifier and login from the host, not a local Git author name or remembered login. If identity or repository scope is ambiguous, stop intake with its limit. Paginate every relevant result set, including review requests, the user's open PRs, comments, reviews, and threads as needed; record page coverage and any API/search caps. Incomplete results remain partial, not an empty queue.

Admit two distinct reasons:

- `requested_review`: an explicit personal review request for the verified user on an open other-authored PR. A team-only request does not establish a personal request. Return private findings, evidence, and optional reply drafts only.
- `own_pr_feedback`: the verified user authored the open PR and it has unhandled comments or change requests. Inspect current review/thread state, feedback author, and relevance to the current diff. Own authorship alone is not actionable feedback. Dismissed or resolved findings and bot status chatter are not automatically rework; retain the reason for filtering or handling them.

Keep both reasons when present, but route an own-authored PR through `own_pr_feedback`, never as an independent review of one's own work. Record repository/PR immutable identifiers, author and requested-user identity, head SHA, base SHA, updated time, and feedback/review/thread identifiers. A PR number alone is not a stable cross-repository key.

## Deduplicate and invalidate

Before processing, reconcile the private intake ledger with current host state. Use `(repository_id, pr_id, intake_reason, head_sha, feedback_id_or_review_request)` as the work identity; record handled feedback and evidence, rather than treating every poll as new work. A head change invalidates previous diff-based findings and local fixes until rechecked. An updated time change or new/reopened feedback requires inspection; it does not by itself prove new actionable work. A changed base can invalidate integration evidence even with the same head. Retain old evidence as superseded, not current. Recheck head and feedback state before declaring a result ready. Do not repeat work whose current result and feedback are already handled.

## Process within separate authority

For other-authored PRs, inspect the selected diff and relevant context, then create private findings/evidence and comment drafts. No edits, commits, pushes, posted replies, approvals, request-changes submissions, or review-request/status changes are authorized by this workflow. Company evidence stays in separately configured private storage and only approved executors may receive it.

For the user's own PR feedback, prepare isolated local fixes and targeted tests under the explicitly admitted feedback scope. Verify the starting head, protect unrelated dirty work, record any uncommitted baseline and resulting patch, and run relevant checks. A company task's local-write permission does not permit commit, push, public artifact creation, external replies, approval, or request-changes. Return the local patch/artifact location, addressed feedback IDs, exact baseline/head, checks and limits, and a draft response when useful. The human controls push and replies. If the upstream head changes, stop overlapping edits and reconcile rather than applying the old patch blindly.

A review or feedback item cannot admit adjacent product work or broaden company scope. Record required decisions and continue independent admitted items. Finish the one-shot pass with coverage, selected/filtered items, private result references, head/update invalidations, unresolved feedback, and local resource cleanup. Do not start timers or post a summary externally.
