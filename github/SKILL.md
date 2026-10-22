---
name: github
description: Interact with GitHub PRs, issues, and comments using the gh CLI. Use when fetching PR details or review comments, waiting for GitHub Actions CI, summarizing failed runs, or working with GitHub data.
allowed-tools: [Bash]
---

# GitHub CLI

Interact with GitHub using the `gh` CLI tool.

## PR Review Comments

### Fetch a specific comment by ID

When you have a comment URL like `https://github.com/owner/repo/pull/123#discussion_r2715128564`, extract the comment ID from `discussion_r{ID}`:

```bash
gh api repos/{owner}/{repo}/pulls/comments/{comment_id}
```

Example:

```bash
gh api repos/biteinc/maitred/pulls/comments/2715128564
```

### Fetch all PR inline comments

PR inline code comments (review comments) are at `/pulls/{pr}/comments`, NOT `/pulls/{pr}/reviews`:

```bash
# Get all comments with pagination
gh api "repos/{owner}/{repo}/pulls/{pr}/comments?per_page=100"

# Filter by user (e.g., CodeRabbit bot)
gh api "repos/{owner}/{repo}/pulls/{pr}/comments?per_page=100" \
  --jq '.[] | select(.user.login | contains("coderabbit"))'

# Get latest 5 comments sorted by date
gh api "repos/{owner}/{repo}/pulls/{pr}/comments?per_page=100" \
  --jq '.[] | select(.user.login | contains("coderabbit"))' \
  | jq -s '. | sort_by(.created_at) | reverse | .[0:5]'
```

### Fetch PR review summaries

Review summaries (the top-level review with approval/request changes) are separate from inline comments:

```bash
gh api repos/{owner}/{repo}/pulls/{pr}/reviews
```

### Key differences

| Endpoint                | Contains                                             |
| ----------------------- | ---------------------------------------------------- |
| `/pulls/{pr}/comments`  | Inline code comments on specific lines               |
| `/pulls/{pr}/reviews`   | Review summaries (approve, request changes, comment) |
| `/issues/{pr}/comments` | General PR conversation comments (not on code)       |

## Common PR Operations

```bash
# View PR details
gh pr view {pr_number} --repo {owner}/{repo}

# View PR with specific fields
gh pr view {pr_number} --repo {owner}/{repo} --json title,body,reviews,comments

# List PR files changed
gh pr diff {pr_number} --repo {owner}/{repo}

# View PR checks
gh pr checks {pr_number} --repo {owner}/{repo}
```

## Tips

- Always use `per_page=100` when fetching comments to ensure you get recent ones
- Comment IDs in URLs (`#discussion_r{ID}`) can be fetched directly via the API
- Use `jq -s` (slurp) to collect streaming JSON into an array for sorting
- CodeRabbit comments have `user.login` containing "coderabbit"

## CI runs

Use the bundled scripts with Python 3.9+ and an authenticated `gh` CLI:

```bash
scripts/ci-wait --repo OWNER/NAME --pr 123
scripts/ci-wait --sha SHA --min-runs 2
scripts/ci-wait --run RUN_ID --run OTHER_RUN_ID
scripts/ci-failures RUN_ID --repo OWNER/NAME
scripts/ci-failures RUN_ID --job 'job name' --pattern 'custom error' --max-lines 80 --tail 15
```

Resolve script paths relative to this skill. Use one poller per set, never several fast pollers. The caller may background `ci-wait`. Its interval defaults to 120 seconds and must be at least 60. PR mode freezes the head SHA once; a later push requires a new poller. SHA mode waits for at least `--min-runs` (default 1); set this to the expected count to avoid finishing before delayed workflows appear.

`ci-wait` waits up to `--appear-timeout` (900 seconds) for runs, and `--timeout` (10800 seconds) overall. API errors remain pending; rate limits and 5xx errors back off up to 600 seconds. Exit codes: 0 for success/skipped/neutral, 1 for an unsuccessful run, 3 for the poller's timeout, 2 for usage errors. The final summary includes unsuccessful jobs and their first failed step.

`ci-failures` downloads failed logs once, groups them by job and step, and prints failure signals plus step tails. The per-job line cap includes tails. `--job` matches an exact name; `--pattern` adds a regex and is repeatable. Empty logs fall back to job conclusions. Both commands accept `--help` and default the repository to `gh repo view`.

Offline tests (from the skills repo root):

```bash
python3 -m unittest discover -s github/scripts -p 'test_*.py'
```
