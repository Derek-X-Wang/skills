# Behavioral forward tests

Use these cases for a fresh-context, read-only evaluator. They test instruction decisions, not a scheduler or live route. No executable helper is justified for V1: the concrete work is scoped orchestration and supported adapter use, with configuration/state records read by the agent.

Give the evaluator `SKILL.md`, the selected case from [forward-test-inputs.json](../assets/forward-test-inputs.json), and only its simulated raw artifacts. Ask it to select the necessary references and return intended actions, required evidence, authority limits, and resulting checkpoint/status. Permit private temporary output only. Do not supply the expected result before the first pass. Compare afterward with [forward-test-oracles.json](../assets/forward-test-oracles.json). Report each case separately; wording similarity is not success.

All timestamps, IDs, users, quotas, repositories, and paths in these fixtures are fictional. They are inputs for reasoning simulations, not configured live resources or current observations. Cases requiring a host response use the supplied response as simulated evidence, never as proof of real support. A no-side-effect forward test cannot establish prompt delivery, cross-harness readiness, writer fencing, authenticated UI state, real pagination, or actual cleanup.

The implementation author checks JSON parsing and references and inspects case coverage. The parent obtains an independent agent forward test/review. Keep that distinction in the validation report. Test live routes later only within separately authorized exact-target scope; current missing T3 cross-harness launch capability must remain NOT-RUN.

Fixture version 2 adds paired normal-mode pacing cases (same usable allowance, reset in 12 hours versus six days), an unsustainable-burn case, and an unknown-evidence manual-resume case. The personal authority case identifies deployment/new-project text as an unapproved worker suggestion, not a fresh owner instruction. Earlier saved review results are not evidence for these amended cases.

Fixture version 3 adds existing single-project supervisor adoption, stable cross-worktree storage discovery, active legacy-state migration, competing shared-observation publishers, and unknown short-window capacity in a standalone project. Test these against the project-management mode and canonical storage contract; previous source reviews do not establish their outcomes.

Fixture version 4 adds the OS-owned shared Fleet source, a freshly synchronized but expired availability snapshot, and machine-local resource metadata that must not become another Fleet. Earlier results do not verify this ownership change.
