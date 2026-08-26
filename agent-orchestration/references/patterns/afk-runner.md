# AFK runner

Use this pattern to process a queue serially after product, safety, scope, and authority decisions are complete. The worker should not need human interaction.

## Preconditions

- Each item has explicit acceptance criteria and dependencies.
- The orchestrator has selected the next item and confirmed its blockers.
- The dispatch names the repository, base, worktree, ownership, no-touch areas, checks, review gate, and external-write authority.
- CI and branch protections are understood when integration is authorized.
- A blocker path returns to the orchestrator.

Use the installed `github` skill for current GitHub CLI mechanics when the queue lives on GitHub. Verify repository labels, issue format, base branch, merge policy, and command syntax instead of copying stale defaults.

Do not use AFK mode for vague issues, unresolved product choices, missing safety decisions, or work whose external effects are not authorized.

## Serial loop

```text
orchestrator assigns item
          ↓
worker implements and verifies
          ↓
orchestrator obtains independent review
          ↓
worker handles accepted rework
          ↓
orchestrator integrates only if authorized
          ↓
reverify integration result → assign next item
```

Run one item and one integration unit at a time:

1. The orchestrator assigns the item. The worker does not race peers to claim work.
2. The worker verifies its work and returns a stable identifier plus evidence.
3. The orchestrator sends material work to an independent cross-model reviewer.
4. The worker handles accepted same-invariant findings.
5. The orchestrator performs or authorizes the next external step: commit, push, PR, merge, or none.
6. Observe required CI. Treat CI as evidence, not a replacement for independent review.
7. Reverify after any integration change.
8. Assign the next decision-complete item.

Never push directly to a protected or integration branch. Use a task branch and PR by default. Enable auto-merge, merge manually, force-push, or change repository settings only when the dispatch explicitly grants that action and repository policy permits it.

Use one message for each state change:

- `STARTED <item>`
- `EVIDENCE <identifier> — <verification>`
- `OPENED <external identifier>`
- `WAITING <check or dependency>`
- `BLOCKED <item> — <new decision required>`
- `DONE <item> — <accepted identifier>`
- `QUEUE_DRAINED`

The orchestrator may retry a failed command, restart a worker, or reassign a recoverable task. Stop for a behavior conflict, new authority, changed scope, or safety decision. Do not resolve a semantic merge conflict by guessing.

The dispatch must state whether the run may claim issues, change labels, comment, commit, push, open PRs, enable auto-merge, merge, delete branches, or change repository settings. Unlisted external actions are not authorized.
