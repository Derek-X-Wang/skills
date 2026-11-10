# OpenCode host routes

**Date:** 2026-08-28
**Scope:** Ways to launch, message, and read an OpenCode worker from Codex, Claude Code, T3 Code, or a shared control plane without requiring an Orca-managed terminal.

## Conclusion

There are two usable routes now, but they solve different problems:

1. `opencode run` is the simplest programmatic route from either Codex or Claude Code. A harness can launch it as a child process, select an OpenCode Go model, read JSON events, and continue a named session. It does not need Orca or a separate terminal.
2. T3 Code 0.0.34 has a built-in OpenCode provider. It is enabled and authenticated on this machine. T3 currently sees both `opencode-go/glm-5.3-flash` and `opencode-go/deepseek-v4-flash`. This is a real route for a human to open an OpenCode thread in T3.

The current Codex session cannot create or control a T3 OpenCode thread. Its T3-provided tools expose browser preview operations only. Codex-native subagents do not cross that provider boundary. Therefore, T3 is already an OpenCode host, but it is not yet an exposed control plane for this Codex orchestrator.

For a shared, structured control plane, ACP through `acpx` is the best next experiment. It is not installed here and is pre-1.0. OpenCode's server and SDK are stronger building blocks for a custom integration, but they require more engineering.

## Route summary

| Setup | Route | Current status | Best fit | Main limit |
| --- | --- | --- | --- | --- |
| Lowest | `opencode run` child process | Available now | Bounded worker tasks from Codex or Claude Code | Process lifetime, permissions, and result handling remain the caller's job |
| Lowest | T3 built-in OpenCode provider | Enabled and ready | Human-hosted OpenCode threads with visible history | This Codex thread has no T3 thread-control tool |
| Medium | `acpx` driving `opencode acp` | Supported design, not installed | Cross-harness session control | Pre-1.0; local compatibility and permission flows are untested |
| Medium to high | OpenCode server and SDK wrapper | First-party building blocks | A durable custom control plane | Dispatch, isolation, policy, cleanup, and return contracts must be built |
| High | OpenCode GitHub Action | Supported | Issue and PR automation | External, slow, and specialized to GitHub workflows |
| High | T3 internal orchestration HTTP API | Present in source, not a public worker CLI | Possible future bridge | Internal, version-sensitive, and credential-sensitive |

## 1. Direct `opencode run`

