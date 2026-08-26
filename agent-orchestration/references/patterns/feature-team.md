# Feature team

Use this pattern for a non-trivial feature or hard bug when implementation, environment observation, user-level QA, and independent review benefit from separate attention.

Keep a small team. Add only roles that carry real work:

| Role | Ownership | Return to orchestrator |
| --- | --- | --- |
| Implementer | Assigned source and tests | Change identifiers, evidence, risks, blockers |
| Environment watcher | Long-running build, server, or logs; no edits | Startup state, new errors, recovery evidence |
| QA tester | User-level behavior; read-only unless test files are assigned | Reproduction steps, expected and actual behavior, evidence |
| Reviewer | Independent cold review; no edits | Severity-ranked findings and review limits |

## Topology

```text
                    ┌─ implementer
human ↔ orchestrator├─ environment watcher
                    ├─ QA tester
                    └─ reviewer
```

No role contacts another role. The orchestrator relays each actionable signal.

## Run the loop

1. Write one task contract with the outcome, invariant, accepted decisions, scope, verification, authority, and stop conditions.
2. Assign non-overlapping ownership. Put every editing role in a separate worktree.
3. Start the environment watcher first only when a persistent process gives useful feedback.
4. Dispatch the implementer when the environment or static preflight is ready.
5. Relay build or runtime errors from the watcher to the implementer.
6. Dispatch QA against a stable implementation identifier and explicit acceptance criteria.
7. Relay accepted QA findings to the implementer. Repeat until the acceptance evidence is green or a stop condition occurs.
8. Send material work to an independent cross-model reviewer with the contract, diff, accepted decisions, and evidence.
9. Relay accepted review findings to the implementer. Reverify the changed result.
10. Synthesize the final outcome and shut down every role.

Use compact state messages:

- `READY <role> — <state>`
- `BLOCKED <role> — <decision or dependency>`
- `EVIDENCE <identifier> — <verified result>`
- `FINDING <severity> — <same-invariant issue>`
- `DONE <role> — <identifier>`

Do not use this pattern for a small, clear change. Do not add a watcher when a normal command can supply the same evidence. Do not let QA or the watcher edit source to speed up the loop.
