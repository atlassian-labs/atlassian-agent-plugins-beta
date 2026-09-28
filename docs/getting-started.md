# Getting started

This guide takes you from nothing to a working install of the `atlassian-beta` plugin.

> [!WARNING]
> This is a beta release channel. See [beta-program.md](beta-program.md) for what that
> means before you use it on work that matters.

## 1. Check the prerequisites

| Requirement                                     | Check with           | Notes                                            |
| ----------------------------------------------- | -------------------- | ------------------------------------------------ |
| [Claude Code](https://code.claude.com/docs)     | `claude --version`   | The plugin targets Claude Code specifically.     |
| Node.js 20.6 or later                           | `node --version`     | Needed by the plugin's hooks and scripts.        |
| An Atlassian account with access to a Jira site | Sign in to your site | The plugin acts as you; it grants no new access. |

If `claude` is not found, install Claude Code first — nothing below will work without it.

## 2. Add the marketplace

A _marketplace_ is a git repository Claude Code reads plugin listings from. Adding one
does not install anything; it tells Claude Code where to look.

```bash
claude plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
```

## 3. Install the plugin

```bash
claude plugin install atlassian-beta@atlassian-beta-marketplace
```

The `@atlassian-beta-marketplace` suffix names the marketplace to install from. It is
required when more than one marketplace offers a plugin with the same name.

## 4. Restart and verify

Plugins load at session start, so **start a new Claude Code session**. Then:

```bash
claude plugin list
```

`atlassian-beta` should appear as installed and enabled, with its version. If it does not,
see [troubleshooting.md](troubleshooting.md).

## 5. Complete plugin setup

<!-- SCAFFOLD: replace once the skill content lands. Must cover:
     - the Atlassian CLI the plugin drives, and how a user installs it
     - how a user signs in, and that OAuth needs a real interactive terminal
     - how a user confirms setup succeeded -->

The plugin drives an Atlassian CLI that it does not itself bundle. Setup and sign-in
instructions ship with the skill content — see
[`plugins/atlassian-beta/README.md`](../plugins/atlassian-beta/README.md) for the state of
the release you have installed.

## 6. Run your first task

<!-- SCAFFOLD: replace with real, tested examples once the skill content lands. -->

Once setup is complete, the intended entry point is a Jira key:

```
> work PROJ-123
```

The plugin reads the item, plans the change, applies it, reviews its own work against the
item's Done-when criteria, and posts a change summary back to Jira.

> [!NOTE]
> The plugin currently published in this channel is a scaffold: it installs cleanly but
> ships no skills yet. The example above describes what this channel is being built to
> deliver, not what today's release does.

## Where to go next

- [Installation](installation.md) — updating, uninstalling, local checkouts.
- [Beta program](beta-program.md) — versioning, breaking changes, feedback.
- [Data and privacy](data-and-privacy.md) — what the plugin reads and writes.
- [Troubleshooting](troubleshooting.md) — when something does not work.
