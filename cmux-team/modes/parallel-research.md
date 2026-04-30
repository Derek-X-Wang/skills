# Mode: Parallel research

Multiple read-only investigators on different parts of a codebase, simultaneously. No edits — pure exploration.

## When to use

- A large codebase you don't know well, and you want to map several areas in parallel before making any changes.
- Cross-cutting research questions ("how does auth flow through the system?") that touch multiple modules and would be slow to traverse serially.
- Pre-refactor reconnaissance: figure out what's there before deciding what to change.

## When NOT to use

- Single-area exploration — just use the `Explore` agent or `Agent` with `subagent_type: "Explore"`. No team needed.
- Anything that requires writing code. Use `feature-build.md` instead.
- Questions you can answer with a few `grep`/`rg` commands. The setup overhead exceeds the value.

## Topology

```
team-lead (you, the integrator)
├── researcher-frontend
├── researcher-backend
└── researcher-infra
```

The number and naming match the natural divisions of the codebase. A monorepo's package boundaries are a good default.

## Setup sketch

1. List the areas you want investigated. One area per researcher.
2. For each area, write a precise research question — not "look at the frontend" but "trace how a click on the login button reaches the auth endpoint, listing every file involved."
3. Spawn each researcher with `subagent_type: "Explore"` (read-only) and a self-contained question.
4. Researchers report findings as final messages; lead integrates.

Worktrees are not needed (read-only). Researchers can all share the lead's checkout.

## Cross-references

- Parent: [SKILL.md](../SKILL.md)
- Related: `Explore` agent type — the single-investigator equivalent
