# Support and issue triage

## What support exists

This is a Labs-stage beta channel. It is **not** covered by Atlassian product support and
has no SLA. Please do not raise Atlassian Support tickets for it — they cannot be actioned.

Everything happens in the open, on GitHub:

| I want to…                      | Do this                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| Report a bug                    | [Open an issue](https://github.com/atlassian-labs/atlassian-agent-plugins-beta/issues) |
| Request a capability            | Open an issue describing the outcome you want, not the implementation                  |
| Ask a question                  | Open an issue — questions are signal about unclear docs                                |
| Propose a change                | Read [CONTRIBUTING.md](../CONTRIBUTING.md), then open an issue before a large PR       |
| Report a security vulnerability | Follow [SECURITY.md](../SECURITY.md) — **never** a public issue                        |

## How to file a useful issue

Include:

1. **Plugin version** — from `claude plugin list`.
2. **Claude Code version** — from `claude --version`.
3. **What you asked for** — the prompt or command, redacted as needed.
4. **What happened, and what you expected.**
5. **Whether anything was written to Jira** — so we know if there is cleanup to do.

Redact before posting. Issues here are public: no credentials, tokens, cloud IDs, internal
URLs, customer data, or private work item content.

## Our triage process

The maintaining team reviews new issues and pull requests in its regular weekly triage,
and acts on anything security-related or actively destructive as soon as it is seen rather
than waiting for triage. At triage each item is acknowledged, labelled, and either
accepted with an owner, kept open for more information, or closed with a reason. Nothing is
closed silently.

Because this is a Labs-stage channel, expect a best-effort response measured in days, not
hours, and expect us to close things we do not intend to build rather than leaving them
open indefinitely.

## Ownership

The repository owner is recorded in [`.atlassian/OWNER`](../.atlassian/OWNER). Reviewers
for each area are in [`.github/CODEOWNERS`](../.github/CODEOWNERS).
