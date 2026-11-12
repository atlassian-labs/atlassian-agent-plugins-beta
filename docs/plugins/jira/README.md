# Jira plugin (`jira`)

Part of the [Atlassian early access plugin marketplace](../../../README.md). Read the
[early access notice](../../../README.md#early-access) before you install.

## Disclosure: your session data

> By using this plugin, you authorize Atlassian to collect session data, activity and a summary
> of your coding sessions from Third-Party Products (such as Claude Code, Codex, etc.). This
> information is automatically written to the relevant linked Jira work item and visible to
> anyone with access to it. Please ensure your session content complies with all applicable
> policies before initiating. You can edit and delete this information, and disable this plugin.

## Overview

Ask your coding agent in plain English to read, create, update and work on Jira work items. When
you finish, it opens the pull request and writes a summary of what was done back to the work
item, so the work item shows what was done without you updating it by hand.

- **Works with:** Claude Code and Codex, in the desktop app or on the command line.
- **Where it runs:** locally, on your machine, in your own repositories.
- **New here?** Ask your agent _"How do I use jira-workflows?"_ to see the built-in guide.

What it helps with:

- **Turn ideas into work.** Plan or investigate with your agent, then create a work item from
  what it already knows.
- **Get started faster.** Say which work item you are picking up. The agent assigns it to you,
  moves it to In Progress and creates a branch.
- **Stop updating Jira by hand.** When you are done, one request opens the pull request, posts a
  summary on the work item and moves it to review.
- **Avoid duplicate work.** Ask whether a work item already exists before you start something new.

## What you can do

Use plain language. Work item keys such as PROJ-123, or a pasted Jira link, both work.

| You want to             | Try saying                                                              | What happens                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Read a work item        | "Show me PROJ-123"                                                      | The agent shows the work item's key, status, assignee and description in your terminal.                                                   |
| Find work items         | "My open work items in PROJ", "Bugs in PROJ created this week"          | The agent searches Jira and lists the matches.                                                                                            |
| Check for duplicates    | "Is there already a work item for the login timeout?"                   | The agent looks for similar existing work items before you create a new one.                                                              |
| Create a work item      | "Create a work item for this bug on the PROJ project"                   | The agent drafts the work item from your conversation, shows it to you, and creates it once you approve.                                  |
| Start on a work item    | "Let's work on PROJ-123"                                                | The agent assigns it to you, moves it to In Progress and creates a branch named after it, then starts on the work.                        |
| Ship your work          | "Publish the changes for PROJ-123"                                      | The agent shows you what it will post, then pushes your branch, opens the pull request, comments on the work item and moves it to review. |
| Update a work item      | "Move PROJ-123 to Done", "Comment on PROJ-123 that the fix is deployed" | The agent makes the change and confirms it.                                                                                               |
| Standardize your format | "Create a pull request template for this repository"                    | The agent creates a template your whole team can share, so work items, comments and pull request descriptions follow the same structure.  |

## Install

Complete the [shared prerequisites](../../../README.md#before-you-install) first.

### Claude Code

Run these in your terminal. The first adds the early access marketplace and the second installs
the plugin.

```bash
claude plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
claude plugin install jira@atlassian-beta-marketplace
```

Start a new Claude Code session, then check that the plugin is active:

```bash
claude plugin list
```

You should see `jira` in the list. Then ask: _"How do I use jira-workflows?"_ The agent shows a
short guide, and you can ask this again at any time.

### Codex

Run these in your terminal. The first adds the early access marketplace and the second installs
the plugin.

```bash
codex plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git
codex plugin add jira@atlassian-beta-marketplace
```

Start a new Codex session, then check that the plugin is active:

```bash
codex plugin list
```

You should see `jira` in the list. Then ask: _"How do I use jira-workflows?"_ The agent shows a
short guide, and you can ask this again at any time.

Full instructions, including updating, uninstalling, and installing from a local checkout, are in
[docs/installation.md](../../../docs/installation.md).

## Examples

### Create a work item

You have been investigating a bug with your agent and want to capture it.

1. You say: _"Create a work item for this bug on the PROJ project."_
2. The agent drafts a work item from what it already knows about the problem and shows it to you.
3. You approve it, or ask for changes. The agent creates it and gives you the link.

### Work on an item and publish

1. You say: _"Let's work on PROJ-123."_ The agent assigns the work item to you, moves it to In
   Progress and creates a branch such as `PROJ-123/fix-empty-body-validation`.
2. You and the agent make the change together.
3. You say: _"Publish the changes for PROJ-123."_ Before it posts anything, the agent shows you
   the summary it will add to the work item and the pull request description.
4. You review it and say _"go ahead"_, or tell the agent what to change. It then pushes the
   branch, opens the pull request, posts the summary on PROJ-123 as a comment and moves the work
   item to review.

### Started without a work item?

Ask your agent _"Create a work item for this on the PROJ project."_ It drafts one from your
conversation for you to approve. When you are done, say _"Publish the changes for PROJ-123"_ and
the agent writes a summary of the work you completed in your session and adds it to the work item.

### Use templates to standardize your work

You want your work items, pull requests and work completion summaries to follow a particular
shape.

1. You say: _"Let's create some custom work item templates for this repo."_
2. The agent offers to start from the default templates (recommended) or from scratch.
3. You tell the agent the shape you want each template to enforce.
4. From then on, when your agent creates a work item or raises a pull request, it uses these
   templates to decide what the content should include.

Templates are saved in your repository, so everyone on your team gets the same ones.

## Approvals and review

The agent asks before it changes anything that others will see.

- **Creating, editing, commenting and deleting** are shown to you for approval first. Deleting a
  work item also needs you to type the word "delete".
- **Starting on a work item** (assigning it to you, moving it to In Progress, creating the
  branch) happens as soon as you ask.
- **Publishing** shows you the summary comment and the pull request description first. You can
  edit them or skip either one.

### Review before publishing

Reviewing is the default. If you trust the agent's summaries and prefer to publish without the
extra step, you can switch it off.

| To                                                      | Say                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Skip the review once                                    | "Publish the changes for PROJ-123 and open the pull request without my review" |
| Stop being asked to review the summary comment          | "Stop asking me to review the comment before publishing"                       |
| Stop being asked to review the pull request description | "Stop asking me to review the pull request description before publishing"      |
| Go back to reviewing                                    | "Ask me to review the comment again" (or the pull request description)         |

- The two choices are separate: you can skip one review and keep the other.
- A standing choice is remembered on your machine, across sessions and repositories, until you
  change it.
- If your agent is set to approve actions automatically, it may ask you to confirm this setting.

## Turn off the plugin

Turning the plugin off stops it from writing anything further to Jira. It does not remove what
was already written to work items: edit or delete those comments and details in Jira.

| Tool        | To turn it off                                                                                                                       | To remove it                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Claude Code | `claude plugin disable jira@atlassian-beta-marketplace`, or use `/plugin` in a session. Turn it back on with `claude plugin enable`. | `claude plugin uninstall jira@atlassian-beta-marketplace` |
| Codex       | Remove the plugin (Codex has no separate disable command).                                                                           | `codex plugin remove jira@atlassian-beta-marketplace`     |

Not sure of the exact plugin name on your machine? Run `claude plugin list` or
`codex plugin list` and use the name shown.

## Troubleshooting

| What you see                                                                    | What to do                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The agent did not use the plugin for your Jira request                          | Start your request with `/jira:jira-workflows`, for example `/jira:jira-workflows show me PROJ-123`. If that works but the plain request did not, please let us know.                                                                                                                                                                                                                                                                                                                    |

For problems shared by every plugin, such as installation, `twg` and sign-in, see the
[main README](../../../README.md#troubleshooting) and [docs/troubleshooting.md](../../../docs/troubleshooting.md).

## Data and privacy

What this plugin reads, writes and sends is described in
[docs/data-and-privacy.md](../../../docs/data-and-privacy.md).
