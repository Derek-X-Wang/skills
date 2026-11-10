# OpenCode and Orca route field findings

Observed 2026-08-29 on macOS with OpenCode 1.18.25, OpenCode Go, and `opencode-go/glm-5.3-flash`. The original orchestrator was Claude Code with Opus. The follow-up control used Codex in T3 Code. Orca 1.4.191 was present.

The task was a bounded, multi-round PR fix that required implementation, verification, mutation proof, commit, and push. Codex weekly quota was almost exhausted, so the routing matrix selected GLM-5.3-Flash.

## Evidence status

- The supplied field report records the process outcome, Orca task state, terminal state, worktree state, and manual-delivery observations below.
- A later foreground control directly supports the foreground `opencode run` route.
- The exact cause of the detached child termination was not reproduced. Parent-shell lifecycle termination is the leading explanation, not a confirmed fact.
- The model planned and selected files correctly before the route failed. These findings concern route mechanics, not model capability.

## Detached `opencode run` ended without a result

The orchestrator launched this shape of command as a background process from its shell tool:

```sh
opencode run --model opencode-go/glm-5.3-flash --log-level ERROR "$(cat brief.md)" \
  > out.txt 2> err.txt
```

Observed result:

- No completion, error event, or exit status reached the orchestrator.
- `out.txt` was empty.
- `err.txt` contained about 2.6 KB of normal progress and ended during a tool call.
- No resumable session existed for the worktree.
- The worktree had no edits or commits.

The run therefore failed the existing completion contract. The trace also exposed three missing safeguards:

1. Do not detach a one-shot worker from a short-lived harness shell unless a verified supervisor owns its process lifetime and exit status.
2. Capture standard error because OpenCode can write normal progress there.
3. Verify that a session persisted before promising resume support. Redispatch from scratch when none exists.

## Orca launched OpenCode but did not deliver the prompt

The field run used Orca's structured worker launcher with the OpenCode agent identifier. The call created the correct terminal, worktree, model, and idle OpenCode TUI. The task still ended in this state:

```text
state: failed
last_failure: agent_prompt_stalled
stage: dispatch_input
```

This distinguishes launch support from orchestration support. Orca 1.4.191 could launch OpenCode, but this run did not prove automated prompt delivery, completion reporting, or a supervised OpenCode task lifecycle.

The version-matched Orca guide also listed TUI-idle support for several other harnesses but did not list OpenCode. A generic `--agent` argument is not proof of a complete harness adapter.

## Manual terminal delivery worked

Orca terminal-level text delivery reached the OpenCode composer. A harmless one-line probe succeeded before a prompt of about 4.7 KB was sent.

This route had a manual return path only:

- The orchestrator inspected terminal output and repository state.
- No `worker_done` event or completion notice arrived.
- Orca task state remained failed.
- Busy and idle detection depended on volatile TUI text.

This makes the route useful for attended work. It does not make the route suitable for unattended or AFK work.

## Generic interrupt exposed a shell

An Orca terminal interrupt stopped the active run and exited OpenCode. The terminal returned to zsh. The next agent brief was then interpreted line by line as shell input.

The observed brief did not contain an executable line that caused damage. The worktree, branch, and HEAD remained clean. A normal agent brief can contain valid shell commands, so the same sequence can cause an unintended external write or destructive action.

Required safeguards:

- Treat generic interrupt behavior as harness-specific.
- Do not treat the observed OpenCode interrupt as a pause.
- Before every terminal send, prove from a fresh read that OpenCode is the foreground process.
- After any interrupt or exit, restart OpenCode and prove TUI readiness before sending text.
- Never send an agent brief to an unverified terminal foreground.

## Orca used a stale local base ref

The worker request named a feature branch as its base. Orca created the worktree two commits behind the intended branch head because the local ref was stale even though the remote-tracking ref had been fetched.

After worktree creation, compare the actual checkout HEAD with the intended commit before dispatch. Use an explicit remote ref or commit SHA when exact base identity matters.

## Foreground control passed

A later control resolved the exact OpenCode executable and ran GLM-5.3-Flash in the foreground with structured output. Its first invocation returned the exact requested text without a resume, emitted normal start and finish events, persisted an explicit session, and exited with status zero. The session export matched the requested model and temporary checkout. The test session and temporary directory were then removed.

This control preserves the foreground one-shot route. It does not validate detached execution or Orca's structured OpenCode task lifecycle.

## Routing conclusion

| Route | Field verdict |
| --- | --- |
| Foreground `opencode run` with owned process and structured result | Proven for bounded one-shot work |
| Detached or background `opencode run` from a short-lived harness shell | Avoid unless a verified supervisor owns the process |
| Orca structured OpenCode worker in 1.4.191 | Launch-capable; prompt delivery failed |
| Orca manual terminal delivery | Usable attended fallback with manual evidence |
| Orca manual OpenCode route for AFK work | Not proven because completion reporting is absent |

Quota pressure can select a model only after route safety. When the only OpenCode route for a task is detached or unattended, select the next eligible verified route instead.
