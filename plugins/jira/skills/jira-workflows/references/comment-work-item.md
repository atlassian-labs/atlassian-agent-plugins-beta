# Comment On A Work Item

## Call

Post a comment through `jira-cli.mjs work-item comment`. Do not run `twg jira workitem comment create` yourself. Run it and collect the verdict:

```bash
jira-cli.mjs work-item comment --key <KEY> --body "<text>" [--body-format html|markdown|plain] [--site <SITE>]
```

For a single-line plain-text body, pass `--body-format plain` and skip `rich-content.md`. Pass `--site` only where the user named the site or chose one from a `site-unresolved` prompt.

## Act On The Verdict

| `status` | `code` | Next |
| --- | --- | --- |
| `pass` | none | Report the comment |
| `warn` | `twg-upgrade-required` | Report the comment as posted; see `Session Link Warnings` in SKILL.md |
| `warn` | `comment-unconfirmed` | Report the caveat. Do not post again: the comment may exist. |
| `warn` | `link-unresolved` or `link-failed` | Report the comment as posted, naming the caveat |
| `fail` | `site-unresolved` | See `Site Unresolved` |
| `fail` | `not-authenticated` | See `Authentication` in SKILL.md |
| `fail` | `comment-failed`, `twg-not-found`, or other | Report `reasons` and stop |

## Site Unresolved

Render the verdict's `sites` field with `jira-cli.mjs cloud-sites render -` on stdin, passing it through unchanged. Open the reply with that output verbatim, then ask which number to use, and stop. Do not use `AskUserQuestion` for the choice, and do not retype or abbreviate the list into prose. Do not retry against a candidate unprompted. The chosen number maps to that row's `name`, passed as `--site <name>` on the re-run.
