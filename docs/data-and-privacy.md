# Data and privacy

## The short version

The plugin runs entirely on your machine and acts as you, through your own Atlassian
credentials. It adds no server in the middle and grants no access you did not already have.

## What it can see

Whatever your Atlassian account can see, and whatever is in the repository you are working
in. If you cannot open a work item in a browser, the plugin cannot read it either.

## What it can change

- **In Atlassian** — the plugin can create and update work items, transition them, comment,
  and link them. Every write is visible in your session transcript before it happens.
  Reviewing and verifying subagents are restricted to a read-only tool allowlist by their
  definitions, so they report rather than edit.
- **In your working tree** — the plugin can edit files, exactly as your agent normally does.
  Normal git hygiene applies: work on a branch, read the diff.

Hooks never mutate Atlassian data or your working tree.

## What leaves your machine

- **To Atlassian** — API calls to the sites you are authenticated against, made as you.
- **To your model provider** — whatever your agent sends as part of the conversation, which
  includes work item content the plugin fetched. This is the same path your prompts already
  take; the plugin does not change where it goes. Your agent's own data policy governs it.
- **To Atlassian telemetry, by this plugin** — nothing. The plugin adds no analytics of its
  own.

Hooks in this plugin emit no prompt text and no PII. That is a rule maintainers hold
themselves to, and it is stated in
[`docs/llm/common/plugin-layout.md`](llm/common/plugin-layout.md) so that contributors and
coding agents working here are held to it too.

## Credentials

The plugin does not store, read, or forward credentials. Authentication is the Atlassian
CLI's job, using its own token storage. Sign-in is interactive and happens in your terminal,
not through the agent.

## Practical advice

- **Work on a branch.** Beta software plus an agent that edits files is a good reason not to
  be on `main`.
- **Review writes before trusting them.** Especially anything the agent posts back to a work
  item other people read.
- **Mind what you paste.** Prompt content reaches your model provider. That is true with or
  without this plugin, but fetched work item content increases how much of it there is.
- **Redact before filing issues.** GitHub issues here are public — see
  [support.md](support.md#how-to-file-a-useful-issue).

## Reporting a concern

Anything that looks like data leaving your machine unexpectedly, or the plugin acting beyond
the access you granted, is a security report — follow [SECURITY.md](../SECURITY.md), not a
public issue.
