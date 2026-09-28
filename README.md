# atlassian-agent-plugins-beta

[![Atlassian license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE) [![Release channel: beta](https://img.shields.io/badge/release%20channel-beta-orange.svg?style=flat-square)](docs/beta-program.md) [![Build Status](https://img.shields.io/github/actions/workflow/status/atlassian-labs/atlassian-agent-plugins-beta/validate.yml?branch=main&style=flat-square)](https://github.com/atlassian-labs/atlassian-agent-plugins-beta/actions/workflows/validate.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

This is the **Atlassian Beta release channel** for the Atlassian agent plugin.

Atlassian ships agent plugins that let a coding agent work directly with your Jira and
Confluence data from your own terminal. This repository is where those plugins land
_first_ — ahead of the general-availability channel — so that beta participants can use
new capabilities early and shape them with feedback while the behaviour is still moving.

It exists because agent behaviour is hard to get right in the abstract. A skill that reads
well can still make the wrong call against a real backlog, and the only way to find that
out is to put it in front of people doing real work. This channel makes that possible
without holding the stable channel to pre-release quality.

> [!WARNING]
> **Pre-release software.** Commands, behaviour, and output can change between releases
> without notice, and a capability that appears here may be reworked or withdrawn before
> it reaches GA. This channel is not covered by Atlassian product support. Review
> anything the agent writes back to Jira before you rely on it. If you want stability,
> use the general-availability Atlassian plugins instead.

## Plugins

| Plugin           | Status   | What it does                                                                                                                           |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `atlassian-beta` | Scaffold | Beta channel for the Atlassian agent plugin — Jira work item workflows, run locally in your terminal against your own Atlassian sites. |

`atlassian-beta` is installable today but ships no capabilities yet: the repository
foundations landed first, and the skill content follows. See
[`plugins/atlassian-beta/README.md`](plugins/atlassian-beta/README.md) for what is
present.

## Usage

Hand your agent a Jira key and let it do the work the item describes — locally, in your
own terminal, against the Atlassian sites you are already authorised for:

```
> work PROJ-123
```

The plugin reads the item, plans the change, applies it, reviews its own work against the
item's Done-when criteria, and posts a change summary back to Jira. No new access is
granted: it acts as you, through your own credentials.

> [!NOTE]
> The example above describes the capability this channel is being built to ship. The
> plugin currently in `plugins/atlassian-beta` is a scaffold and does not yet do this.
> Track [the plugin README](plugins/atlassian-beta/README.md) for what actually works in
> the release you have installed.

## Installation

Requires [Claude Code](https://code.claude.com/docs) and Node.js 20.6 or later.

Add this repository as a plugin marketplace, then install the plugin:

```bash
claude plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
claude plugin install atlassian-beta@atlassian-beta-marketplace
```

Start a new Claude Code session afterwards so the plugin loads. To confirm it is active:

```bash
claude plugin list
```

Full instructions — including updating, pinning behaviour, uninstalling, and installing
from a local checkout — are in [docs/installation.md](docs/installation.md).

## Documentation

| Document                                     | What it covers                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)   | Install, verify, and run your first task end to end.                                           |
| [Installation](docs/installation.md)         | Requirements, install, update, uninstall, local checkouts, and what a marketplace actually is. |
| [Beta program](docs/beta-program.md)         | What "beta" means here, versioning, breaking changes, support, and how to send feedback.       |
| [Troubleshooting](docs/troubleshooting.md)   | Symptoms, causes, and fixes for the failures beta users actually hit.                          |
| [Data and privacy](docs/data-and-privacy.md) | What the plugin reads, what it writes, what leaves your machine.                               |
| [Support and triage](docs/support.md)        | Where to file issues, how to make them useful, and how they get actioned.                      |
| [Development](docs/development.md)           | Working on this repository: layout, validation, tests, and release mechanics.                  |

Contributor and agent-facing guidance lives under [`docs/llm/`](docs/llm/) and is read by
coding agents working in this repository — start at
[`docs/llm/agent-instructions.md`](docs/llm/agent-instructions.md).

## Tests

From the repository root:

```bash
npm install          # prettier, lint-staged, git hooks
npm run format:check # markdown, JSON, and script formatting
npm run validate     # validate the marketplace and every plugin, --strict
npm test             # plugin hook and skill-script unit tests
```

CI runs the same commands on every pull request — see
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
