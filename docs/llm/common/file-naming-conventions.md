# File and Package Naming Conventions

> Naming conventions for plugins, skills, agents, and the files inside them

## Directory Naming

**Rules**:

- Use kebab-case for every directory: plugins, skills, agents, hooks.
- A plugin directory name MUST match the `name` in its `plugin.json` and the `name` of
  its entry in `.claude-plugin/marketplace.json`.
- A skill directory name MUST match the `name` in its `SKILL.md` frontmatter. That name
  is what users type as `/<plugin>:<skill>`, so it is a public interface — renaming it
  is a breaking change.
- Keep the fixed Claude Code layout: `.claude-plugin/`, `skills/`, `agents/`, `hooks/`,
  `commands/`. Do not invent sibling directories for plugin surface.
- Supporting content lives under the skill that owns it: `skills/<skill>/references/`,
  `scripts/`, `assets/`.

## File Naming

**Rules**:

- `SKILL.md` and `plugin.json` are fixed names — never rename them.
- Agent files are named for the agent they define, kebab-case:
  `agents/work-item-code-review.md` defines `<plugin>:work-item-code-review`.
- Reference files are named for the task they answer, not the artefact they describe:
  `create-work-item.md`, `query-work-items.md`.
- Scripts use `.mjs` and kebab-case, named for what they do: `validate-summary.mjs`.
- Tests sit next to what they test: `render-box.mjs` → `render-box.test.mjs`.
- Filenames MUST match at least one export or the single responsibility of the file.

**Forbidden**:

- Generic names: `util(s)`, `common`, `shared`, `helper(s)`, `misc`, `notes`, `temp`.
- Ambiguous reference names: `jira.md`, `stuff.md`, `other.md`.
- Version or status in a filename: `skill-v2.md`, `new-README.md`, `SKILL.old.md`. Use
  git history and the plugin `version` field instead.

## Anti-Patterns

**NEVER**:

- Export multiple unrelated things from a single script file (creates "dumping grounds").
- Put instruction content in a file the harness will not load — a skill's behaviour must
  be reachable from `SKILL.md`, directly or by an explicit reference link.
- Duplicate a reference between plugins. Extract or link; two copies drift.
