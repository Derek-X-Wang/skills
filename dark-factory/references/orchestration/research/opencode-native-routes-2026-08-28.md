# OpenCode native orchestration routes

Research date: 2026-08-28
Follow-up validation: 2026-08-29
Installed version checked: OpenCode 1.18.25
Source snapshot checked: [`v1.18.25`](https://github.com/anomalyco/opencode/tree/v1.18.25) (`cb7d8b2f5e44876ef98b661dc10590c915af3a9f`)

## Answer

Orca does not need to open a separate terminal to start an OpenCode worker. The simplest current route is a normal child process:

```bash
opencode run \
  --dir /absolute/worker/worktree \
  --model opencode-go/glm-5.3-flash \
  --format json \
  "<dispatch>"
```

`opencode run` is an official non-interactive command for scripts and automation. It starts an in-process OpenCode server, streams the run, and exits when the session becomes idle. It does not open the TUI or require a separate terminal. The command supports a fixed directory, model, agent, files, JSON events, session continuation, session forking, and a long-lived server attachment. [CLI documentation](https://opencode.ai/docs/cli/#run) and [1.18.25 command source](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/cli/cmd/run.ts)

For a durable integration, OpenCode also has a headless HTTP server and a supported JavaScript/TypeScript SDK. ACP is another direct child-process route, but it needs an ACP client. `opencode attach` by itself is an interactive TUI and is not a headless dispatch route.

OpenCode Go also exposes direct model endpoints. Those endpoints provide model access only. They do not run the OpenCode harness, its agent loop, tools, permissions, `AGENTS.md`, or sessions. The distinction is:

```text
OpenCode worker
  orchestrator -> opencode run / server / SDK / ACP -> OpenCode harness -> Go model

Direct model call
  orchestrator or another harness -> OpenCode Go API -> Go model
```

[OpenCode Go says it can be used with OpenCode or any agent](https://opencode.ai/go), and its [endpoint table](https://opencode.ai/docs/go/#endpoints) documents the direct APIs.

## Route comparison

| Route | Uses OpenCode harness | Usable from a Codex or Claude shell now | Bridge code | Multi-turn state | Result channel | Current judgment |
| --- | --- | --- | --- | --- | --- | --- |
| `opencode run` | Yes | Yes | None | `--session`, `--continue`, or `--fork` | Text or NDJSON on stdout; exit status | Best first route |
| `opencode run --attach` | Yes | Yes, after starting `opencode serve` | Process lifecycle only | Same session flags | NDJSON/text plus server session APIs | Useful for repeated work, but see the stdout caveat |
| Headless HTTP API | Yes | Yes | Small HTTP client or shell script | Persistent server sessions | Synchronous response, polling, or SSE | Best durable control plane |
| Official JS/TS SDK | Yes | Yes | Small Bun/Node program | Persistent server sessions | Typed response objects and SSE | Best typed integration |
| ACP over stdio | Yes | Only with an ACP client | ACP client or compatible editor | New and loaded sessions | JSON-RPC responses and session updates | Valid, but more work than `run` |
| `opencode attach` | Yes | Technically, but needs an interactive terminal | None | Persistent sessions | Interactive TUI | Not a headless orchestrator route |
| Direct OpenCode Go API | No | Yes | Raw HTTP or a compatible model client | Client must resend conversation state | Provider HTTP response or stream | Model access, not an OpenCode worker |
| V2 embedded SDK | Yes | Yes, from a JS host | Application code and beta dependency | Hosted sessions | In-process typed API | Promising, but beta |

## 1. Non-interactive CLI: recommended first route

The official command is:

```bash
opencode run [message..]
```

Important flags are:

```text
--dir <absolute path>
--model opencode-go/<model-id>
--agent <primary-agent-name>
--format json
--session <session-id>
--continue
--fork
--file <path>
--auto
```

The prompt can also arrive on stdin. OpenCode appends piped input to the positional message. This is useful when a dispatcher wants to avoid shell quoting. The command emits newline-delimited JSON when `--format json` is set. Each event contains a `type`, timestamp, `sessionID`, and event data. Text arrives as `type: "text"`. Tool calls, step boundaries, and errors have separate event types. A session error sets a non-zero exit status. [1.18.25 run implementation](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/cli/cmd/run.ts#L263-L448) and [event/output implementation](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/cli/cmd/run.ts#L670-L877)

A dispatcher should treat success as all of the following:

1. The child process exited with zero.
2. The NDJSON stream has no `error` event.
3. The expected terminal text or worker return contract is present.
4. The expected repository evidence is present.

### AFK permissions

Non-interactive runs explicitly deny the `question`, `plan_enter`, and `plan_exit` permissions. Other permission requests are rejected by default. `--auto` approves requests that are not explicitly denied. The CLI labels this option as dangerous. A dedicated OpenCode worker agent with bounded permissions is safer than applying `--auto` to an unbounded dispatch. [Permission rules in the 1.18.25 command](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/cli/cmd/run.ts#L430-L448) and [permission response loop](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/cli/cmd/run.ts#L801-L820)

This behavior fits the existing worker rule that decisions should be made before AFK dispatch. It also means the worker cannot pause and ask Derek a question.

### Persistence and continuation

Every run creates or resumes an OpenCode session. The JSON stream exposes the session ID. Later calls can use `--session <id>`, `--continue`, or `--fork`. OpenCode also supports JSON session listing and JSON export. [CLI session and export documentation](https://opencode.ai/docs/cli/#session)

### Live result

The installed 1.18.25 CLI completed this command successfully:

```bash
opencode run \
  --format json \
  --model opencode-go/glm-5.3-flash \
  --dir <clean-temporary-directory> \
  "Reply with exactly OPENCODE_RUN_READY. Do not use tools."
```

It emitted `step_start`, `text`, and `step_finish` events. The text was `OPENCODE_RUN_READY`. The run used the existing OpenCode Go credential. The temporary session was deleted after the check.

DeepSeek V4 Flash did not complete on this account. The Go gateway returned HTTP 403 and required explicit consent for China-hosted processing. I did not change that consent. This is an account/data-location gate, not a failure of `opencode run`.

### Follow-up validation on 2026-08-29

A Codex session hosted by T3 Code used the explicit OpenCode 1.18.25 executable to run a read-only GLM-5.3-Flash review from an isolated temporary directory. The shell default resolved to a separate Homebrew OpenCode 1.0.219 executable, which confirms that route validation must check the resolved binary and version instead of trusting a host cache or bare command name.

The first review turn emitted a session ID and completed its internal reasoning, but it did not emit final text before the orchestrator's timeout. The orchestrator stopped that process and did not count it as success. A later call resumed the explicit session ID, returned the requested review text, emitted a normal finish event, and exited with zero. This confirms the explicit-session follow-up route. It also confirms that process completion, final output, and the return contract must all be checked before a one-shot result is accepted.

## 2. Long-lived server and `run --attach`

Start a headless backend:

```bash
OPENCODE_SERVER_PASSWORD="<server-password>" \
  opencode serve --hostname 127.0.0.1 --port 4096
```

Then run a normal non-interactive request against it:

```bash
opencode run \
  --attach http://127.0.0.1:4096 \
  --dir /absolute/worker/worktree \
  --model opencode-go/glm-5.3-flash \
  --format json \
  "<dispatch>"
```

OpenCode documents this route as a way to avoid MCP cold starts on every run. The server can use HTTP Basic authentication. This server password protects the OpenCode control API. It is separate from the OpenCode Go provider key. [CLI attachment example](https://opencode.ai/docs/cli/#run) and [server authentication](https://opencode.ai/docs/server/#authentication)

This route still needs a managed server process. It does not need a user-visible terminal. A Codex or Claude orchestrator can start and retain the process itself, or a local service can own it.

### Live caveat in 1.18.25

A live `run --attach` probe completed the GLM request and persisted the expected assistant reply. However, that invocation returned zero with empty stdout. Reading the session through the server API showed `OPENCODE_ATTACH_READY`. The source starts an event listener but does not await its completion in attach mode. This can create an output race. [Attach completion branch](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/cli/cmd/run.ts#L833-L877)

Use one of these choices until this behavior is retested or fixed:

- Prefer plain `opencode run` for one-off dispatch.
- Use the HTTP or SDK session response as the authority.
- If using `run --attach`, fetch the session messages before declaring success.

## 3. Headless HTTP API

`opencode serve` publishes an OpenAPI 3.1 specification at `/doc`. The official server API supports:

- creating, reading, forking, aborting, and deleting sessions;
- sending a prompt and waiting for the assistant response;
- submitting a prompt asynchronously;
- reading session messages and diffs;
- checking session status;
- responding to permission requests;
- subscribing to server-sent events.

[Official server architecture and OpenAPI endpoint](https://opencode.ai/docs/server/#how-it-works) and [session/message API table](https://opencode.ai/docs/server/#messages)

For a synchronous worker, the core sequence is:

```text
POST /session
POST /session/{id}/message
GET  /session/{id}/message
GET  /session/{id}/diff
```

The message request selects `model.providerID = "opencode-go"` and a model ID such as `glm-5.3-flash`. It also sends text or file parts. The synchronous endpoint returns the assistant message and its parts. The asynchronous endpoint returns only `204 No Content`. A dispatcher that uses the asynchronous endpoint must follow SSE, session status, and messages. It must not treat HTTP 204 as task completion. [Official message API](https://opencode.ai/docs/server/#messages)

The live 1.18.25 server exposed OpenAPI 3.1.1. Its provider response listed `opencode-go` as connected. This proves that a locally started server can use the already configured OpenCode Go credential.

## 4. Official JavaScript and TypeScript SDK

The supported package is:

```bash
npm install @opencode-ai/sdk
```

Two modes are available:

```javascript
import { createOpencode } from "@opencode-ai/sdk"

const { client, server } = await createOpencode()
```

`createOpencode()` starts `opencode serve` as a child process and returns a typed client. Alternatively, `createOpencodeClient({ baseUrl })` connects to an existing server. The client exposes typed session creation, prompting, message retrieval, permission responses, errors, and SSE events. It also supports schema-validated structured model output. [Official SDK guide](https://opencode.ai/docs/sdk/) and [1.18.25 SDK process source](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/sdk/js/src/server.ts)

This route works from a Codex or Claude shell after a small Bun or Node integration exists. It is more setup than `opencode run`, but it gives the orchestrator a stable process boundary and typed multi-turn control.

### Which process owns the Go key

- `createOpencode()` starts a local server process. That process inherits the environment and reads the normal OpenCode credential store.
- `createOpencodeClient()` is only a network client. It does not need or use the Go key itself. The server host must have the Go key.
- A remote SDK client may need the OpenCode server's Basic Auth credential. That credential is not the Go key.

The OpenCode auth layer reads `OPENCODE_AUTH_CONTENT` when present. Otherwise, it reads the global `auth.json`. Provider initialization loads API credentials from that layer. [1.18.25 auth source](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/auth/index.ts) and [provider credential loading](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/provider/provider.ts#L1578-L1622)

## 5. ACP over stdio

```bash
opencode acp --cwd /absolute/worker/worktree
```

This starts OpenCode as an ACP agent subprocess. It exchanges newline-delimited JSON-RPC over stdin and stdout. OpenCode documents support for built-in tools, project rules, MCP servers, agents, and permissions. [Official ACP guide](https://opencode.ai/docs/acp/) and [1.18.25 ACP command source](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/cli/cmd/acp.ts)

The implementation supports initialization, new sessions, loading sessions, prompting, cancellation, model selection, session updates, and permission callbacks. Prompt results and errors return through ACP protocol messages and updates. [1.18.25 ACP service](https://github.com/anomalyco/opencode/blob/v1.18.25/packages/opencode/src/acp/service.ts)

This is a real route without Orca or a terminal. It is not immediately callable through a plain shell command because the caller must implement ACP framing and callbacks. It becomes attractive if T3 Code, Claude Code, Codex, or a separate local controller gains an ACP-client adapter. Until then, `opencode run` or the SDK is simpler.

## 6. Interactive attach and TUI control

`opencode attach <url>` attaches the OpenCode TUI to a running backend. It needs an interactive terminal. It has no one-shot prompt argument. It is therefore not a replacement for headless worker dispatch. Use `opencode run --attach`, HTTP, or the SDK instead. [Official attach documentation](https://opencode.ai/docs/cli/#attach)

The server also exposes TUI control endpoints that can append and submit a prompt. OpenCode uses them for IDE integrations. These endpoints drive a connected UI. They are less deterministic than creating and prompting a known session, so they should not be the default orchestration route. [Server TUI description](https://opencode.ai/docs/server/#connect-to-an-existing-server)

## 7. Direct OpenCode Go gateway

The two current model endpoints of interest are:

| Model | Direct model ID | Endpoint | Protocol |
| --- | --- | --- | --- |
| GLM-5.3-Flash | `glm-5.3-flash` | `https://opencode.ai/zen/go/v1/chat/completions` | OpenAI-compatible Chat Completions |
| DeepSeek V4 Flash | `deepseek-v4-flash` | `https://opencode.ai/zen/go/v1/chat/completions` | OpenAI-compatible Chat Completions |

The catalog endpoint is:

```text
https://opencode.ai/zen/go/v1/models
```

These values come from the [official Go endpoint table](https://opencode.ai/docs/go/#endpoints).

A raw call has this shape:

```bash
curl https://opencode.ai/zen/go/v1/chat/completions \
  -H "Authorization: Bearer ${OPENCODE_GO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-5.3-flash",
    "messages": [{"role": "user", "content": "<prompt>"}],
    "stream": false
  }'
```

The same Go API key stored for the `opencode-go` provider authenticated a live direct GLM request. The response used the expected OpenAI-compatible shape. Do not print, copy into a prompt, or expose the stored credential while building this route.

This direct API can provide intelligence to another coding harness. It cannot make the model an OpenCode worker by itself. The client or other harness must implement the coding-agent loop, tool schemas, tool execution, permissions, repository context, conversation state, and error recovery. Raw Chat Completions is stateless from the orchestrator's perspective, so the client must send the relevant message history on each turn.

## 8. Beta embedded V2 SDK

OpenCode also documents a beta V2 SDK that hosts OpenCode directly inside a JavaScript application. It runs the server router in memory and opens no HTTP listener. The current instructions use `@opencode-ai/sdk@dev`, and the API may change before a stable release. [Official V2 SDK overview](https://opencode.ai/v2/docs/build/sdk)

This can become the cleanest custom orchestration route because it avoids both a terminal and a network server. It is not the recommended default yet because it is beta and requires application code.

## Authentication summary

| Interface | How OpenCode Go authentication works |
| --- | --- |
| Local `opencode run` | The OpenCode process reads the existing `opencode-go` API credential. |
| `opencode serve` | The server process reads the credential available to its user or environment. |
| `opencode run --attach` | The remote server owns the Go key. The attaching client may separately send server Basic Auth. |
| `createOpencode()` | Its child server inherits the local environment and reads normal OpenCode auth. |
| `createOpencodeClient()` | The client does not own provider auth. The target server does. |
| `opencode acp` | The OpenCode ACP subprocess reads normal OpenCode auth. |
| Direct Go API | The caller sends the Go API key as a bearer credential. |

The official CLI stores provider credentials in `~/.local/share/opencode/auth.json` and loads them when OpenCode starts. [CLI authentication documentation](https://opencode.ai/docs/cli/#auth) The report records the location because it is official behavior. Automation should not read or print the file unless a dedicated integration requires it and handles it as a secret.

## Recommended routing update

Use this order:

1. Use `opencode run` for one bounded OpenCode worker or reviewer.
2. Give the worker a separate worktree even though it does not need a separate terminal.
3. Parse NDJSON, the exit status, the worker return contract, and repository evidence.
4. Use a dedicated worker agent with bounded permissions. Add `--auto` only when the dispatch authorizes all remaining permission requests.
5. Add `opencode serve` plus the JS SDK when repeated dispatch, cancellation, event streaming, or durable session control justifies a small bridge.
6. Keep ACP as a future adapter route unless an ACP client already exists in the active control plane.
7. Use the direct Go endpoint only when the selected harness can consume an OpenAI-compatible model endpoint. Classify that as a Go model route, not an OpenCode harness route.

Orca remains useful for worktree creation, visible terminals, recovery, and an existing message return path. It is no longer a technical requirement for launching the OpenCode harness from a shell.

## Commands and checks performed

```text
opencode --version
opencode --help
opencode run --help
opencode serve --help
opencode attach --help
opencode acp --help
opencode session --help
opencode export --help
opencode import --help
opencode auth list
opencode models opencode-go
git ls-remote --tags https://github.com/anomalyco/opencode.git refs/tags/v1.18.25
opencode serve --hostname 127.0.0.1 --port 49025
GET /global/health
GET /doc
GET /provider
live GLM `opencode run --format json` probe
live GLM `opencode run --attach ... --format json` probe
live direct GLM Chat Completions probe
```

No source files were changed during the probes. Test sessions created by this research were deleted. I did not change the OpenCode Go data-location consent.

## Remaining uncertainties

- The empty stdout result from one successful `run --attach` call needs a focused regression test before that route becomes the completion authority.
- DeepSeek V4 Flash needs Derek's explicit China-hosting consent before it can run on this account. That consent is a human privacy decision.
- The V2 embedded SDK is beta. Its API may change.
- No first-party OpenCode adapter was found that lets an already running Codex or Claude conversation register OpenCode as a native in-harness subagent. Shell subprocess, HTTP, SDK, and ACP remain external-worker routes.
