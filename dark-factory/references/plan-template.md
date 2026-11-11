# Unattended-run plan template

Use this private planning checklist for a factory or unattended window. Reuse existing approved policy; `[OWNER]` marks only decisions still missing from that authority. Keep real configuration and operational evidence outside this public repository under [records](records.md). A one-shot Bite pass does not need a recurring-loop plan.

## 1. Window and goal

- Window: `<start, zone>` → `<end, zone>`. Daylight-saving change inside it? `<yes/no, date>`
- Goal (one or two lines): what the owner should find when they return.
- Existing project owner and approved project goal/workflow; for an explicitly assigned multi-project run, also its global manager, other execution owners, priority overrides and authorized shared allocations. Preserve known assignments without asking again. Independent projects are parallel only within an actual multi-project assignment and verified capacity; coupled work stays serialized.

## 2. Current state (read-only inventory)

- Main SHA and the result of every workflow on it.
- Open PRs in flight, and who owns each.
- Issues in the queue: their labels, blockers, and whether each is safe without a human.
- CI cost model (free hosted runners? paid minutes? cloud?).
- Gates an agent must run before it says "works" (format, vet, tests with a long timeout).
- Known sandbox limits (tests that cannot run inside a worker's sandbox, and where they run instead).
- Peer sessions: for each, its prohibited operations (for example "no local Docker or VM"), the source of that rule, and the authorized fallback. Recheck before each dispatch and after a session is replaced.

## 3. Ordered queue

| # | Item | Why it is safe unattended | Done when (verifiable) | Est. |
|---|---|---|---|---|

- Stretch list, in order.
- **Out of scope, do not start** (list each with the reason: needs a human, needs a design decision, security, public wording, release, commercial). `[OWNER]`

## 4. Guardrails

- Per-workflow allowed operations: local reads/edits/tests, commit, push, PR publication, merge, replies, release and deployment listed separately. Personal ordinary code may merge after project gates and required risk review under run authority. Bite stays private-only except isolated own-feedback local fixes/tests. `[OWNER]`
- Experimental items in use: each item, its mode, its stable path, and whether that stable path is authorized for this run ([experimental](experimental.md)).
- Selected project integration gate; use [strict merge gate](merge-gate.md) when applicable, with its batch size, solo-only items, required workflow names, batch eligibility check result, main-only jobs, and whether temporary `batch/*` branches may be deleted. `[OWNER]` Preserve stronger repository requirements and the shared [R0/R1/R2 policy](orchestration/review-policy.md).
- Red main → revert PR. Flake → one rerun. Three unexplained failures → park.
- No force-push, no history rewrite, no `--no-verify`, no branch deletion except own merged branches and, when listed above, the run's own temporary `batch/*` branches.
- No settings, branch protection, secrets or permissions changes. No manual workflow dispatch unless listed. `[OWNER]`
- Labels: which ones agents may add or never add.
- The owner's installed or live tools: hands off (no upgrade, setup, removal, service-manager changes).
- Delete/kill authority: exact paths and process owners. `[OWNER]`
- Content: no private names, paths, logs or business text in public places. Language for public text.
- Spend: $0, no purchases (including model credits). If the run may spend: the cap, who approves each paid step, how unbilled work counts toward the cap (billing lags 1–2 days; count a worst-case bound), and a cost forecast logged before each paid step with verified teardown after. `[OWNER]`
- Contract changes (wire fields, error codes, public APIs): out of scope, or allowed only with the contract tests and, when a deployed release carries the old contract, a mixed-version upgrade check. `[OWNER]`

## 5. Really big problem

- Definition (money, secret, unrevertable red main, data/history loss, owner's tools damaged, security issue in shipped code).
- Response: stop, revert via PR, top of QUESTIONS.md, one outside message, continue unrelated work.
- Outside channel and recipient. `[OWNER]`

## 6. When blocked

- Write to QUESTIONS.md: time, item, question, options, recommendation, what was done meanwhile.
- Resolve implementation decisions within granted scope; record material assumptions/revert paths. Apply R0/R1/R2 by risk. New authority or scope cannot come from reviewer agreement: park it and continue independent authorized work. `[OWNER]`
- Review/takeover stop rule: two substantive failed fixes on the same material issue trigger bounded replanning/takeover. Preserve budgets and review requirements; publish a draft PR only when authorized.
- Authorized owner-instruction channel and verification; amendments apply only to their exact target/scope. A short ambiguous reply does not expand spend or publishing authority. `[OWNER]`

## 7. Loop, liveness and usage

- One-shot or separately authorized recurrence; supported loop/timer host and cadence only if recurrence is enabled. No automatic schedule creation. `[OWNER]`
- Stage B manual same-machine manager continuation: private checkpoint location, old manager/writer fencing, live reconciliation and new ownership evidence. Automatic manager recovery remains deferred.
- Every session: name, role, permission mode, return/delivery route and actual approval behavior; distinguish project integration ownership from shared resource policy. Verify delivery in the current harness. `[OWNER]`
- Hard stops (CI time, spend, quota): the response when one is exhausted, which failure classes a recovery rule may resume, and a fallback queue of authorized, unfinished work. `[OWNER]`
- Machine stays awake? Load limits (hard limit, peer stop limit, heavy-test limit).
- Test isolation on the owner's machine: every test gets its own temp and state root; throwaway services on non-default ports.
- Performance measurements: merge-free window per sample, and the "contended = not counted" rule.
- Usage per entitlement/pool: configured supported adapter, timestamped source/expiry, all applicable windows and interactive reserves. Sprint exceptions name pools and absolute expiry/specific reset; reset-credit redemption is owner-directed or individually preauthorized under [capacity policy](capacity-and-fleet.md).
  - e.g. lead model ≥ X% of weekly → lead only orchestrates; worker model < Y% left → start no new item; 0% → pause coding.
  - Data missing or older than N hours → "unknown" → safe mode.
- Log line format (time with zone, liveness, item, usage with data age, mode, action).

## 8. Report

- One authoritative due time, inside the window, and the path. Sections: [report-template.md](report-template.md). `[OWNER]`

## Amendments

Append each owner change during planning with time and the owner's words. Later amendments replace earlier rules they contradict; say which.