OpenCode documents its CLI as a programmatic interface. Its `run` command is explicitly intended for scripting and automation. It accepts a model, an agent, a session to continue, an attached server, and JSON output. See the official [OpenCode CLI documentation](https://opencode.ai/docs/cli/).

Two OpenCode binaries are installed. On 2026-08-28, one Codex shell resolved the npm/NVM binary at version `1.18.25`, while the host-research shell resolved the Homebrew binary at version `1.0.219`. On 2026-08-29, a new Codex shell also resolved the Homebrew binary. Both versions expose the relevant `run` options, but bare-command resolution is not stable across these sessions:

```text
opencode run [message..]
--continue
--session <id>
--model <provider/model>
--agent <agent>
--format default|json
--file <path>
--attach <url>
```

This makes a bounded worker possible from any harness with shell access:

```text
orchestrator -> child process: opencode run --model ... --format json
             <- stdout: event stream and final result
```

This is a **true current route**, not only an engineering possibility. The companion [native-route report](opencode-native-routes-2026-08-28.md) records a successful end-to-end GLM-5.3-Flash probe through the `1.18.25` binary. This host-route investigation did not send another model request.

Practical limits:

- The orchestrator must keep or recover the session ID for later turns.
- The orchestrator must define permissions and handle any question or approval pause.
- The task should run in an isolated worktree or directory with a strict return contract.
- The process is tied to the caller unless it attaches to a separately managed OpenCode server.
- A visible, durable terminal is still useful for long AFK work, but Orca is not required for a one-shot worker.

## 2. T3 Code has first-party OpenCode support

T3's official install guide says that T3 supports OpenCode, requires an installed and authenticated `opencode`, and keeps the provider off until it is enabled in Settings. See [T3 Code installation and provider setup](https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md). Its provider architecture also lists `opencode` as a built-in driver. See [T3 provider internals](https://github.com/pingdotgg/t3code/blob/main/docs/internals/providers.md).

The source for the installed T3 version shows the full lifecycle:

- [`OpenCodeDriver.ts`](https://github.com/pingdotgg/t3code/blob/badae6a5cc8325dcd5a145bea6f7b8ac692818a1/apps/server/src/provider/Drivers/OpenCodeDriver.ts) registers a built-in OpenCode driver. It can launch a local server or use a configured server URL.
- [`opencodeRuntime.ts`](https://github.com/pingdotgg/t3code/blob/badae6a5cc8325dcd5a145bea6f7b8ac692818a1/apps/server/src/provider/opencodeRuntime.ts) starts the OpenCode server process and creates an SDK client.
- [`OpenCodeAdapter.ts`](https://github.com/pingdotgg/t3code/blob/badae6a5cc8325dcd5a145bea6f7b8ac692818a1/apps/server/src/provider/Layers/OpenCodeAdapter.ts) implements session creation, resume, fork, asynchronous prompts, events, abort, permissions, and questions.
- [`settings.ts`](https://github.com/pingdotgg/t3code/blob/badae6a5cc8325dcd5a145bea6f7b8ac692818a1/packages/contracts/src/settings.ts) defines OpenCode enablement, binary path, server URL, and password settings.

Local evidence:

- T3 Code reports version `0.0.34`.
- Its settings have the `opencode` provider enabled.
- Its provider cache reports `ready` and `authenticated`.
- The cached model list includes `opencode-go/glm-5.3-flash` and `opencode-go/deepseek-v4-flash`.
- During the check, a live T3-launched process used `/opt/homebrew/bin/opencode serve` on a loopback port.

The following read-only commands produced that evidence. They select only non-secret fields. No password, token, or API key was read or printed.

```sh
/usr/libexec/PlistBuddy \
  -c 'Print :CFBundleShortVersionString' \
  '/Applications/T3 Code (Alpha).app/Contents/Info.plist'

jq '{providerInstances: {
  opencode: {
    enabled: .providerInstances.opencode.enabled,
    binaryPath: .providerInstances.opencode.binaryPath,
    serverUrl: .providerInstances.opencode.serverUrl
  }
}}' ~/.t3/userdata/settings.json

jq '{
  enabled,
  installed,
  version,
  status,
  authStatus: .auth.status,
  checkedAt,
  matchingModels: [
    .models[].slug
    | select(
        . == "opencode-go/glm-5.3-flash"
        or . == "opencode-go/deepseek-v4-flash"
      )
  ]
}' ~/.t3/caches/opencode.json

ps -axo pid=,command= | rg 'opencode serve'
```

The exact local sources were `/Applications/T3 Code (Alpha).app/Contents/Info.plist`, `~/.t3/userdata/settings.json`, `~/.t3/caches/opencode.json`, and the live process table.

There is one version uncertainty. T3's cache reports OpenCode version `1.18.25`, but T3 has no explicit binary path and the process observed during this check used the Homebrew `1.0.219` binary. One Codex shell resolved the npm/NVM `1.18.25` binary on 2026-08-28, while another resolved Homebrew `1.0.219` on 2026-08-29. The cache can be stale or can describe a different resolved binary. Set or verify T3's binary path before the first worker test. Do not treat the cached version or a prior shell resolution as proof of the live binary version.

### Why this session still cannot dispatch to it

The T3 tools exposed to this Codex session are only `mcp__t3_code__preview_*` browser tools. There is no exposed command to create a provider thread, send a thread turn, inspect its events, or answer its approvals. The Codex `spawn_agent` feature creates Codex-native agents. It does not ask T3 to start an OpenCode provider thread.

This matches the T3 MCP source. [`McpHttpServer.ts`](https://github.com/pingdotgg/t3code/blob/badae6a5cc8325dcd5a145bea6f7b8ac692818a1/apps/server/src/mcp/McpHttpServer.ts) registers the preview-browser toolkit, not thread orchestration tools.

T3 does have an authenticated internal orchestration API:

- [`orchestration/http.ts`](https://github.com/pingdotgg/t3code/blob/badae6a5cc8325dcd5a145bea6f7b8ac692818a1/apps/server/src/orchestration/http.ts) exposes snapshots and authenticated dispatch.
- [`orchestration.ts`](https://github.com/pingdotgg/t3code/blob/badae6a5cc8325dcd5a145bea6f7b8ac692818a1/packages/contracts/src/orchestration.ts) defines commands such as `thread.create`, `thread.turn.start`, interrupt, approval, and user-input response.
- [`bin.ts`](https://github.com/pingdotgg/t3code/blob/badae6a5cc8325dcd5a145bea6f7b8ac692818a1/apps/server/src/bin.ts) does not expose those thread commands as a public CLI.

A custom T3 API client is therefore an **engineering possibility**, not a supported current route. It would depend on internal APIs and sensitive local credentials. It should not be the first choice.

## 3. ACP and `acpx`

OpenCode has first-party Agent Client Protocol support. Its official ACP guide says that clients can launch `opencode acp` and communicate over the protocol. It gives Zed and JetBrains examples. See the [OpenCode ACP documentation](https://opencode.ai/docs/acp/). The installed `opencode` binary also exposes the `acp` command.

Neither the current Codex session nor the documented Claude Code and T3 provider surfaces expose a general ACP client. ACP becomes useful through a control plane such as [`acpx`](https://github.com/openclaw/acpx). Its official repository describes a headless ACP client for orchestrators with persistent sessions, one-shot calls, permission control, machine-readable output, cancellation, history, and working-directory selection. Its [agent registry](https://github.com/openclaw/acpx/blob/main/docs/agents.md) includes OpenCode and starts it through the ACP command.

`acpx` is not installed on this machine. It is also pre-1.0. This is a **supported route after setup**, but it still needs a focused smoke test for:

- the installed OpenCode version;
- `opencode-go/glm-5.3-flash` and `opencode-go/deepseek-v4-flash` selection;
- permission and question handling;
- resume, cancel, and timeout behavior;
- stable machine-readable final output;
- worktree isolation.

If those checks pass, `acpx` is a better shared abstraction than teaching every orchestrator a custom OpenCode HTTP protocol.

## 4. OpenCode server and SDK

OpenCode publishes a first-party HTTP server and a type-safe JavaScript/TypeScript SDK:

- [`opencode serve`](https://opencode.ai/docs/server/) exposes an OpenAPI service with session create, list, get, fork, abort, messages, synchronous and asynchronous prompts, permission replies, and events. It supports password protection.
- The [OpenCode SDK](https://opencode.ai/docs/sdk/) can start a server and client together or connect to an existing server.

This is a valid foundation for a durable controller. T3 itself uses this design. It is not a ready orchestration route by itself. A wrapper must still own authentication, task dispatch, permission policy, question escalation, isolation, timeouts, cleanup, event persistence, and the worker return contract.

Build this only if `opencode run` and ACP do not provide the needed lifecycle.

## 5. GitHub Actions

OpenCode has a first-party [GitHub integration](https://opencode.ai/docs/github/). It can respond to `/opencode` or `/oc` comments and supports issue, pull request, schedule, and `workflow_dispatch` events.

This is a **true route for repository automation**. It is not a good local worker transport. It adds CI latency, secrets, workflow setup, and external GitHub mutations. Human-facing comments also require Derek's explicit approval under the global communication rule. A controlled `workflow_dispatch` avoids the human-comment trigger, but it is still an external write.

## Unsupported or non-equivalent routes

### Direct Codex provider for these OpenCode Go models

Codex custom model providers support only `wire_api = "responses"` in the official [Codex configuration reference](https://developers.openai.com/codex/config-reference/). OpenCode Go documents both GLM-5.3-Flash and DeepSeek V4 Flash on its `/v1/chat/completions` endpoint. See the official [OpenCode Go model and endpoint table](https://opencode.ai/docs/go/).

Direct Codex use of these exact models is therefore unsupported today. Even if a compatible model endpoint existed, direct model access would bypass the OpenCode harness and would not create an OpenCode worker.

### Claude Code native workers

Claude Code's documented programmatic CLI can run Claude non-interactively and resume Claude sessions. Its gateway configuration routes Claude model traffic. Neither feature is a native OpenCode or ACP client. See the official [Claude Code CLI reference](https://docs.anthropic.com/en/docs/claude-code/cli-usage) and [LLM gateway configuration](https://docs.anthropic.com/en/docs/claude-code/llm-gateway).

A Claude Code orchestrator can still run `opencode run` or `acpx` as a child process. That is external process control, not a Claude subagent route.

### MCP alone

OpenCode can consume MCP servers. That does not make the OpenCode agent itself an MCP worker service. ACP, the OpenCode HTTP API, or a subprocess wrapper is the relevant control boundary.

## Recommended rollout

1. Re-run the T3 OpenCode provider check. Then create one manual T3 OpenCode thread with each target OpenCode Go model. This verifies the already-installed host route.
2. Run one low-risk, read-only `opencode run` pilot in an isolated worktree. Use an exact model slug and JSON output. Capture the session ID, exit status, final result, and any permission pause.
3. Install and test `acpx` only after the direct CLI pilot. Use the installed `opencode acp` command explicitly if its built-in registry command selects a different package or version.
4. Add an OpenCode SDK controller only if ACP cannot meet the required session, approval, cancellation, and durability behavior.
5. Update the orchestration skill after the smoke tests. The statement that T3 has no direct OpenCode route is now stale. The correct statement is: T3 can host OpenCode directly, but this Codex session cannot programmatically control T3 provider threads with its currently exposed tools.

## Verification limits

- No OpenCode model request was sent.
- No subscription quota was used.
- No T3 OpenCode thread was created.
- `acpx` was not installed or executed.
- The internal T3 orchestration API was not called.
- No repository, GitHub, or external communication write was made.
- Local evidence is a snapshot from 2026-08-28 and can change with app, CLI, authentication, or provider updates.
