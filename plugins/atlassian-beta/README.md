# Atlassian (Beta)

> **Beta release channel.** This plugin is pre-release. Commands, behaviour and output can
> change between releases without notice. Verify anything it writes back to Jira.

Hand your agent a Jira key and let it do the work the item describes — locally, in your
own terminal, against the Atlassian sites you are already authorised for.

```
> work PROJ-123
```

## Install

```bash
claude plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
claude plugin install atlassian-beta@atlassian-beta-marketplace
```

Start a new Claude Code session afterwards so the plugin loads.

## Setup

<!-- SCAFFOLD: fill in once the skill content lands. Cover, at minimum:
     - the CLI this plugin drives, and how a user installs it
     - how a user signs in, and that OAuth needs a real interactive terminal
     - what "command not found" and "AUTH_REQUIRED" mean and how to fix each -->

This plugin drives an Atlassian CLI that it does not itself ship. Setup instructions land
with the skill content.

## Use it for

<!-- SCAFFOLD: replace with the shipped surface once the skill content lands. -->

- Read, search, and triage work items — by key, by URL, or by JQL.
- Author and maintain — create, update fields, assign, transition, comment, link.
- Execute — do the work an item describes, then record the outcome back on the item.

## What ships

<!-- SCAFFOLD: this section must list the real contents of skills/, agents/ and hooks/
     before the plugin is added to marketplace.json as installable. -->

Nothing yet. This directory is the scaffold for the beta plugin: manifest, licence, test
runner, and the empty `skills/`, `agents/` and `hooks/` directories the content lands in.
What goes where, and the rules each directory carries, is in
[`docs/llm/common/plugin-layout.md`](../../docs/llm/common/plugin-layout.md).

## Your data

The plugin runs locally and acts as you, through your own Atlassian credentials. It grants
no access you did not already have, and it adds no server in the middle.

## Development

```bash
npm test                                   # hook and skill-script unit tests
claude plugin validate . --strict
```

Command grammar for the Atlassian CLI comes from the live CLI's own help output, never from
memory and never from a skill file. Never guess a flag, subcommand, ID, ARI, or slug.

Almost every change here is instruction content, a manifest, or a hook: agent behaviour is
the product, so treat prompt text with the same rigour as code.

## Licence

Apache License 2.0 — see [LICENSE.txt](./LICENSE.txt).
