# Development

Working on this repository. For the contribution process and the CLA, see
[CONTRIBUTING.md](../CONTRIBUTING.md) first.

## What you are working on

A Claude Code plugin marketplace publishing pre-release Atlassian agent plugins. Almost
every change here is instruction content, a manifest, or a hook — **agent behaviour is the
product**, so prompt text gets the same rigour as code. A vague sentence in a skill is a
bug.

## Layout

```
.claude-plugin/marketplace.json   # what beta users can install — the release gate
plugins/jira/           # the plugin: manifest, README, skills, agents, hooks
docs/                             # consumer-facing documentation
docs/llm/                         # guidance for coding agents working in this repo
.github/workflows/validate.yml    # CI
```

`docs/llm/common/plugin-layout.md` covers what goes in `skills/`, `agents/` and `hooks/`,
and the rules each carries.

## Setup

```bash
npm install     # prettier, lint-staged, and the husky pre-commit hook
```

The pre-commit hook runs prettier on staged files. If it does not fire, `npm install` did
not run.

## Checks

```bash
npm run format:check   # prettier
npm run validate       # claude plugin validate, --strict, marketplace + every plugin
npm test               # plugin hook and skill-script unit tests
```

CI runs the same three on every pull request.

`--strict` validation checks manifests and frontmatter. It does **not** check whether the
agent does the right thing, so it is necessary and nowhere near sufficient.

Two validator behaviours worth knowing before they surprise you:

- Every `.md` in `agents/` is read as an agent definition, and every `.md` in `commands/` as
  a command. A README in either directory fails `--strict` for missing frontmatter — which
  is why directory guidance lives in `docs/llm/common/plugin-layout.md` instead.
- The Claude Code CLI version is pinned in the workflow. `--strict` gates what beta users
  receive, so an unpinned CLI could change the verdict without a commit here.

## Exercise your change for real

Manifest validation passing is not evidence the change works:

```bash
claude plugin marketplace add ./
claude plugin install jira@atlassian-beta-marketplace
```

Start a new session and actually drive the behaviour you changed. Remove the local
marketplace when you are done — it shares a name with the remote one:

```bash
claude plugin marketplace remove atlassian-beta-marketplace
```

## Versioning and release

Merging to `main` publishes. There is no staging environment between your pull request and
a beta user's next update.

Bump `version` in `plugins/jira/.claude-plugin/plugin.json` for any user-visible
change — skill behaviour, command names, output shape, hook behaviour, README guidance. Do
not bump for CI, repo docs, or formatting. Beta users have no lockfile, so the version is
the only way they can tell what they are running.

Full detail: [`docs/llm/common/release-channel.md`](llm/common/release-channel.md).

## Rules that are not negotiable

- **This repository is public-facing.** No internal-only URLs, hostnames, chat channels,
  credentials, tokens, cloud IDs, customer data, or unreleased roadmap detail. Assume
  anything committed is permanent and world-readable.
- **Permissive dependencies only.** Anything added to a `package.json` here must be
  MIT/BSD/Apache-2.0 or similar. The plugin itself should need no runtime dependencies.
- **Never guess CLI grammar.** Flags, subcommands, IDs, ARIs, and slugs come from the live
  CLI's own help output — never from memory, never from a skill file.
- **Read-only means read-only.** Agent definitions declaring a read-only tool allowlist keep
  it. Do not add write tools to a reviewing or verifying agent.
- **No silent writes.** Anything that mutates a user's Atlassian data must be visible in the
  transcript before it happens.
- **Hooks emit no prompt text and no PII**, fail quietly, and stay fast.
