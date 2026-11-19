# Computer-use escalation

Read this when no executor you can reach is eligible for a live-UI action, when you route an `executor_required` request, or when you act as the executor one selects. [Computer-use routing](computer-use.md) holds adapter selection.

When no local adapter can preserve the outcome and required state, return this capability request to the active orchestrator:

```yaml
status: executor_required
origin: <originating host, harness, model, worker, session, machine, and task identifiers from the verified return path>
executors_attempted:
  - <executor or session identifier and its disqualifying evidence>
outcome: <observable result needed>
target: <page, app, window, or surface>
required_capabilities:
  - <page, DevTools, attached browser, or desktop capability>
required_state:
  - <login, profile, tab, host, or desktop-session affinity>
explicit_constraints:
  - <user-selected surface or none>
local_adapters_checked:
  - <adapter and observed readiness>
disqualifying_evidence:
  - <why each local adapter cannot preserve the requirement>
actions_already_performed:
  - <ordered redacted action identifiers and evidence references, or none>
current_observed_state:
  - <fresh redacted state summary and evidence references after those actions>
replay_constraints:
  - <non-idempotent actions that must not be repeated without proof>
disclosure_constraints:
  - <data and evidence the selected executor is authorized to receive>
authority: <read-only and permitted mutations>
evidence_required:
  - <snapshot, screenshot, visible state, or diagnostic output>
stop_conditions:
  - <authentication, ambiguity, confirmation, or unsupported state>
reason: <why no eligible local adapter exists>
```

- In worker mode, send the request only to the orchestrator and stop. Never recruit or message a peer executor.
- If the worker's return path is unavailable or unverified, do not contact the human or a peer and do not mutate further; stop with `NOT-RUN` in the local result.
- Describe the required capability and disqualifying evidence; do not select the replacement model, harness, or session.
- Keep the packet minimal and redacted. Describe authenticated or private state by reference and evidence class; do not copy page contents, credentials, private data, or unrelated UI state into a cross-session request. If required evidence would exceed existing disclosure authority, record that limit without including the evidence so the orchestrator can resolve the disclosure decision.
- In direct or orchestrator mode, load [task orchestration](orchestration.md) and treat the request as routing input, not permission to dispatch or expand scope.
- If [task orchestration](orchestration.md) cannot prove another eligible executor and reliable return path, stop with `NOT-RUN`; do not loop back into the unchanged local route.
- The selected executor must verify its own task tools/access, assigned adapter eligibility, and actual target before acting. Treat prior actions and state as claims to verify, preserve the replay and disclosure constraints, and never repeat a non-idempotent mutation merely because the prior executor did not finish. If landing cannot be verified, do not re-attempt; return `PARTIAL` with the uncertainty. A claimed tool or open browser in another session is not proof of current eligibility.
- Cross-host dispatch ownership stays with [task orchestration](orchestration.md): it verifies the actual session route, delivery, approvals, return, and lifecycle. An open or prefilled composer or a shared folder is not proof of dispatch. An automatic route without that verification is unverified (`NOT-RUN`); propose a manual user-send handoff only through proper authority. Keep `PARTIAL` and its replay constraints when a non-idempotent action may have landed.
- When another executor also cannot proceed, append its identifier and disqualifying evidence without discarding earlier attempts. Never route back to an unchanged attempted executor.
