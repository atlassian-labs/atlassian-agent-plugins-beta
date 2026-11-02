# Beta Release Channel

> How a change reaches a beta participant, and what that obliges you to do

## The channel

This repository _is_ the channel. There is no registry: a beta user adds the repository as a
marketplace and the host reads `.claude-plugin/marketplace.json` (Claude Code) or
`.agents/plugins/marketplace.json` (Codex) straight from the default branch. The plugin itself
is built elsewhere: Atlassian's release tooling deletes and recreates `plugins/jira/`
on every release, so nothing kept inside that directory survives.

Consequences:

- **Merging to `main` publishes.** There is no staging environment between your PR and a
  beta user's next update. Review accordingly.
- **`marketplace.json` is the gate.** A plugin directory that is not listed there is not
  installable, however complete it looks. Adding the entry is the act of shipping.
- **The repository will be public.** It starts private, but is intended to go
  public-facing under `atlassian-labs`. Commit as though it already is — history is not
  cleanable after the fact.

## Versioning

`plugins/<plugin>/.claude-plugin/plugin.json` carries the version, set by the release that
wrote the directory from the plugin's source manifest; it is not bumped here. The Codex
manifest must carry the same version. After CI passes on `main`, a new version gets a
`jira@<version>` Git tag and GitHub prerelease. Beta users have no lockfile and no pinning,
so the version is the only way they can tell what they are running. Breaking changes are
expected in beta — take them, but say so in the PR's beta-impact section.

## Pre-release honesty

The word "Beta" is load-bearing. Anything user-facing — the root README, the plugin
README, the marketplace description, the plugin description — must make the pre-release
status unmissable. Do not soften it, and do not promise support, stability, or SLAs the
channel does not have.

## Before merging

```bash
npm run format:check
npm run validate     # marketplace + every plugin, --strict
npm test
```

Then install from a local checkout and exercise the change for real:

```bash
claude plugin marketplace add ./
claude plugin install jira@atlassian-beta-marketplace
```

`--strict` validation passing is necessary, not sufficient. It checks manifests, not
whether the agent does the right thing.
