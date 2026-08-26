# Tested routing defaults

Last reviewed: 2026-08-25.

These are Derek's tested defaults. They are soft preferences, not permanent capability rankings. Verify that the named model, effort setting, harness, and quota are available. Record any substitution in the run evidence.

| Harness | Model | Effort | Preferred role | Operating note |
| --- | --- | --- | --- | --- |
| Claude Code | Fable | high | Orchestrator and coordinator | Strong at intent and task meaning. Preserve limited quota for decomposition, synthesis, and decisions. Use cross-model review for its implementation. |
| Codex | GPT-5.6 | high | Default implementer | Preferred for implementation volume. Also useful for computer use, image generation, and iOS work when those capabilities are available. |
| Codex | GPT-5.6 | high | Primary reviewer | Use as the default critical reviewer for Claude-produced work. |
| Claude Code | Opus 5 | high | Implementer or reviewer | Use as a strong alternative implementer and cross-model reviewer. |
| Claude Code | Sonnet 5 | default | Lower-cost worker | Use for bounded work. Reassign when it repeats a loop without progress. |
| Antigravity CLI | Verify at dispatch | default | Frontend design or image work | Use only after verifying the current CLI, model, and required image capability. |

Prefer `high` for frontier models unless the task proves that more reasoning effort is useful. Do not spend extra effort by habit.

When a listed model is unavailable, choose by role requirements:

1. Preserve a strong orchestrator for intent and decision control.
2. Use a capable implementation model for code volume.
3. Use a different model family for material review.
4. State the substitution and any review limitation.

Use the smallest capable model for passive environment watchers and other bounded observation roles. Do not hard-code a cheap model name that the current harness may not provide.
