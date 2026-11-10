# Epics

## Commands

Pass `--site` only where the user named the site or chose one from a `site-unresolved` prompt.

| Trigger | Next |
| --- | --- |
| An epic's children, progress, or status | `jira-cli.mjs epic get --key <KEY> [--site <SITE>] [--refresh] [--render]` |
| Recent, prior, or "my" epics | `jira-cli.mjs epic list [--all] [--limit <n>] [--show-archived] [--render]` |
| Recent work, or the items the user read, grouped by project, whatever their epic | `jira-cli.mjs recent list [--all] [--limit <n>] [--show-archived]` |
| The user asks to hide or restore a recent-work item | `jira-cli.mjs recent archive --key <KEY> [--undo]` |
| The user asks to refresh stored epics with no question to answer: one, or every stale one | `jira-cli.mjs epic refresh --key <KEY>`, or `jira-cli.mjs epic refresh --stale [--older-than <duration>]`, `1d` unless given |
| The user asks to hide or archive an epic, or to bring one back | `jira-cli.mjs epic archive --key <KEY>`, or `jira-cli.mjs epic archive --key <KEY> --undo` to restore it |

`epic get` answers the stored record, reading Jira and storing first where none is stored, under `--refresh`, or where the children were never fetched. It takes no `--fields`. Use the stored record unless the user asks for current state; then pass `--refresh`. Anything richer about one child is `work-item get` on the child.

Progress counts direct children only; a story's sub-tasks are counted apart.

`epic list` reads the store only: the epics touched from this repo, newest first, 20 unless `--limit` says otherwise; `--all` lists every repo. It leaves archived epics out unless `--show-archived` is passed.

`recent list` reads the store only and groups the items by project, from this repo, 20 in all unless `--limit` says otherwise; `--all` lists every repo; archived items are left out unless `--show-archived` is passed.

`epic archive` only marks the stored record; `epic refresh --stale` skips archived epics, and `epic refresh --key` still reads one.

Under `--render`, open the reply with the panel verbatim, then answer the rest of the question in prose. Do not redraw the children as a table of your own.

## Output

| Command | stdout |
| --- | --- |
| `epic get` | the stored epic as JSON, `children` each `key`, `summary`, `status`, `issuetype`, `assignee`, `blockedBy` (the keys it is blocked by, absent where none), and `subtasks` (the child's sub-tasks, same shape without `blockedBy`; `assignee` only once the sub-task was read itself; absent where none); `childrenTruncated` is true where the fetch stopped at 500 children: say so |
| `epic list` | `{ codebase, filter, epics }`: `filter` is `codebase` or `all`, each epic in the `epic get` shape |
| `recent list` | `{ codebase, filter, groups }`: each group a `projectKey` and its `items`, each in the epic child shape with its touch times |
| `recent archive` | a verdict with `archived`: `pass`, or `warn` with `item-not-found` where nothing was stored under the key |
| `epic refresh` | a verdict: `pass` with `refreshed` and `skipped` key lists, `warn` per epic Jira could not read, `fail` where `twg` is missing |
| `epic archive` | a verdict with `archived` (true after an archive, false after `--undo`): `pass`, or `warn` with `epic-not-found` where nothing was stored under the key |

## When A Command Fails

A failure is a JSON verdict on stdout in place of the record or panel; `reasons[0].code` is one of:

| `code` | Next |
| --- | --- |
| `site-unresolved` | `sites` carries the candidates. Render and resolve it as `read-work-item.md`'s `When The Jira Read Fails` says. |
| `twg-not-found` | Report `reasons[0].detail`; see `twg` in SKILL.md. |
| `not-authenticated` | Report `reasons[0].detail`; see `Authentication` in SKILL.md. |
| `not-an-epic` | Read it with `work-item get` instead. |
| `epic-not-found`, `children-fetch-failed`, `fetch-failed` | Report `reasons[0].detail`. It counts as a failed attempt under `read-work-item.md`'s `When A Read Fails`. |
