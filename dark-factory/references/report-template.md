# Hand-back report template

The reader is the owner. They just came back, they have no implementation context, and they want to know whether the work moved toward what they asked for. Write the first part so they can act on it in a few minutes without opening a PR or a log. Put the proof in the appendix.

## Part 1 — for the owner (plain language, about one screen)

Use short sentences and common words. Explain any necessary term once. Name things by what they do for users, not by file, SHA, or job name.

1. **Why this work exists.** One or two lines: the goal in the owner's own terms, taken from the [intent ledger](records.md#intent-ledger).
2. **Where it stands.** What now works, or works better, for users. What is ready for the owner to try. What is not done yet. Any really big problem. Mark anything not verified as unverified.
3. **What I recommend, and why.** Up to three next steps, each with the reason and the main tradeoff. Say what the agent will do next, within standing authority, if the owner says nothing.
4. **Decisions for you.** An ordered list, the most important first. For each one: the context they need, the options, what each option changes in practice, the recommendation, and what the answer unblocks. Ask the smallest question that decides it. Leave out ordinary technical choices; the managers own those.
5. **Assumptions to confirm.** Things decided on the owner's behalf while they were away (from QUESTIONS.md), each with how to undo it.

Do not put SHAs, run IDs, model names, or process details in Part 1 unless the decision depends on them. Say what the risk means for the owner, not only what failed.

## Part 2 — appendix (evidence; the owner reads it only when they want depth)

Every claim has evidence (SHA, run ID, PR, log line). Keep each section short. Leave out a section that has nothing in it.

- **Run:** mode, workflow, factory manager and project managers, and authority used.
- **Ready for the owner's follow-up:** attended checks or runs that can now happen, and why.
- **Per item:** table with item, status, PRs, evidence.
- **Waiting under the merge rules:** open PRs and batches, with a one-line ask each.
- **Usage:** per entitlement or pool: reserve, sprint or reset decisions, budget used, curve (start, peak, end), data source and its age, and pauses. Label stale data "unknown"; do not reuse it as a value.
- **Liveness:** restarts, deaths, longest idle gap, and watcher results.
- **Incidents:** table with when, what, and status. Then a watch list of single sightings that were not filed.
- **Spend:** expected $0. Confirm it, and note anything that came close.
- **Experimental items:** each item used, its mode, uses, failures, issues filed, and progress toward its promotion bar ([experimental](experimental.md#give-feedback)).
- **Scheduled jobs, only when authorized:** results with run IDs. If a job has not fired yet, say NOT-RUN; do not infer future success.
- **Other notes:** cleanup and retention evidence, unresolved prior actions and replay limits, checkpoint and continuation path, settings to restore within authority, and lessons to record.

Keep company evidence private. External reply drafts stay drafts.

End with a verification line: `VERIFIED`, `PARTIAL` or `NOT-RUN`, and its evidence.
