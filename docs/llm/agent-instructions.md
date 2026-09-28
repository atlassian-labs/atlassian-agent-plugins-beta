# Agent Instructions

IMPORTANT: When implementing or answering questions, READ ALL RELEVANT DOCUMENTATION before
proceeding. Extract topics from the user prompt and search for matching instructions below.

## How to Use These Instructions

1. Extract topics from user prompt (e.g., "adding a skill", "bumping the plugin version",
   "publishing to the beta channel")
2. Find matching instruction documents in `docs/llm/common/`
3. Read and follow those instructions
4. If no instructions exist, inform the user and use best judgement
5. For risky guesses, stop and ask for clarification

## Available Instructions

| Topic                   | Document                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| Plugin Layout           | [plugin-layout.md](./common/plugin-layout.md)                     |
| File Naming Conventions | [file-naming-conventions.md](./common/file-naming-conventions.md) |
| Release Channel         | [release-channel.md](./common/release-channel.md)                 |

## What This Repository Is

A Claude Code plugin marketplace publishing **pre-release** Atlassian agent plugins —
the Atlassian Beta release channel. The deliverable is agent behaviour, which here means
instruction text: skills, agent definitions, hooks, and manifests.

- `.claude-plugin/marketplace.json` — what beta users can install.
- `plugins/<plugin>/.claude-plugin/plugin.json` — the plugin manifest and its version.
- `plugins/<plugin>/skills/`, `agents/`, `hooks/`, `commands/` — the plugin surface.

## General Guidelines

- Treat prompt and instruction text with the same rigour as code. A vague sentence in a
  skill is a bug.
- Follow existing patterns and voice. Read a neighbouring file before writing a new one.
- This repository is public-facing. Never commit internal-only URLs, hostnames, Slack
  channels, credentials, tokens, cloud IDs, or customer data.
- Never guess CLI grammar — flags, subcommands, IDs, ARIs and slugs come from the live
  CLI's own help output, not from memory and not from a skill file.
- Read-only agent tool allowlists stay read-only. A reviewing or verifying agent does not
  get write tools.
- Bump the plugin version for any user-visible change; beta users update without asking.
- Validate before claiming done: `npm run format:check`, `npm run validate`, `npm test`.
