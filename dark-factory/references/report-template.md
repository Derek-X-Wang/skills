# Hand-back report template

Write it for an owner with no context who has just come back. Lead with the outcome and the decisions. Every claim has evidence (SHA, run ID, PR, log line). Mark anything not verified.

1. **Summary** — 3–5 lines: what shipped, main's state, any really big problem, what is blocked on the owner.
2. **Per queue item** — table: item, status, PRs, evidence.
3. **Ready for the owner's follow-up** — attended checks or runs that can now happen, and why.
4. **Items that wait for a design decision** — what was not touched, and why.
5. **Waiting for the owner** — open PRs held under the merge rules, one-line ask each.
6. **QUESTIONS.md digest and assumptions** — table: #, item, what was assumed, how to revert. Say these are not confirmed yet.
7. **Usage** — curve per provider (start, peak, end), data source and its age, mode changes, pauses. Stale data is labeled "unknown", not reused as a value.
8. **Liveness** — restarts, deaths, longest idle gap, helper watcher results.
9. **Incidents** — table: when, what, status. Then a watch list of single sightings that were not filed.
10. **Spend** — expected $0; confirm, and note anything that came close.
11. **Scheduled jobs in the window** — results with run IDs. If a job had not fired yet, say NOT-RUN and update the report when it does.
12. **Next 3 suggested items.**

Then a short "Other notes" list (cleanup decisions, settings to restore, lessons to record).

End with a verification line: `VERIFIED`, `PARTIAL` or `NOT-RUN`, and its evidence.
