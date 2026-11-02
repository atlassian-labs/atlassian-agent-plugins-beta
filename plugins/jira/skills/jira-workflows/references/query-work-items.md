# Query Work Items

## Scope

Once one key is confirmed, read that item's data through `read-work-item.md`.

## Search Or Query

Select the command by what the request carries:

| Trigger | Next |
| --- | --- |
| The request carries words rather than filters, and the target is Jira | `twg jira workitem search "<text>" --limit <n>` |
| The request carries a project, assignee, sprint, status, type, priority, label, or time constraint, a custom ordering, or a count | `twg jira workitem query --jql <jql>` |
| The request names a concrete board and its backlog order decides the answer | `twg jira board query --project <KEY>` for the board ID, then `twg jira board backlog query --board-id <ID>` |
| Semantic discovery across connected apps is asked for by name | `twg rovo search "<terms>" --app jira`, then read the selected keys. See `read-work-item.md`. |

Preserve the ordering the request asked for. Where the request asks what to pick next, order by Jira priority and rank, or by the named board's backlog order.

Pair a result with its relationship context only for a candidate whose relationships change which candidate is reported.

Treat a search snippet as discovery evidence, not as the item's authoritative state. Confirm a key before acting on it. See `read-work-item.md`.

Express a request for current assigned Jira work as an exact JQL query, not as a broad activity query.

State truncation wherever a limit prevented exhaustive coverage.

Do not pass a projection flag or an org scope that the Jira command's own contract does not advertise.

## One Candidate Was Implied And Several Came Back

Do not pick for the user, and do not infer intent from rank order.

Narrow once, adding one constraint the request already implied: project, assignee, recency, or status. Do not start a new search.

Then resolve on the surviving count:

| Trigger | Next |
| --- | --- |
| One candidate survives | State its key and summary, then proceed |
| Several candidates survive | Present a numbered list of key, summary, status, and updated, then stop for the user to choose |
| No candidate survives | Report the search that was performed, then offer creation. See `create-work-item.md`. |

Do not widen the search after no candidate survives.

Where two candidates' summaries do not separate them, read one candidate's `Why` and `Acceptance criteria` sections. See `read-work-item.md`.

## When A Query Misses

Three queries is the ceiling on one request, and widening after a miss counts as one. On the fourth, stop and ask the user to disambiguate.

Where a query reports a missing default site, relay the repair the command printed, then stop. Do not inspect auth files, and do not fall back to a broader query.

A query that found nothing may be pointed at the wrong site. State that possibility rather than reporting that the item does not exist.
