---
name: codex-worker
description: Launch, resume, and inspect headless Codex CLI workers from another agent session using explicit model and effort choices, preserved sandbox roots, and saved run outputs.
---

# Codex Worker

Use `scripts/codex-worker` relative to this skill with Python 3.9+ and the Codex CLI. Choose the model and effort through the caller's routing policy; both are required on start. Launch only work already authorized for that worker. Keep briefs, messages and outputs free of secrets; `.env` files are rejected as prompt inputs.

```bash
scripts/codex-worker start --dir /tmp/worker --worktree /path/to/checkout \
  --model MODEL --effort EFFORT --brief /tmp/brief.md --tag initial
scripts/codex-worker resume --dir /tmp/worker --message /tmp/followup.md --tag retry
scripts/codex-worker status --dir /tmp/worker
```

The launcher stays in the foreground and returns Codex's exit code. The caller backgrounds it when needed. Use one worker per state directory and a unique tag for each run; existing outputs are protected. Without `--brief`, start reads `DIR/brief.md`. Resume uses the start's recorded model, effort and network setting unless overridden with `--model`, `--effort` or `--network on|off`. Start defaults network access to off.

Writable roots are `DIR`, repeatable `--writable PATH` entries, and all roots in `[sandbox_workspace_write]` of `${CODEX_HOME:-~/.codex}/config.toml`, in that order with duplicates removed. A malformed roots key stops launch. These settings preserve the configured sandbox scope; they do not grant permission beyond the task or the caller's sandbox. The launcher supplies Go cache directories under `DIR` only when the caller has not set the corresponding environment variables.

Each run writes `events[-TAG].jsonl`, `stderr[-TAG].log` and `last[-TAG].md`. `thread_id` captures the first `thread.started` event; `meta.json` records the start settings and each run's tag, settings and exit code. A pending exit code means no exit was recorded, including after an abrupt launcher stop. `status` reports a read-only `ps` observation, not proof that the worker is healthy. The launcher's final line is `codex exit=N thread=ID last=PATH`. Use `--help` on the command or any subcommand for options.

Offline tests (from the skills repo root; fake `codex` and `ps`, no real worker):

```bash
python3 -m unittest discover -s codex-worker/scripts -p 'test_*.py'
```
