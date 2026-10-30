# Prepare A Branch

## Rules

`branch prepare` is the only writer. Do not run `git checkout`, `git branch`, `git stash`, `git worktree`, or `git fetch` yourself, and do not ask for confirmation before calling it. A decision the command needs comes back as a `warn` before any write.

Print `Preparing a branch for <KEY>...` before the call.

Exit `2` with nothing on stdout is an argument error, not a verdict: a malformed `--key`, or two of `--keep-changes`, `--stash`, and `--worktree` together. Fix the argument named on stderr and re-run.

The command takes no flag for the storage scope; it stores into the session scope where a session id resolves, else the plugin scope.

## Call

Run, and collect the verdict:

```bash
jira-cli.mjs branch prepare --key <KEY>
```

Add a flag only on its trigger:

| Trigger | Flag |
| --- | --- |
| The tree is not the session's working directory | `--path <absolute path>` |
| The user named the site, or chose one from a `site-unresolved` prompt | `--site <SITE>`. |
| The user asked what the branch step would do, not for it | `--plan-only` |
| User chose the base for a new branch | `--base default` for `origin/<default branch>`, `--base current` for the current branch, or `--base <ref>` for a ref the user named |
| User chose to carry the pending changes onto the new branch | `--keep-changes` |
| User chose to stash the pending changes first | `--stash` |
| User chose a fresh worktree, leaving this tree alone | `--worktree <absolute path>` |
| User asked not to fetch | `--no-fetch`. Skips the fetch of `origin/<default branch>`. |
| User named the branch | `--branch <name>` |

## Act On The Verdict

Act on `status` and `reasons[].code`:

| `status` | `code` | Next |
| --- | --- | --- |
| `pass` | `branch-reused`, `untracked-carried`, or none | Report |
| `warn` | `base-needed` | Ask: off `origin/<default branch>` (`--base default`) or off the current branch (`--base current`). Default `--base default`. Re-run with the flag. |
| `warn` | `changes-pending` | Ask: keep the tracked changes on the new branch (`--keep-changes`), stash them first (`--stash`), or a fresh worktree (`--worktree <absolute path>`). Default stop. Re-run with the flag. Where `detail` also counts untracked files, `--stash` takes them too. |
| `warn` | `lfs-checkout-failed` | Report the caveat; the branch is ready. |
| `warn` | `base-stale` | Report the caveat; the branch is ready. Do not re-run. Where its `cause` is `timeout` and `tree.fetch.source` is not `preference`, offer two answers and default neither: stop fetching for this repository (`jira-cli.mjs branch fetch-base off`), or keep fetching and stop being asked (`jira-cli.mjs branch fetch-base on`). Run the chosen command with `--path` where the call had it. |
| `fail` | `site-unresolved` | See `Site Unresolved` |
| `fail` | `not-authenticated` | Report `reasons[0].detail`; see `Authentication` in SKILL.md. |
| `fail` | `twg-not-found`, `work-item-not-found`, `not-a-work-item`, `not-a-git-tree`, `not-writable`, `no-origin`, `detached-head`, `default-branch-unknown`, `base-ref-missing`, `base-unknown`, `base-mismatch`, `write-failed`, `fetch-failed`, or other | Report `reasons` and stop |

Where `base-needed` and `changes-pending` are pending in one `warn`, ask both, then re-run once with both flags.

A `write-failed` or `base-mismatch` reason carries a `step` field naming the write that failed: `stash`, `worktree`, `create`, `checkout`, or `confirm-base`.

## Site Unresolved

Render the verdict's `sites` field with `jira-cli.mjs cloud-sites render -` on stdin, passing it through unchanged. Open the reply with that output verbatim, then ask which number to use, and stop. Do not use `AskUserQuestion` for the choice, and do not retype or abbreviate the list into prose. The chosen number maps to that row's `name`, passed as `--site <name>` on the re-run.

## Report

Print `panels` verbatim where it is not empty. Do not narrate it instead. Where it is empty, name `after.branch`, or `plan.branch` under `--plan-only`, in one sentence.

Where `reasons` carries `untracked-carried`, say its `detail` in one sentence. Where `plan.changes` is `stashed`, tell the user the stash's name, `applied[0].stash` (`stash@{0}`). Do not pop it. Where `after.path` is a worktree the command created, name the path. Any work that follows in the session happens at `after.path` on `after.branch`.

Where a `fail` verdict's `tree.fetch` has `source` `preference` and `enabled` `false`, state that the fetch was skipped for this repository.
