# Skills

Personal collection of [Agent Skills](https://agentskills.io/) for Claude Code, Cursor, and other AI agents.

## Install

```bash
# Install all skills globally
npx skills add Derek-X-Wang/skills -g

# Install a specific skill
npx skills add Derek-X-Wang/skills --skill life-os -g
npx skills add Derek-X-Wang/skills --skill kitcn -g
npx skills add Derek-X-Wang/skills --skill convex -g
```

## Skills

| Skill | Description |
|-------|-------------|
| **agent-orchestration** | Compatibility entry for Dark Factory task orchestration; install alongside dark-factory |
| **dark-factory** | Shared task/UI orchestration and attended or unattended factory management, with personal and private Bite workflows |
| **computer-use-routing** | Compatibility entry for Dark Factory local UI routing; install alongside dark-factory |
| **kitcn** | Kitcn (formerly Better Convex) projects: cRPC, ORM, auth, and React |
| **convex** | Vanilla Convex backend-as-a-service (queries, mutations, actions, schemas) |
| **git-project-memory** | Git history research and decision-focused commit messages |
| **life-os** | Personal life OS daily operator and planning system (Obsidian vault) |
| **canvas-design** | Visual design creation for posters, art, and static pieces |
| **cmux** | cmux topology and routing control |
| **cmux-browser** | Browser automation with cmux |
| **cmux-debug-windows** | cmux debug window management |
| **cmux-markdown** | Markdown viewer panel with live reload |
| **codex-worker** | Launch, resume, and inspect headless Codex CLI workers |
| **doc-coauthoring** | Structured documentation co-authoring workflow |
| **docx** | Word document creation, editing, and analysis |
| **github** | GitHub PR, issue, and comment interaction via gh CLI |
| **grill-me** | Stress-test plans and designs through relentless questioning |
| **pdf** | PDF manipulation, extraction, and form filling |
| **pptx** | PowerPoint presentation creation and editing |
| **pr-writing** | Human-readable PR descriptions with product meaning and verification evidence |
| **manage-my-skills** | Personal skill lifecycle using the current harness creator or a portable supporting reference |
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
