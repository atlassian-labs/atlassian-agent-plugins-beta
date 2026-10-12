# Beta program

## What "beta" means here

This repository is a **pre-release channel**. Plugins land here before the
general-availability channel so that beta participants can use new Atlassian agent
capabilities early and shape them with feedback.

Concretely, you should expect:

| Expectation             | What it means for you                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Pre-release quality     | Rough edges are normal. Review anything the agent writes back to Jira before you rely on it. |
| Breaking changes        | Commands, behaviour, and output can change between releases without notice.                  |
| Capabilities can vanish | Something here may be reworked or withdrawn before it reaches GA.                            |
| No product support      | Atlassian Support does not cover this channel. Do not raise Support tickets for it.          |
| No SLA                  | Issues are triaged on a best-effort basis — see [support.md](support.md).                    |

If you need stability, use the general-availability Atlassian plugins instead of this
repository.

## Versioning

Plugins follow [semantic versioning](https://semver.org/), currently below `1.0.0` as
Labs-stage software. The version lives in
`plugins/<plugin>/.claude-plugin/plugin.json` and is visible in `claude plugin list`.

While the major version is `0`:

- **Minor** (`0.1.0` → `0.2.0`) — new or changed behaviour, including breaking changes.
  Below `1.0.0`, a minor bump is where breaking changes go.
- **Patch** (`0.1.0` → `0.1.1`) — fixes and clarifications that do not change the intended
  behaviour.

Because there is no pinning, the version is the only reliable way to tell what you are
running. Quote it in any issue you file.

## What is stable and what is not

Nothing in this channel is contractually stable. That said, some things break users harder
than others, and we treat them with more care:

- **Skill and command names** (`/jira:<skill>`) are what you type. Renaming one
  is a breaking change and gets called out in the release.
- **Anything that writes to Jira** gets more caution than anything that reads. A change
  that widens what the agent will write without asking is treated as breaking.
- **Output shape** — if you script against the agent's output, expect it to move.

## Graduating out of beta

This is a Labs-stage project. Capabilities proven here are intended to graduate to the
general-availability Atlassian plugins; the project itself is expected to be promoted or
archived rather than run as a beta channel indefinitely. Beta participation is how a
capability earns that promotion, so feedback is the point of the channel, not a courtesy.

## Feedback

Feedback is the reason this channel exists.

- **Bugs and feature requests** — [open a GitHub issue](https://github.com/atlassian-labs/atlassian-agent-plugins-beta/issues).
  Include the plugin version, your Claude Code version, what you asked for, and what
  happened.
- **Behaviour that was subtly wrong** — worth an issue even when nothing errored. An agent
  that confidently does the wrong thing is the most valuable bug report we can get, and the
  hardest for us to find without you.
- **Security issues** — follow [SECURITY.md](../SECURITY.md). Never a public issue.

See [support.md](support.md) for how issues are triaged and what response to expect.
