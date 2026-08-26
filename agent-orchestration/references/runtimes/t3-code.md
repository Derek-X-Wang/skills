# T3 Code host

T3 Code is a host that can wrap different coding harnesses. Do not infer the harness from the T3 Code UI alone.

## Detection and routing

1. Read injected runtime metadata first.
2. Inspect the current tool inventory for native collaboration tools.
3. Treat exposed spawn, follow-up, message, wait, list, and interrupt tools as the reliable route for harness-owned subagents.
4. Use a T3 Code host route for another terminal only when a callable host tool or current CLI help proves that route.

Do not depend on a T3-specific environment variable. Do not invent a `t3` messaging command when none is installed or documented in the current session.

## Operating rules

- Prefer native collaboration tools for the current harness.
- Keep all worker and reviewer traffic in the orchestrator mailbox.
- Use the host only to reach sessions that the native harness does not own.
- Record the actual harness, host, model, and worktree in each dispatch.
- Keep work local if the worker return path cannot be verified.

The T3 Code browser preview is unrelated to agent routing. Use it only for browser work.
