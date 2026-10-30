# Claim A Work Item

## Rules

`work-item claim` is the only writer. Do not issue `twg jira workitem update` or `transition` yourself, and do not ask for confirmation before calling it.

Under `--prepare-branch`, the command runs `branch prepare` inside the claim: the branch step, whose verdict is the claim verdict's `branch` field.

Do not edit the tree, create or switch a branch, or reopen a complete item before the verdict is reported. See `After The Claim`.

Print `Claiming <KEY>...` before the call.

## Call

Run, and collect the verdict:

```bash
jira-cli.mjs work-item claim --key <KEY>
```

Add a flag only on its trigger:

| Trigger | Flag |
| --- | --- |
| The user named the site, or chose one from a `site-unresolved` prompt | `--site <SITE>`. |
| The user asked what a claim would do, not for one | `--plan-only` |
| User approved a takeover | `--take-over` |
| User chose to start without taking over | `--skip-assignee` |
| User chose a transition from `transition.candidates` | `--status "<candidate.to>"` |
| User supplied a screen-required value | `--field <customfield_id>=<value>`, once per field |
| The request was to work on, pick up, or execute the item, not only to claim it | `--prepare-branch` |
| The tree is not the session's working directory (relevant only with `--prepare-branch`) | `--path <absolute path>` |
| The tree's `origin` is already known fresh (relevant only with `--prepare-branch`) | `--no-fetch` |

The claim reads the item's `Acceptance criteria` section for its criteria count. An item whose section is headed `Done when` is read as the same section.

## Act On The Verdict

Act on `status` and `reasons[].code`:

| `status` | `code` | Next |
| --- | --- | --- |
| `pass` | `already-claimed`, `nothing-to-do`, or none | Report |
| `warn` | `assignee-takeover` | Ask: take over (`--take-over`), start without taking over (`--skip-assignee`), or neither. Default neither. Re-run with the flag. |
| `warn` | `transition-ambiguous` or `status-not-advertised` | List `transition.candidates` by `name` and `to`, ask which, re-run with `--status`. Never pick one. |
| `warn` | `transition-unavailable` or `read-back-mismatch` | Report, naming the caveat |
| `warn` | `branch-pending` | Where the caveat is about the branch's base, ask: off `origin/<default branch>` (`--base default`) or off the current branch (`--base current`), default `--base default`. Where it is about changes to tracked files, ask: keep them on the new branch (`--keep-changes`), stash them first (`--stash`), or a fresh worktree (`--worktree <absolute path>`), default stop. Re-run the branch step alone with the flag, as `Re-running The Branch Step` says. |
| `warn` | `branch-failed` | Report `branch.reasons`, then see `After The Claim`. |
| `fail` | `write-failed` | Report from `after`. If `applied.detail` names a required field, ask for its value and re-run with `--field`. Never unassign. |
| `fail` | `site-unresolved` | See `Site Unresolved` |
| `fail` | `not-authenticated` | Report `reasons[0].detail`; see `Authentication` in SKILL.md. |
| `fail` | `item-complete`, `twg-not-found`, `work-item-not-found`, `not-a-work-item`, `fetch-failed`, `user-unresolved`, or other | Report `reasons` and stop |

Where two decisions are pending, ask both, then re-run once with both flags.

Re-run without a new flag only when the call never reached Jira, and once.

### Re-running The Branch Step

Re-run the branch step alone, never through the claim command:

```bash
jira-cli.mjs branch prepare --key <KEY> <flag>
```

Carry `--path` and `--site` over from the claim call where it had them. Its verdict stands in for `branch`: a `warn` carrying `base-needed` or `changes-pending` is `branch-pending`, a `fail` is `branch-failed`, and a `pass` or any other `warn` is reported: print its `panels` verbatim, else name `after.branch`; say an `untracked-carried`, `lfs-checkout-failed`, or `base-stale` `detail`; on `base-stale`, offer the `fetch-base` choice as prepare-branch.md's `Act On The Verdict` says; do not pop a stash. Work at `after.path` on `after.branch`. Do not run `git checkout`, `git branch`, `git stash`, `git worktree`, or `git fetch` yourself.

## Site Unresolved

Render the verdict's `sites` field with `jira-cli.mjs cloud-sites render -` on stdin, passing it through unchanged. Open the reply with that output verbatim, then ask which number to use, and stop. Do not use `AskUserQuestion` for the choice, and do not retype or abbreviate the list into prose. The chosen number maps to that row's `name`, passed as `--site <name>` on the re-run.

## Report

Open the report by printing the verdict's `panels` field verbatim, where it is not empty. Do not narrate it, redraw its fields, or print `branch.panels`.

Then report, in prose, only what the table does not carry: a `warn` caveat from `reasons`, and the stash's name from `branch.applied[0].stash` where `branch.plan.changes` is `stashed`. Do not pop the stash. Any work that follows happens at `branch.after.path` on `branch.after.branch`.

Where `branch.reasons` carries `base-stale`, offer the `fetch-base` choice as prepare-branch.md's `Act On The Verdict` says, with the claim's `--path` where it had one. Where `branch` is a `fail` that shows the fetch was skipped by preference, state that, as prepare-branch.md's `Report` says.

## After The Claim

Where the user asked only to claim, assign, or start the item, stop at the report.

Where the user asked to work on, pick up, or execute the item, and the verdict was `pass` or a `warn` the report has named, continue into the work in the session: run `jira-cli.mjs work-item get --key <KEY>`, with the claim's `--site` where it had one, and implement against the description's `Acceptance criteria`, `Verification`, and `Out of scope` sections, else the description as written. Do not pass `--refresh`: the claim stored the item in the session scope. Do not continue after a `fail`, or while `branch-pending` stands unresolved. Where `branch-failed` stands after `Act On The Verdict` has been followed, ask once whether to continue on the current branch or stop, default stop.

Where `branch.action` is `skipped` and `branch.carriesKey` is `false`, suggest preparing a branch for the item in one sentence, naming it as `prepare a branch for <KEY>`. Do not run it unasked. Where the user asks for it, see `prepare-branch.md`.

Once the work is done and the item's `Verification` commands pass, offer publishing as the next step, naming it as `publish the changes for <KEY>`. Do not start it unasked. See `publish-changes.md`.
