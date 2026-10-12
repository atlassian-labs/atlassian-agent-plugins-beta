# Installation

## Requirements

- [Claude Code](https://code.claude.com/docs) — the plugin targets Claude Code and uses its
  plugin, skill, subagent, and hook schemas. Other agent harnesses cannot load it as-is.
- Node.js 20.6 or later — used by the plugin's hooks and scripts.
- Git — Claude Code clones the marketplace repository over your existing git credentials.
- An Atlassian account with access to the Jira site you want to work against.

## How this works

This repository is both the source and the distribution channel. There is no registry and
no build artefact:

1. You add the repository as a **marketplace**. Claude Code clones it and reads
   `.claude-plugin/marketplace.json`.
2. You **install** a plugin listed there. Claude Code loads it from `plugins/<name>/`.
3. Updates arrive by Claude Code re-reading the repository's default branch.

That means merging to `main` publishes. There is no staging step between a change and your
next update.

## Install

```bash
claude plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
claude plugin install jira@atlassian-beta-marketplace
```

Start a new Claude Code session afterwards — plugins load at session start.

## Verify

```bash
claude plugin list                 # is it installed and enabled?
claude plugin marketplace list     # is the marketplace registered?
```

## Update

```bash
claude plugin marketplace update atlassian-beta-marketplace
claude plugin update jira
```

Then restart your session. Check the version in `claude plugin list` against
`plugins/jira/.claude-plugin/plugin.json` to confirm the update took.

> [!IMPORTANT]
> There is no pinning. Beta plugins are expected to change under you, sometimes in
> breaking ways. If you need a fixed version, install from a local checkout of a specific
> commit (below) — but then you own keeping it current.

## Disable without uninstalling

Useful when you want to rule the plugin out while debugging something else:

```bash
claude plugin disable jira
claude plugin enable jira
```

## Uninstall

```bash
claude plugin uninstall jira
claude plugin marketplace remove atlassian-beta-marketplace
```

Uninstalling removes the plugin from Claude Code. It changes nothing in Jira: anything the
plugin already wrote to your Atlassian sites stays there.

## Install from a local checkout

For development, for reviewing a change before it ships, or for pinning to a known commit:

```bash
git clone https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
cd atlassian-agent-plugins-beta
git checkout <commit-or-branch>          # optional: pin to a known-good point

claude plugin marketplace add ./
claude plugin install jira@atlassian-beta-marketplace
```

A local marketplace and the remote one share the marketplace name, so remove one before
adding the other to avoid ambiguity:

```bash
claude plugin marketplace remove atlassian-beta-marketplace
```

## Troubleshooting

See [troubleshooting.md](troubleshooting.md).
