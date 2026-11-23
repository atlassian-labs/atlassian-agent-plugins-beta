---
name: jira-workflows
description: >
  Use when a Jira ticket, issue, bug, story, epic, board, or sprint is the
  subject, by PROJ-123 or URL. Get, search, JQL, find similar or duplicate
  items, create, update, assign, transition, close, comment, link. Also when
  asked to work on, pick up, start, or claim an item, and when asked to
  publish the changes for an item: open its pull request and post the
  writeback.
allowed-tools:
  - Read
  - Bash(twg:*)
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git add:*)
  - Bash(git commit:*)
  - Bash(git branch:*)
  - Bash(git rev-parse:*)
  - Bash(git check-ignore:*)
  - Bash(command -v twg)
  - Bash(command -v gh)
  - Bash(command -v jira-cli.mjs || echo none)
  - Bash(jira-cli.mjs:*)
  - Bash(${CLAUDE_SKILL_DIR}/scripts/jira-cli.mjs:*)
---

# jira-workflows

## How To Route

1. Match the request to the most specific Intent below, then load only that
   row's files, in the order listed. If two rows match, load both. Preload
   nothing else.
2. Read each loaded file in full before acting.
3. Never mutate Jira from this file alone. The matched reference owns the
   required reads, field metadata, approval, and verification steps.
4. When no row matches, run
   `twg help discover-skills "<intent>" --skill twg-jira`, then
   `twg help "<terms>"`. Do not guess a command path.

## Routes

| Intent | Load and follow |
| --- | --- |
| Learn what this skill does or how to ask for it: "how do I use this", "what can you do" | Run `jira-cli.mjs onboarding` (see `CLI`) and reply with its stdout verbatim. Do not summarise it: the user does not see command output. Then offer to add the fenced block under the guide's `Make It Trigger Reliably` heading to the repository's `AGENTS.md`, and write it only after the user agrees |
| Work on, pick up, start, take, claim, or execute a work item | `references/claim-work-item.md` |
| Prepare, create, cut, or switch to the git branch for a work item | `references/prepare-branch.md` |
| Create a work item | `references/create-work-item.md` |
| Read one work item's data, or what one of its description sections means | `references/read-work-item.md` |
| Find, filter, rank, or triage work items | `references/query-work-items.md` |
| Show an epic's children, progress, or status | `references/epics.md`: run `jira-cli.mjs epic get --key <KEY> --render`, with `--refresh` when the user asks for current state |
| List recent, prior, or "my" epics | `references/epics.md`: run `jira-cli.mjs epic list --render`, with `--all` when the user asks across repos |
| Publish the changes for a work item, open its pull request, or post its writeback | `references/publish-changes.md` |
| Set up, change, or explain a template for a work item, writeback comment, or pull request description | `references/templates.md` |
| Decide whether a work item duplicates an existing one | `references/duplicates.md` |
| Change a work item's fields or status | `references/fields-and-transitions.md` |
| Write a description body, or rewrite one of its sections | `references/rich-content.md`, then `references/fields-and-transitions.md` |
| Add a comment | `references/comment-work-item.md`, then `references/rich-content.md` where the body carries a mention, a link, or more than one line |
| Link two work items, or attach a pull request, repository, branch, commit, build, deployment, Loom video, or meeting to one | `references/link-work-items.md` |
| Delete a work item | `references/delete-work-item.md` |
| Change Jira's own configuration, not one work item | `references/administration.md` |

## CLI

`jira-cli.mjs` is this plugin's bundled CLI. Run it with the arguments exactly
as shown. It needs no setup step. Never prefix a call with `node`.

On first use, once per session, run `command -v jira-cli.mjs || echo none`
exactly as written. Where it prints `none`, run `jira-cli.mjs` by the quoted
absolute path of `scripts/jira-cli.mjs` in the directory of the SKILL.md you
loaded, in place of the bare name.

## twg

If `twg` is `command not found`, tell the user to run `/twg-setup`; this
plugin does not ship it. Do not read an auth or command error as a missing
install.

## Session Link Warnings

For `twg-upgrade-required`, report its `detail` and continue from the command's result.
Do not repeat a completed create, claim, comment, branch preparation, or publish to clear this warning.
After the user updates TWG, retry the session link with `work-item get --key <KEY> --refresh`.

## gh

`gh` is the GitHub CLI, a separate binary the user installs, used only to open
GitHub pull requests; the plugin's own CLI spawns it, so do not run `gh`
yourself — only `command -v gh`, to resolve its path. A `jira-cli.mjs` publish
verdict names when it cannot be used:

- `gh-not-found`: `gh` is not installed. Tell the user to install it
  (`reasons[0].detail` names where), then re-run. Do not read an auth error as
  a missing install.
- `gh-not-authenticated`: `gh` is installed but has no usable GitHub login.
  `gh auth login` needs a real interactive terminal, so do not run it yourself.
  Resolve the binary's absolute path with `command -v gh` and tell the user to
  run `"<that absolute path>" auth login` in their own terminal. Wait for
  confirmation, then re-run.

## Authentication

If `twg` returns `AUTH_REQUIRED` (`"mode":"oauth"`, HTTP 401), or a `jira-cli.mjs`
verdict has the reason `not-authenticated`, the user is not signed in. `twg login`
needs a real interactive terminal, so do not run it yourself. Resolve the
binary's absolute path with `command -v twg` and tell the user to run
`"<that absolute path>" login` in their own terminal. Add `--force` to that
command only when the user asks to re-authenticate from scratch. Wait for
confirmation, then retry.

## Product Boundaries

- "Issue", "work item", and "workitem" name the same object. The command family
  is `workitem`; there is no `issue` family.
- A Jira space is a Jira project, not an Atlas project or a Confluence space.
- JSM approvals, portals, queues, request types, and SLAs are not workitem
  operations, even though a request has an underlying workitem.

## Handoffs

For work beyond Jira, keep this skill loaded only for the Jira-linked steps and
discover the command as `How To Route` step 4 says. Do not load an unbundled
`twg-*` skill.
