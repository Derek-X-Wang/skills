# Capacity and fleet

Read before allocating factory capacity or choosing a new route. [Routing matrix](orchestration/routing-matrix.md) retains dated model preferences; this file owns common capacity and inventory policy.

## Keep the layers separate

| Layer | Meaning |
| --- | --- |
| Entitlement | Subscription, API allowance, or local compute source actually charged |
| Provider | Organization that supplies a model |
| Gateway | Access route serving models from one or more providers |
| Model | Intelligence selected for a role |
| Harness | Agent loop, tools, context, and permission system |
| Session | One running model/harness in a checkout |
| Host | UI or terminal environment displaying sessions |
| Control plane / route | Supported session lifecycle capability / connection to an executor |
| Machine / state affinity | Execution location / required login, profile, tab, desktop, or other retained state |

A model provider does not identify the charged entitlement. A gateway catalog does not prove a model's tools, quota, permission, or harness support. Providers and gateways are extensible inventory records, not hardcoded integrations. A route on another machine remains unverified until checked; copying configuration does not establish readiness.

## Static capability inventory versus live observation

Use the [OS-owned shared Fleet](shared-fleet.md): machine capabilities, allowed executors, route mechanics references, network/disclosure boundaries and state affinity belong to its registry; current availability, readiness and quota belong to its timestamped observations or declared live sources. Projects reference the shared IDs and record their own commitments/evidence. They do not bootstrap private fleet copies. Installed, exposed, running, connected, and targetable are different states. Refresh affected observations through the authorized publisher/source after a session/harness/machine change, disconnect, rate-limit event, reset, or meaningful consumption. Reuse sufficiently fresh evidence; do not poll every worker by ritual.

For each dispatch prove the actual checkout, required tools, permissions, return path, cleanup owner, and any target state in the executing session. Use [UI routing](computer-use.md) for authenticated surfaces. Persistent authenticated state is a retained resource with an owner and affinity, not a disposable worker cache. One active controller owns desktop input or a shared mutable window. Never copy cookies, credentials, profile files, or private page contents to make another machine appear equivalent.

wefty may supply compute or a Computer Seat when its operational contract is verified. Seshloom may transport scoped messages. Their existence does not establish remote harness/UI readiness, authority, or an unattended return path. Use operational sources for commands and lifecycle; document missing capability without inventing a new service.

## Pluggable quota observations

Select a supported, authorized adapter for each entitlement. Orca's public account surface is a previously proven starting adapter when locally available; it is not a permanent requirement. A provider's supported quota API, an exposed tool, or another explicitly authorized adapter can fill the same contract. Read its current operational guidance before use. Do not add authentication scrapes, credential-store reads, purchases, installs, or broad session-log collection merely to fill missing data. A source must identify the pool it measures and its freshness semantics.

Record short-window, weekly, monthly, model-specific, and shared pool limits where applicable. Use `unknown`, not zero or healthy, for missing/stale/failed measurements. A current weekly observation cannot override an unknown or exhausted applicable short window. Evaluate every applicable constraint and reserve; percentages from different plans are not comparable token budgets. Readiness and usage are independent: a live route may have no capacity, and spare quota may have no eligible route.

Policy declares a normal interactive reserve **per entitlement/pool** in the same unit as its observation. Before admission, account for estimated task use, concurrent commitments, all applicable limits, and the protected reserve. An unconfigured reserve or estimate is not unlimited capacity. Under unknown usage, permit only an explicitly bounded provisional call when policy grants it; no sustained or parallel volume until relevant capacity is verified. Otherwise select another eligible route or park. User reports of near-exhaustion invalidate contradictory old headroom.

## Normal-mode pacing

At admission and material capacity changes, calculate each applicable pool's usable current allowance: remaining allowance minus protected interactive reserve minus **unconsumed** in-flight commitments, floored at zero. Subtract only commitments not already reflected in that observation. Estimate candidate task costs or recent consumption in that pool's own units, with source, age, uncertainty, and baseline. Treat short/weekly/model/shared pools as simultaneous constraints on the same task, not additive capacity; never compare percentages across plans or count the same consumption twice through rate and task estimates.

Use verified time until that pool's reset to judge the pace. Usable allowance divided by time remaining is a rough planning comparison, not a spending target or promised throughput. Compare it with empirical recent consumption and reasonable bounded task estimates. With ample usable allowance, a nearer reset and useful independent backlog can justify more admissions or concurrency up to configured machine, route, review, project, and run-window limits. With the same allowance but a distant reset, or a recent pace that would exhaust it before reset, reduce or pause new admissions, serialize more work, or select another eligible entitlement. The most restrictive applicable pool/gate wins. Keep protected reserve even just before reset; only an explicit scoped sprint releases it.

Unknown/stale reset time, consumption, or task costs establish no sustainable parallel pace: use only policy-authorized bounded provisional work, or park/select a verified alternative. Do not project unredeemed credits/future allowances, invent task costs from model rankings, weaken checks/review, or create work to consume capacity. Slow **new** admissions; useful in-progress writers retain their budgets and safe checkpoint rules rather than being killed to meet a forecast.

Record the selected admission/concurrency decision, reason, per-pool usable allowance and time-to-reset evidence, cost/rate assumptions, binding limits, and next reevaluation condition in private state. Reevaluate after meaningful consumption, task completion/cost change, quota/reset/readiness changes, sprint expiry, and every manual resume; a saved fast mode is not permission to continue it. These are manager decisions under existing authority, not a new timer, forecast engine, or scheduler.

## Timed sprint and resets

A sprint is explicit owner authorization naming entitlement/pool IDs and either an absolute expiry with timezone or one specific reset occurrence with an absolute expected time and observation condition. Record its reserve override and authority reference. Validate the expiry before each admission and after wake/resume; the earlier configured stop condition wins if both exist. On expiry, a delayed/unknown selected reset, or uncertain clock/reset evidence, restore the normal reserve and admit no work using the released capacity. Checkpoint or finish already admitted work only under its recorded budget; a sprint cannot exempt it from hard caps. Never roll a selected reset forward to the next cycle automatically.

A sprint can release interactive reserve only for its named pools. Unnamed pools retain theirs. It does not expand paid spend, scope, release/deploy authority, or task budgets. Unused allowance is acceptable; no quota utilization target exists.

Reset-credit redemption requires owner direction or an individually preauthorized redemption specifying entitlement, credit/action, conditions, maximum count (one), expiry, and authority reference. An automated redemption also requires a supported authorized adapter and verified result; absent one, report that the owner must redeem it. Do not treat banked credits, expected resets, or preauthorization as already available quota. Refresh observations after a confirmed redemption. A manager restart does not renew a consumed authorization or override a hard STOP.
