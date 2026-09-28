# Beta Release Channel

> How a change reaches a beta participant, and what that obliges you to do

## The channel

This repository _is_ the channel. There is no build step and no registry: a beta user
adds the repository as a marketplace and Claude Code reads
`.claude-plugin/marketplace.json` straight from the default branch.

Consequences:

- **Merging to `main` publishes.** There is no staging environment between your PR and a
  beta user's next update. Review accordingly.
- **`marketplace.json` is the gate.** A plugin directory that is not listed there is not
  installable, however complete it looks. Adding the entry is the act of shipping.
- **The repository will be public.** It starts private, but is intended to go
  public-facing under `atlassian-labs`. Commit as though it already is — history is not
  cleanable after the fact.

## Versioning

`plugins/<plugin>/.claude-plugin/plugin.json` carries the version. Beta users have no
lockfile and no pinning, so the version is the only way they can tell what they are
running.

- Bump for any user-visible change: skill behaviour, command names, output shape, hook
  behaviour, README guidance.
- Do not bump for internal-only edits: CI, repo docs, formatting.
- Semver, with beta latitude: minor for new or changed behaviour, patch for fixes.
  Breaking changes are expected in beta — take them, but say so in the PR's beta-impact
  section.

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
claude plugin install atlassian-beta@atlassian-beta-marketplace
```

`--strict` validation passing is necessary, not sufficient. It checks manifests, not
whether the agent does the right thing.
