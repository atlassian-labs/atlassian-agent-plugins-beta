# atlassian-agent-plugins-beta

[![Atlassian license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE) [![Release channel: beta](https://img.shields.io/badge/release%20channel-beta-orange.svg?style=flat-square)](docs/beta-program.md) [![Build Status](https://img.shields.io/github/actions/workflow/status/atlassian-labs/atlassian-agent-plugins-beta/validate.yml?branch=main&style=flat-square)](https://github.com/atlassian-labs/atlassian-agent-plugins-beta/actions/workflows/validate.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

This is the **Atlassian early access release channel** for Atlassian's plugins for Claude Code and
Codex. It is where new capabilities land first, so that early access participants can use them
and shape them with feedback while the behaviour is still moving.

## Early access

> [!WARNING]
> **Early access software.** These plugins are part of an early access program and are provided
> "as is", without warranty. Commands, behaviour, and output can change between releases
> without notice, and a capability that appears here may be reworked or withdrawn before it
> reaches GA. This channel is not covered by Atlassian product support. Review anything the
> agent writes back to Atlassian products before you rely on it. If you want stability, use the
> general-availability Atlassian plugins instead.

Each plugin collects different data. Read its disclosure before you install it.

## Plugins

### Jira plugin

Ask your coding agent in plain English to read, create, update and work on Jira work items. When
you finish, it opens the pull request and writes a summary of what was done back to the work
item.

- **Install:** `jira@atlassian-beta-marketplace`
- **Disclosure:** session data and a summary of your coding sessions are written to the linked
  Jira work item.
- **Read more:** [docs/plugins/jira/README.md](docs/plugins/jira/README.md)

## Before you install

- Claude Code or Codex (desktop or command line).
- Node.js 20.6 or later.
- Permission to add this repository as a plugin marketplace. If your organisation restricts which
  plugin marketplaces can be added, ask your administrator to allow it before you install.
- Atlassian's **twg** command-line tool, installed and signed in. See the
  [twg installation guide](https://developer.atlassian.com/cloud/twg-cli/getting-started/installation/).
  To sign in, run `twg login` in your own terminal.
- Git, and a Bitbucket or GitHub repository if you want the agent to open pull requests.

## Install

Add the marketplace once, then install the plugins you want. Each plugin's README covers its own
setup and how to check it works.

### Claude Code

```bash
claude plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
claude plugin install jira@atlassian-beta-marketplace
```

### Codex

```bash
codex plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
codex plugin add jira@atlassian-beta-marketplace
```

Start a new session, then run `claude plugin list` or `codex plugin list` to check which plugins
are active. Full instructions, including updating, uninstalling, and installing from a local
checkout, are in [docs/installation.md](docs/installation.md).

## Turn off a plugin

Each plugin can be turned off on its own. See **Turn off the plugin** in the
[Jira plugin README](docs/plugins/jira/README.md#turn-off-the-plugin).

## Troubleshooting

| What you see                                                                    | What to do                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The plugin does not appear after installing                                     | Run `/reload-plugins`, or start a new session.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Adding the marketplace is refused, or the plugin never appears after you add it | Your organisation may restrict which plugin marketplaces can be added. Ask your administrator to allow `https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git`, and its SSH address `git@github.com:atlassian-labs/atlassian-agent-plugins-beta.git` if your policy permits only SSH. In Claude Code, add the marketplace with the address your policy permits, for example `claude plugin marketplace add git@github.com:atlassian-labs/atlassian-agent-plugins-beta.git`. |
| `twg: command not found`                                                        | Install the twg tool using the [installation guide](https://developer.atlassian.com/cloud/twg-cli/getting-started/installation/).                                                                                                                                                                                                                                                                                                                                                        |
| `AUTH_REQUIRED` in a response                                                   | You are not signed in. Run `twg login` in your own terminal; the agent cannot do this for you.                                                                                                                                                                                                                                                                                                                                                                                           |

Problems with one plugin are covered in its README. More help is in
[docs/troubleshooting.md](docs/troubleshooting.md).

## Documentation

| Document                                     | What it covers                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)   | Install, verify, and run your first task end to end.                                           |
| [Installation](docs/installation.md)         | Requirements, install, update, uninstall, local checkouts, and what a marketplace actually is. |
| [Beta program](docs/beta-program.md)         | What "beta" means here, versioning, breaking changes, support, and how to send feedback.       |
| [Troubleshooting](docs/troubleshooting.md)   | Symptoms, causes, and fixes for the failures beta users actually hit.                          |
| [Data and privacy](docs/data-and-privacy.md) | What each plugin reads, what it writes, what leaves your machine.                              |
| [Support and triage](docs/support.md)        | Where to file issues, how to make them useful, and how they get actioned.                      |
| [Development](docs/development.md)           | Working on this repository: layout, validation, tests, and release mechanics.                  |

Contributor and agent-facing guidance lives under [`docs/llm/`](docs/llm/) and is read by
coding agents working in this repository. Start at
[`docs/llm/agent-instructions.md`](docs/llm/agent-instructions.md).

## Tests

From the repository root:

```bash
npm install          # prettier, lint-staged, git hooks
npm run format:check # markdown, JSON, and script formatting
npm run validate     # validate the marketplace and every plugin, --strict
npm test             # repository invariants: manifests, governance files, no internal references
```

CI runs the same commands on every pull request. See
[`.github/workflows/validate.yml`](.github/workflows/validate.yml). `--strict` validation
checks manifests and frontmatter; it does not check whether the agent does the right
thing, so exercise changes from a local checkout as well. See
[docs/development.md](docs/development.md).

## Contributions

Contributions to atlassian-agent-plugins-beta are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

Security issues should go to [Atlassian's security channel](SECURITY.md), never a public
GitHub issue.

## License

Copyright (c) 2026 Atlassian US., Inc.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

<br/>

[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers.png)](https://www.atlassian.com)
