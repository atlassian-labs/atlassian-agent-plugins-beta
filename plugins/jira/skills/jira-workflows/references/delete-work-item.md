# Delete A Work Item

## Boundary

A delete is irreversible: the item's comments, links, and history go with it, and `twg jira workitem delete` neither prompts nor takes a confirmation flag.

A request to close, resolve, or cancel an item is not a delete. Route it to `fields-and-transitions.md`.

Where the request names neither operation, as "get rid of it" does, ask which is meant.

## Confirming The Delete

**Read the item.** Read the item by the key the request named and state its key, summary, status, and assignee. See `read-work-item.md`. Where the read does not return the key, stop and report what came back. Do not resolve the key through a search (`query-work-items.md`) on this path.

**Offer the close.** Where the item's `status.statusCategory.key` is not `done`, offer:

| Option | What happens |
| --- | --- |
| Delete the item | the item, its comments, its links, and its history are removed, with nothing recoverable |
| Close the item instead | the item stays, and a transition moves it to a done status |
| Neither | nothing is written |

Default: neither. Where the user chose the close, route to `fields-and-transitions.md`. Where the user chose neither, stop. An item whose `status.statusCategory.key` is already `done` gets no offer and continues to `Subtasks`.

**Subtasks.** List the subtasks with `twg jira workitem query --jql 'parent = <KEY>'`, state every key returned, then offer:

| Option | What happens |
| --- | --- |
| Delete the item and the listed subtasks | `--delete-subtasks true` is passed, and every stated key is removed |
| Delete the item only | `--delete-subtasks` stays false, and the subtasks stay |

Default: delete the item only.

**Confirm.** Name the key, and every subtask key where those are included, and obtain a reply containing the word "delete". A reply of "yes" or "go ahead" is not one. Where the reply lacks it, ask a second time with the key and the word "delete" in the question. Where the second reply still lacks "delete", stop and report the delete as unconfirmed.

**Permission.** Report a permission error, naming the Delete Issues project permission. Do not retry it or route around it.

## Deleting

Give each item its own read, its own confirmation, and its own command, one key per command:

```bash
twg jira workitem delete <KEY>
```

Report the deleted key, or any error the command returned. Do not read the item back.
