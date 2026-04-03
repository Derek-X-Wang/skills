---
name: fuelcheck
description: Check AI subscription usage (Claude, Codex, Gemini, Antigravity) from the terminal using fuelcheck. Use when the user asks about rate limits, usage, remaining quota, fuel, credits, how much they've used, or wants to check their AI subscription status.
---

# Fuelcheck

Check AI subscription usage across Claude, Codex, Gemini, and Antigravity from the terminal.

## Pre-flight

Before running any fuelcheck command, verify it's installed:

```bash
command -v fuelcheck
```

If NOT found, tell the user:

> fuelcheck is not installed. Install it with:
> ```bash
> curl -fsSL https://github.com/emanuelarcos/fuelcheck/releases/latest/download/install.sh | sh
> ```
> Or if you have Go: `go install github.com/emanuelarcos/fuelcheck/cmd/fuelcheck@latest`

Then STOP — do not proceed until the user installs it.

## Commands

### Check all providers

```bash
fuelcheck --json
```

Parse the JSON output to give the user a clear summary of their usage across all providers.

### Check specific provider(s)

```bash
fuelcheck claude --json
fuelcheck codex --json
fuelcheck gemini --json
fuelcheck antigravity --json
fuelcheck claude codex --json   # multiple providers
```

### Interpreting results

The JSON output contains per-provider results. Key fields:

- **Claude**: `five_hour` and `weekly` usage windows with `utilization` percentage
- **Codex**: `five_hour` and `weekly` usage windows with `utilization` percentage
- **Gemini**: Per-model tier quotas (Flash, Pro) with usage counts
- **Antigravity**: Per-model quotas with usage counts

When reporting to the user:
- Show utilization as percentages
- Flag any provider above 80% usage as approaching the limit
- If a provider returns an error, explain likely causes (not logged in, app not running, etc.)
- Keep the summary concise — the user wants a quick glance, not a wall of text

### Provider prerequisites

| Provider | Requirement |
|----------|------------|
| Claude | Logged into Claude Code |
| Codex | Logged into Codex CLI |
| Gemini | Logged into Gemini CLI |
| Antigravity | Desktop app must be running |

If a provider fails, mention the prerequisite so the user knows how to fix it.

## Always use --json

Always pass `--json` when running fuelcheck so you can parse structured output. The terminal UI mode is for human eyes only — you cannot parse lipgloss-styled cards.
