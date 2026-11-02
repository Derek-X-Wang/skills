# Unattended-run plan template

Fill this in with the owner **before** the window opens. Every `[OWNER]` line is a question the owner answers now, because nobody can ask later. Keep the plan in a private folder; it may name private projects.

## 1. Window and goal

- Window: `<start, zone>` → `<end, zone>`. Daylight-saving change inside it? `<yes/no, date>`
- Goal (one or two lines): what the owner should find when they return.
- Higher-priority work that shares the same quotas or machine, and the split. `[OWNER]`

## 2. Current state (read-only inventory)

- Main SHA and the result of every workflow on it.
- Open PRs in flight, and who owns each.
- Issues in the queue: their labels, blockers, and whether each is safe without a human.
- CI cost model (free hosted runners? paid minutes? cloud?).
- Gates an agent must run before it says "works" (format, vet, tests with a long timeout).
- Known sandbox limits (tests that cannot run inside a worker's sandbox, and where they run instead).

## 3. Ordered queue

| # | Item | Why it is safe unattended | Done when (verifiable) | Est. |
|---|---|---|---|---|

- Stretch list, in order.
- **Out of scope, do not start** (list each with the reason: needs a human, needs a design decision, security, public wording, release, commercial). `[OWNER]`

## 4. Guardrails

- Merge authority: which PR kinds self-merge, which wait. `[OWNER]`
- One merge at a time; next merge after main finishes all workflows.
- Red main → revert PR. Flake → one rerun. Three unexplained failures → park.
- No force-push, no history rewrite, no `--no-verify`, no branch deletion except own merged branches.
- No settings, branch protection, secrets or permissions changes. No manual workflow dispatch unless listed. `[OWNER]`
- Labels: which ones agents may add or never add.
- The owner's installed or live tools: hands off (no upgrade, setup, removal, service-manager changes).
- Delete/kill authority: exact paths and process owners. `[OWNER]`
- Content: no private names, paths, logs or business text in public places. Language for public text.
- Spend: $0, no purchases (including model credits). If the run may spend: the cap, who approves each paid step, how unbilled work counts toward the cap (billing lags 1–2 days; count a worst-case bound), and a cost forecast logged before each paid step with verified teardown after. `[OWNER]`
- Contract changes (wire fields, error codes, public APIs): out of scope, or allowed only with the contract tests and a mixed-version upgrade check. `[OWNER]`

## 5. Really big problem

- Definition (money, secret, unrevertable red main, data/history loss, owner's tools damaged, security issue in shipped code).
- Response: stop, revert via PR, top of QUESTIONS.md, one outside message, continue unrelated work.
- Outside channel and recipient. `[OWNER]`

## 6. When blocked

- Write to QUESTIONS.md: time, item, question, options, recommendation, what was done meanwhile.
- Decision rule: the right option (not the most reversible) when the lead's review and an independent second-model review agree → `ASSUMED, needs owner`, carry it out, record the revert. Disagree → record both, move on. `[OWNER]`
- Review stop rule: after about 4 non-converging review rounds, park as a draft PR and give options.
- If the owner may be briefly reachable: does a chat reply count as approval for design choices only, or also for spend? `[OWNER]`

## 7. Loop, liveness and usage

- Loop host (in-session cron, OS scheduler, outside nudge) and cadence. `[OWNER]`
- If the lead session dies: restart command, or "not restarted; report it". `[OWNER]`
- Every session in the run: name, role, permission mode, and whether it is under the shared merge gate or only shares resource limits. A mode mismatch can hold peer messages without notice. `[OWNER]`
- Hard stops (CI time, spend, quota): the response when one is exhausted, which failure classes a recovery rule may resume, and a fallback queue of authorized, unfinished work. `[OWNER]`
- Machine stays awake? Load limits (hard limit, peer stop limit, heavy-test limit).
- Test isolation on the owner's machine: every test gets its own temp and state root; throwaway services on non-default ports.
- Performance measurements: merge-free window per sample, and the "contended = not counted" rule.
- Usage per provider: live source, refresh behavior, thresholds and actions:
  - e.g. lead model ≥ X% of weekly → lead only orchestrates; worker model < Y% left → start no new item; 0% → pause coding.
  - Data missing or older than N hours → "unknown" → safe mode.
- Log line format (time with zone, liveness, item, usage with data age, mode, action).

## 8. Report

- One authoritative due time, inside the window, and the path. Sections: [report-template.md](report-template.md). `[OWNER]`

## Amendments

Append each owner change during planning with time and the owner's words. Later amendments replace earlier rules they contradict; say which.
