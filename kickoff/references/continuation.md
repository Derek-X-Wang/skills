# Continuation policy

Use this policy after recall when the human asks for a plan or authorizes execution. Apply the first proven-compatible outcome in this order; do not skip ahead merely because a later route is easier to automate.

## 1. Continue in the current session

Stay only when the current session is a direct user or orchestrator session, never a worker, subagent, sidechain, or background session, and it already has the correct task, repository, workspace, instructions, permissions, and ownership. If execution is authorized, report the compact preflight result and begin the requested work in the same turn.

Dirty state is compatible only when the changes are demonstrably part of this task and no other active editor owns the workspace. Preserve all unrelated or uncertain changes.

## 2. Focus an exact active session

Focus automatically only when all of these are proven from live state:

- the exact session identity, not merely the same harness or similar title;
- the same task, repository, branch or worktree, and compatible code state;
- a currently active session handle and reliable focus return path;
- a direct user session, never a worker, subagent, sidechain, or background session;
- no conflicting editor or ownership claim.

If any identity is ambiguous, show the few best candidates and ask once. Require a fresh `$kickoff <execute-mode> focus <opaque-session-key>` reply before acting. When several dormant sessions contain complementary evidence, synthesize them into a fresh handoff instead of choosing one by recency.

## 3. Start fresh in the correct existing workspace

Use a fresh session when the workspace is compatible but no exact active session is proven. Dormant sessions are context sources only; do not invoke native resume. Build a bounded handoff from the relevant evidence.

Always load `agent-orchestration` to validate route feasibility, authority, ownership, and the return path before starting a fresh session. An explicit human choice of destination model or harness constrains its selection and wins when feasible; otherwise let it select the model, harness, host, control plane, and route. Tell it that Orca is the human's current preferred control plane. If Orca cannot perform the selected action, present one verified alternative and require `$kickoff <execute-mode> confirm route <verified-route>` before switching.

## 4. Create an approved isolated worktree

Use an isolated worktree only for an existing repository when the current workspace is missing, incompatible, owned by another editor, or dirty with unrelated or uncertain changes.

Before constructing the proposal, load `agent-orchestration` and any operational sources it requires to select a verified model, harness, host, control plane, and route without launching anything. Then show:

- repository and clean base ref;
- new branch and absolute worktree path;
- setup behavior and any expected machine or network effects;
- destination session action and the control plane that will perform it.

Require the human to approve that exact proposal with `$kickoff worktree approve <repository> <base-ref> <branch> <absolute-path>`. After that target-specific reply, use the applicable operational skill for mechanics. Discover current commands from the live tool or skill; do not invent or preserve volatile commands here. Verify the resulting worktree and session identities before reporting success.

Never create an initial commit merely to make worktree creation possible. If the existing repository lacks a usable base ref, return `bootstrap-required`.

## 5. Return `bootstrap-required`

Return this outcome when no suitable existing repository exists or the repository lacks a valid base for an approved worktree. Name what is missing and recommend the appropriate project-setup workflow. Do not initialize Git, create or attach a remote, make an initial commit, push, or install skills.

## Authority and failure handling

Recall and inspect modes stop after history findings. Check, plan, and preflight modes apply this policy read-only and stop before session or workspace mutations. Start, continue, resume, and launch modes authorize the existing-workspace actions in steps 1 through 3; the word `resume` does not authorize dormant native resume. Step 4 always needs a separate target-specific `$kickoff worktree approve ...` invocation.

Continue after absent stores, unsupported schemas, or bounded-search exhaustion when the available evidence remains useful. Use the exact `PARTIAL` wording from `SKILL.md`. Block only when the human explicitly required the missing harness or route.

Treat focus, launch, and worktree creation as claims until verified from live structured state. On a failed action, preserve the current workspace and evidence, report the failure, and offer the next safe outcome in the fixed order. If proceeding needs a human selection, confirmation, or approval, require a new reply that explicitly begins with `$kickoff`; do not act on an ordinary follow-up. Do not silently switch control planes or widen authority.

If `agent-orchestration` cannot satisfy this contract, report the exact integration gap to the human. Do not edit that skill.
