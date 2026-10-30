# Read A Work Item

## Choosing The Starting Point

Start at the step this table names, and stop at the first step that answers the question:

| Trigger | Next |
| --- | --- |
| The key is held | `One Command For A Known Key` |
| The key is not held | `query-work-items.md` |

## One Command For A Known Key

Read a key with one command, whether or not it was read before this session:

```bash
jira-cli.mjs work-item get --key <KEY> [--site <SITE>] [--refresh] [--render [--comments]] [--fields <a,b.c> | --full]
```

It answers from the session's stored record, reading Jira and storing the record first where the session holds none. Pass `--site` only where the user named the site or chose one from a `site-unresolved` prompt. Add the other flags on their triggers:

| Trigger | Flag |
| --- | --- |
| The user says the item changed, or a write landed outside this CLI since the last read | `--refresh`: read Jira and replace the stored record |
| The user asked to see, show, read, fetch, or summarise the item | `--render`, with `--comments` for the thread. Open the answer with the output verbatim, then answer the rest of the question in prose. Do not redraw the key, summary, status, assignee, priority, or parent as a table of your own, and do not repeat the description. A read made on the way to another step draws no panel. |
| Only named fields are needed | `--fields <a,b.c>`; excludes `--render` |
| A project custom field, Jira bookkeeping, or the raw description is needed | `--full`: the whole stored record; excludes `--render` and `--fields` |

Without `--render` or `--full`, stdout is the stored Work Item cut to the fields worth acting on. The `description` is markdown, whole, with whatever headings the author wrote (a templated item has `## Why`, `## Where`, `## Acceptance criteria`, and so on). Comment bodies are markdown too. Read a section from the description by its heading.

`remoteLinks` carries an attached pull request, branch, commit, or Confluence page. Treat an empty `remoteLinks` as the item's real state. The default output also carries `issuelinks` and the comment thread as one `comments` array. It leaves out the project `customfield_*` keys, Jira bookkeeping such as `expand` and `watches`, and `cloudId`.

For 1 to 3 known keys, read each with its own `work-item get` call. For 4 or more, use one call:

```bash
twg jira workitem bulk-get <KEY> <KEY>
```

### When The Session Link Needs An Upgrade

On `warn` with `twg-upgrade-required`, use `item` as the fetched record or open the answer with
`panels` verbatim under `--render`. Then report `reasons[].detail` and continue handling the request. Follow
`Session Link Warnings` in SKILL.md for retrying after an update.

### When The Jira Read Fails

Where `work-item get` reads from Jira and that read fails, or cannot settle the site to read on, it exits 0 with a JSON verdict on stdout in place of the record or panel: `status` is `fail`, and `reasons[0].code` is one of the codes below. Nothing was stored.

| `code` | Next |
| --- | --- |
| `site-unresolved` | The key was not readable on the site tried, or no one site could be settled on. `sites` carries the candidates. Render it with `cloud-sites render`, passing the field through unchanged, open the reply with that output verbatim, ask which number to use, and stop. Do not retry against a candidate unprompted. |
| `twg-not-found` | Report `reasons[0].detail`; see `twg` in SKILL.md. |
| `not-authenticated` | Report `reasons[0].detail`; see `Authentication` in SKILL.md. |
| `work-item-not-found`, `not-a-work-item`, `fetch-failed` | Report `reasons[0].detail`. It counts as a failed attempt under `When A Read Fails`. |

```bash
jira-cli.mjs cloud-sites render - <<'JSON'
<the verdict's sites field, verbatim>
JSON
```

Do not use `AskUserQuestion` for that choice, and do not retype or abbreviate the list into prose instead. The chosen number maps to that row's `name`, passed as `--site <name>` on the re-run.

## When Get Is Not Enough

Use one command per need:

| Trigger | Next |
| --- | --- |
| Field or status history is needed | `twg jira workitem changelog query --issue-id <KEY>` |
| Issue-to-issue links are needed: blocks, duplicates, relates | `twg jira workitem link query --issue-id <KEY>` |
| Attached files are needed | `twg jira workitem attachment query --issue-id <KEY>` |
| Valid transitions or editable field metadata are needed | See `fields-and-transitions.md`. |
| Relationships to documents, goals, people, or external URLs are needed | `twg context jira workitem <KEY> --detail summary` |
| The meaning of a description section is needed | `jira-cli.mjs template show <NAME> --kind work-item`: the `guidance` of the field whose `heading` is the section. Take `<NAME>` from `template list --kind work-item`, the template whose `heading`s match the item's section headings. |

The stored record carries every `customfield_*` key; a nested `id` or `accountId` inside its value is stripped, and a string value over 4000 characters is truncated. Read a custom field value from `work-item get --key <KEY> --full`, under its `customfield_*` key, rather than through a Jira administration field command: `--fields customfield_*` fails with `Unknown field`.

## When A Read Fails

Do not vary the key's spelling, inspect auth files, or fall back to a broader query.

Two failed attempts at the same data is a stop: report what was tried and what came back rather than varying the call a third time. A call that never reached Jira and a repeat the CLI itself recommends do not count as attempts.
