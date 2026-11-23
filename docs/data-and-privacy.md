# Data and privacy

Each plugin in this marketplace handles different data. This page covers what they have in
common, then each plugin in turn. Read the section for every plugin you install, and its
disclosure in the plugin's README.

## What every plugin has in common

- **It runs on your machine and acts as you.** Plugins call Atlassian through the `twg`
  command-line tool, using your own Atlassian credentials. They add no server in the middle
  and grant no access you did not already have.
- **What your agent sends to your model provider is unchanged.** Whatever your agent sends as
  part of the conversation, including content a plugin fetched, takes the same path your
  prompts already take. Your agent's own data policy governs it.
- **Credentials stay with `twg`.** No plugin stores, reads, or forwards credentials. Sign-in
  is interactive and happens in your terminal, not through the agent.
- **Analytics can be turned off.** Plugins send usage analytics to Atlassian (see each
  plugin below). Analytics never include prompt text. Set `DO_NOT_TRACK=1` in the
  environment your agent runs in to stop them; queued events are then discarded rather than
  sent.

## Jira plugin

### What it can see

Whatever your Atlassian account can see, and whatever is in the repository you are working
in. If you cannot open a work item in a browser, the plugin cannot read it either.

### What it can change

- **In Jira**: when you ask, the plugin creates and updates work items, transitions them,
  comments, and links them. These writes are visible in your session transcript before they
  happen. Reviewing and verifying subagents are restricted to a read-only tool allowlist by
  their definitions, so they report rather than edit.
- **On the linked work item, automatically**: when a session is linked to a work item, the
  plugin's hooks record the session's start and end against it. See
  [What leaves your machine](#what-leaves-your-machine).
- **In your working tree**: the plugin can edit files, exactly as your agent normally does.
  Normal git hygiene applies: work on a branch, read the diff.

### What leaves your machine

- **To Atlassian, as you**: API calls to the sites you are signed in to, for the work you
  ask for.
- **Session metadata, to the linked work item**: at session start and end, the plugin sends
  the agent's session ID, the agent name (Claude Code or Codex), the working directory path,
  the site ID, the linked work item key, and whether the session started or ended. Anyone
  with access to the work item can see it.
- **Summaries you publish**: when you publish changes, the summary comment and pull request
  description you reviewed are posted to the work item and your pull request provider.
- **Usage analytics, to Atlassian**: events for session start and end, skill use, and
  command outcomes, with the plugin version, operating system, and the linked work item and
  project IDs. Atlassian staff accounts are identified by account ID; other accounts by a
  one-way hash of it. No prompt text, file contents, or work item content.

Turning the plugin off stops anything further from being written. It does not remove what
was already written to work items: edit or delete those in Jira.

## Memory plugin

The [Memory plugin README](plugins/memory/README.md) is the full notice for code memories.
In short:

### What it can see

The repository you are working in, and the code memories your site holds for it. Recall is
scoped to people with read access to the repository in Bitbucket Cloud or GitHub.

### What it can change

Nothing in your Atlassian products and nothing in your working tree. It adds recalled
memories to the agent's context, and uploads the session transcript when the session ends.

### What leaves your machine

- **Your session transcript, to Atlassian**: only after an organization admin has turned on
  **Sessions [Beta]** with **Capture full transcripts**, and you have acknowledged the notice
  your agent shows. It includes your prompts, the agent's responses, and tool output such as
  file contents and command results.
- **What happens to it**: Atlassian attempts to redact secrets and personal information
  (best effort), then a third-party large language model extracts code memories from the
  sanitized transcript. Raw transcripts are deleted after 30 days; sanitized transcripts are
  kept for the EAP; code memories are kept until your Jira subscription terminates. Everything
  is stored and processed in the United States.
- **Memory searches**: when the agent recalls memories, its search is sent to Atlassian.

You can pause capture with `twg session set upload disable` and resume it with
`twg session set upload enable`. Turning capture off, or disabling the plugin, does not delete
what was already uploaded: ask [Atlassian Support](https://support.atlassian.com) to delete
transcripts and memories for your site or for specific repositories.

## Practical advice

- **Work on a branch.** Beta software plus an agent that edits files is a good reason not to
  be on `main`.
- **Review writes before trusting them.** Especially anything the agent posts back to a work
  item other people read.
- **Keep secrets out of sessions you upload.** With the Memory plugin, transcripts include
  tool output as well as prompts. Pause capture before confidential work.
- **Mind what you paste.** Prompt content reaches your model provider. That is true with or
  without these plugins, but fetched content increases how much of it there is.
- **Redact before filing issues.** GitHub issues here are public. See
  [support.md](support.md#how-to-file-a-useful-issue).

## Reporting a concern

Anything that looks like data leaving your machine unexpectedly, or a plugin acting beyond
the access you granted, is a security report. Follow [SECURITY.md](../SECURITY.md), not a
public issue.
