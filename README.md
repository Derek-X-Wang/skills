# Skills

Personal collection of [Agent Skills](https://agentskills.io/) for Claude Code, Cursor, and other AI agents.

## Install

```bash
# Install all skills globally
npx skills add Derek-X-Wang/skills -g

# Install a specific skill
npx skills add Derek-X-Wang/skills --skill life-os -g
npx skills add Derek-X-Wang/skills --skill better-convex -g
npx skills add Derek-X-Wang/skills --skill convex -g
```

## Skills

| Skill | Description |
|-------|-------------|
| **better-convex** | Framework-level Convex skill (cRPC, ORM, auth, React) from [udecode/better-convex](https://github.com/udecode/better-convex) |
| **convex** | Vanilla Convex backend-as-a-service (queries, mutations, actions, schemas) |
| **life-os** | Personal life OS daily operator and planning system (Obsidian vault) |
| **canvas-design** | Visual design creation for posters, art, and static pieces |
| **cmux** | cmux topology and routing control |
| **cmux-browser** | Browser automation with cmux |
| **cmux-debug-windows** | cmux debug window management |
| **cmux-markdown** | Markdown viewer panel with live reload |
| **doc-coauthoring** | Structured documentation co-authoring workflow |
| **docx** | Word document creation, editing, and analysis |
| **github** | GitHub PR, issue, and comment interaction via gh CLI |
| **grill-me** | Stress-test plans and designs through relentless questioning |
| **pdf** | PDF manipulation, extraction, and form filling |
| **pptx** | PowerPoint presentation creation and editing |
| **skill-creator** | Guide for creating new skills |
| **slack-gif-creator** | Animated GIF creation optimized for Slack |
| **xlsx** | Spreadsheet creation, editing, and analysis |
| **youtube-transcript** | Download YouTube video transcripts |

## Format

Each skill follows the [Agent Skills Specification](https://agentskills.io/specification):

```
skill-name/
  SKILL.md          # Required - frontmatter + instructions
  references/       # Optional - additional docs loaded on demand
  scripts/          # Optional - executable code
```

Skills live at the root level of this repo (not in a `skills/` subdirectory).
