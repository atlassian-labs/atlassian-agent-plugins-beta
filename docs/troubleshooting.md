# Troubleshooting

Work down the list — the causes are ordered by how often they turn out to be the problem.

## The plugin does not appear after installing

```bash
claude plugin list
```

1. **You did not restart.** Plugins load at session start. Exit Claude Code and start a new
   session.
2. **It is installed but disabled.** `claude plugin enable atlassian-beta`.
3. **The install did not actually succeed.** Re-run the install and read the output rather
   than assuming:

   ```bash
   claude plugin install atlassian-beta@atlassian-beta-marketplace
   ```

## `claude plugin marketplace add` fails

- **Repository not found / permission denied** — while the repository is private, you need
  access and working git credentials. Confirm with
  `git clone https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git` in a
  scratch directory. If that fails, the problem is git access, not Claude Code.
- **Already added** — a marketplace name can only be registered once. Remove and re-add:

  ```bash
  claude plugin marketplace remove atlassian-beta-marketplace
  claude plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
  ```

- **You added a local checkout earlier** — a local and remote copy share the marketplace
  name. `claude plugin marketplace list` shows which one is registered.

## The plugin is installed but does nothing

Check what the release you have actually ships:

```bash
claude plugin list        # note the version
```

Compare against [`plugins/atlassian-beta/README.md`](../plugins/atlassian-beta/README.md).
The current release in this channel is a **scaffold**: it installs and validates cleanly but
ships no skills yet, so an installed-and-enabled plugin doing nothing is expected rather
than broken.

## `command not found` for the Atlassian CLI

The plugin drives an Atlassian CLI that it does not bundle. `command not found` means the
CLI is not installed or is not on your `PATH` — plugin setup has not been completed. See
[getting-started.md](getting-started.md#5-complete-plugin-setup).

## Authentication errors

An auth error means you are not signed in to the CLI, or your session has expired.
Sign-in is interactive: it needs a real terminal, so the agent will hand you a command to
run yourself rather than running it for you. That is deliberate, not a bug.

If you are signed in but get permission errors on a specific item, check you can open that
item in a browser as the same account. The plugin acts as you — it cannot see anything you
cannot.

## The agent did the wrong thing

This is the most valuable thing you can report, and it does not look like a crash.

1. If anything was written to Jira, check and correct it — this is beta software and it is
   not authoritative.
2. [Open an issue](https://github.com/atlassian-labs/atlassian-agent-plugins-beta/issues)
   with the prompt, the plugin version, what it did, and what it should have done. See
   [support.md](support.md#how-to-file-a-useful-issue).

## Rule the plugin out entirely

```bash
claude plugin disable atlassian-beta
```

Restart, and reproduce. If the problem persists with the plugin disabled, it is not this
plugin.

## Still stuck

[Open an issue](https://github.com/atlassian-labs/atlassian-agent-plugins-beta/issues) —
including for questions. A question here usually means these docs are unclear, which is
itself worth fixing.
