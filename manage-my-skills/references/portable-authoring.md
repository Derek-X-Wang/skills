# Portable authoring fallback

Use only when the current harness exposes no maintained skill creator. `manage-my-skills` owns the repository and lifecycle; this reference is not a discoverable creator skill.

Create or update a directory whose `SKILL.md` starts with YAML `name` and `description`. Match the name to the directory using lowercase letters, digits, and hyphens, up to 64 characters. State what the skill does and the circumstances that should select it. Preserve optional metadata supported by the target harness; there is no universal two-field-only rule.

Keep instructions focused on decisions, constraints, and non-obvious workflow knowledge. Preserve the user's intent and authority. Add scripts for useful repeatable operations, references for conditional detail, and assets only when the output needs them. Link resources where the agent should load them. Do not create placeholder directories or impose packaging on ordinary directory installation.

For substantial workflows, optional [workflow patterns](workflows.md) and [output patterns](output-patterns.md) provide examples. They are preserved from the former personal creator under the [Apache 2.0 license](../LICENSE.txt).

Validate frontmatter, directory/name agreement, intended triggers, supported metadata, and local references. Exercise new or changed scripts and assess realistic task behavior when useful. The retained [quick validator](../scripts/quick_validate.py) provides basic structural checks if Python and PyYAML are already available; it does not prove reference integrity or behavior and its accepted fields may lag a harness. Do not remove valid native metadata just to satisfy it.

Only when a `.skill` archive is actually requested, the retained [packager](../scripts/package_skill.py) is an optional helper. Inspect its output target and inputs first; it includes every file beneath the selected skill. Run with existing dependencies, or obtain authority before installing missing dependencies. Normal `npx skills add` publication needs no archive.

The retained scripts' `uv run` usage may resolve and download their declared PyYAML dependency into an isolated environment. That dependency setup must be within the authorized task scope; it is not a global package installation and should not be replaced with one.
