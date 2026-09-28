# Plugin Layout

> Where plugin content goes, and the rules each directory carries

A plugin's directory structure is fixed by Claude Code. Do not invent sibling directories
for plugin surface — content the harness does not look for is never loaded.

```
plugins/atlassian-beta/
  .claude-plugin/plugin.json   # manifest and version
  README.md                    # what a beta user reads
  LICENSE.txt
  package.json                 # supports tests only; the plugin needs no install step
  scripts/run-tests.mjs        # discovers and runs every *.test.mjs
  skills/                      # the skills
  agents/                      # subagent definitions
  hooks/                       # hook config and scripts
  commands/                    # slash commands, if any
```

`skills/`, `agents/` and `hooks/` currently hold only a `.gitkeep`. Delete it when real
content lands.

Note that `--strict` validation reads **every** `.md` file in `agents/` as an agent
definition and every `.md` in `commands/` as a command. A README in either directory fails
validation for missing frontmatter — which is why this guidance lives here instead.

## skills/

One directory per skill, kebab-case, containing a `SKILL.md` whose frontmatter `name`
matches the directory name. That name is what users type as `/atlassian-beta:<skill>`, so
it is a public interface — renaming it is a breaking change.

```
skills/<skill-name>/
  SKILL.md          # required: frontmatter (name, description) + the instructions
  references/       # optional: task-oriented detail SKILL.md links to
  scripts/          # optional: *.mjs helpers, with *.test.mjs beside them
  assets/           # optional: schemas, templates
```

A skill's behaviour must be reachable from `SKILL.md`, directly or by an explicit reference
link. Unreachable content is dead weight that still costs review.

## agents/

One markdown file per agent, kebab-case, named for the agent it defines:
`agents/work-item-code-review.md` becomes `atlassian-beta:work-item-code-review`.

Frontmatter (`name`, `description`, `model`, `color`, `tools`) is Claude Code's subagent
schema, and `tools` values are Claude Code tool names — this plugin targets Claude Code.
See the [plugins reference](https://code.claude.com/docs/en/plugins-reference#agents).

**Read-only agents stay read-only.** An agent that reviews, verifies or reports declares a
read-only allowlist (`tools: Read, Glob, Grep, Bash`) and does not get write tools added
later. The allowlist is the enforcement; a harness that silently ignored the field would
stop read-only being true.

## hooks/

```
hooks/
  hooks.json        # the hook registrations
  <hook>.mjs        # the entry point for each hook
  lib/              # shared logic, with *.test.mjs beside each module
```

Hooks run on every matching event, unprompted, in a user's own terminal. That sets the bar:

- **Emit no PII and no prompt text.** A hook that logs or forwards what the user typed is a
  bug, not a feature.
- **Fail quietly.** A hook that errors must not break the session — degrade to doing nothing.
- **Stay fast.** Hooks sit in the user's latency path.
- **Never mutate** Atlassian data or the working tree from a hook.

See the [hooks reference](https://code.claude.com/docs/en/plugins-reference#hooks).
