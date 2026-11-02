## What This Does

jira-workflows works Jira from the session: it reads, finds, creates, and updates work items, and carries one from claim to pull request. Name the item by key (`PROJ-123`) or URL. A create, an edit, a comment, and a delete are shown for approval first. A claim and a branch run as soon as you ask: a claim assigns the item to you and moves it to In Progress. A publish shows you its writeback comment and pull request description for approval first, and you can edit them; then it pushes, opens the pull request, comments, and moves the item to review. Say up front that either needs no review (for example "open the pull request without my review") and a publish skips that approval.

## Your Session Data

By using this plugin, you authorize Atlassian to collect session data, activity and a summary of your coding sessions from Third-Party Products (such as Claude Code, Codex, etc.). This information is automatically written to the relevant linked Jira work item and visible to anyone with access to it. Please ensure your session content complies with all applicable policies before initiating. You can edit and delete this information, and disable this plugin.

## Before You Start

- Install the `twg` CLI with `/twg-setup`. Every Jira read and write goes through it.
- Sign in once by running `twg login` in your own terminal; the agent cannot run it for you.

## What To Say

| You want to | Try saying | Route |
| --- | --- | --- |
| Start on a ticket and do the work | "work on PROJ-123", "pick up PROJ-123" | `claim-work-item.md` |
| Get a git branch named for a ticket | "prepare a branch for PROJ-123" | `prepare-branch.md` |
| Open a ticket from what you are doing | "create a ticket for this bug", "file a task in PROJ for …" | `create-work-item.md` |
| Read one ticket | "what is PROJ-123 about?", "show me PROJ-123 with comments" | `read-work-item.md` |
| Find or triage tickets | "my open tickets in PROJ", "bugs in PROJ created this week", "JQL: …" | `query-work-items.md` |
| Ship the work for review | "publish the changes for PROJ-123" | `publish-changes.md` |
| Set up or explain a template for ticket descriptions, comments, or pull requests | "add a bug template for this repo", "how do templates work?" | `templates.md` |
| Check for an existing ticket | "is there already a ticket for …?", "is PROJ-123 a duplicate?" | `duplicates.md` |
| Change fields or status | "move PROJ-123 to Done", "set priority of PROJ-123 to High" | `fields-and-transitions.md` |
| Write a formatted description, or fix one of its sections | "write the description of PROJ-123 with a table of …", "rewrite the Acceptance criteria of PROJ-123" | `rich-content.md` |
| Comment on a ticket | "comment on PROJ-123 that …" | `comment-work-item.md` |
| Link two tickets, or attach a pull request or other artefact to one | "PROJ-123 blocks PROJ-124", "attach this PR to PROJ-123" | `link-work-items.md` |
| Delete a ticket | "delete PROJ-123" | `delete-work-item.md` |
| Change project configuration | "add a component to PROJ", "create a version in PROJ" | `administration.md` |

## Make It Trigger Reliably

Add this to your repository's `AGENTS.md` so the agent uses jira-workflows even when a prompt does not name a ticket:

```markdown
## Jira workflows

Use the `jira-workflows` skill before anything else when:

- a work item key (`PROJ-123`) or a Jira URL appears in the prompt or the current branch name;
- the user asks to work on, pick up, start, or claim a ticket;
- the user asks to find, create, read, comment on, link, or move a ticket;
- the user asks to publish the changes, open the pull request, or post the writeback for a ticket.
```

After showing this guide, the agent offers to add it for you, and writes to `AGENTS.md` only if you agree.

## Custom Templates

A team can commit repository-specific templates for work-item descriptions, writeback
comments, and pull request descriptions. They live at
`.jira/templates/<name>.yaml`, work in both Claude Code and Codex, and travel with the
repository.

Ask the agent to create one:

```text
Create a work-item template named team-task.
Create a comment template named team-comment.
Create a pull-request template named team-pr.
```

When a work-item request does not name a starting template, the agent offers the
available repository and built-in templates—`bug`, `investigation`, and `task` by
default—or a blank template.

After the agent creates a template, edit it, ask the agent to validate it, then commit
`.jira/templates/` so every contributor gets the same templates.

## Getting Help

Ask "how do I use jira-workflows?" to see this guide again.
