---
name: github
description: Interact with GitHub PRs, issues, and comments using the gh CLI. Use when fetching PR details, review comments, or working with GitHub data.
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
