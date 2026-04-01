# CLI Application Quality Criteria

Evaluation rubric for command-line tools and terminal applications (Rust, Go, Python, Node.js CLIs). Customize weights during `/harness setup`.

## Dimensions

### 1. Usability (Weight: High)

Is the CLI intuitive? Can a user figure out how to use it from `--help` alone? Are commands named logically? Is the output formatted for human readability?

| Score | Description |
|-------|-------------|
| 1 | No help text. Cryptic command names. Unclear output. |
| 2 | Basic help exists but incomplete. Some commands confusing. |
| 3 | Adequate help and naming. User can get by with some trial and error. |
| 4 | Good discoverability. Clear help, logical command hierarchy, examples. |
| 5 | Excellent UX. Tab completion, contextual suggestions, progressive disclosure. |

### 2. Correctness (Weight: High)

Does the tool produce correct output for all inputs? Are edge cases handled? Does it fail gracefully with actionable error messages?

| Score | Description |
|-------|-------------|
| 1 | Produces wrong output or crashes on basic input. |
| 2 | Works for simple cases. Crashes or gives wrong results on edge cases. |
| 3 | Correct for all documented use cases. Some edge cases unhandled. |
| 4 | Handles edge cases well. Good error messages. Predictable behavior. |
| 5 | Bulletproof. Every input produces correct output or a helpful error. |

### 3. Error Handling (Weight: High)

When things go wrong, does the user know what happened and what to do? Error messages should be actionable, not just "error: failed".

| Score | Description |
|-------|-------------|
| 1 | Stack traces or cryptic errors. No guidance. |
| 2 | Some error messages but not actionable. Missing context. |
| 3 | Errors explain what went wrong. Some guidance on fixing. |
| 4 | Clear errors with context and suggested fix. Exit codes are meaningful. |
| 5 | Excellent error UX. Errors include the command to fix the issue, links to docs. |

### 4. Output Design (Weight: Medium)

Is the output designed for both humans and machines? Can it be piped? Is there a `--json` flag? Are colors and formatting used well (not just for decoration)?

| Score | Description |
|-------|-------------|
| 1 | Unstructured output. Can't be piped or parsed. |
| 2 | Basic text output. No structured format option. |
| 3 | Readable output. JSON flag available for some commands. |
| 4 | Well-designed output. Human-readable default, JSON for machines. Progress bars for long ops. |
| 5 | Beautiful output. Colors used meaningfully, tables aligned, progress feedback, piping works cleanly. |

### 5. Performance (Weight: Medium)

Startup time, execution speed, memory usage. CLIs should feel instant for simple operations.

| Score | Description |
|-------|-------------|
| 1 | Unusably slow. Multi-second startup. |
| 2 | Noticeable lag on simple commands. |
| 3 | Acceptable speed. No major bottlenecks. |
| 4 | Fast. Complex operations show progress. Simple ops are instant. |
| 5 | Optimized. Streaming output, efficient I/O, minimal dependencies. |

### 6. Configuration (Weight: Low)

Does the tool handle config files, environment variables, and flag precedence correctly? (flag > env > config file > default)

| Score | Description |
|-------|-------------|
| 1 | No configuration support. Everything hardcoded or flag-only. |
| 2 | Basic config file but inconsistent precedence. |
| 3 | Config file + env vars + flags work. Precedence is correct. |
| 4 | Good config UX. `init` command, validation, helpful defaults. |
| 5 | Excellent. Config discovery, migration between versions, dry-run to show resolved config. |

## Optional Dimensions

- **Idempotency**: Can commands be safely re-run without side effects?
- **Documentation**: Man pages, examples in help, README quality
- **Cross-platform**: Works on macOS, Linux, Windows without issues
- **Shell Integration**: Completion scripts, aliases, shell hooks
