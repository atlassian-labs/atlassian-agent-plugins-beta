# Jira Administration

## Terms

| Term | Means |
| --- | --- |
| a configuration definition | A global or project-level Jira definition: a field, field context, screen, scheme, workflow, priority, issue type, component, version, filter, dashboard, board, or project setting. Distinct from a work item, which is one keyed record. |
| a work item | One keyed Jira record and its field values, comments, links, watchers, attachments, and transitions. Distinct from a configuration definition, which is not keyed. |

## Boundary

Do not use a command for a configuration definition to act on a work item, or the reverse.

Do not use `jira field create`, `jira field update`, or `jira field delete` to set a field value on a work item; a work item's field values go through `fields-and-transitions.md`.

Do not substitute an Atlassian organization administration command for a Jira product administration command.

## Command Families

Select the command family by the kind of definition. Take a leaf's flags from `twg jira <family> <leaf> --help`; this file names the leaves and not their flags.

| Kind | Read | Write |
| --- | --- | --- |
| Custom field definition | None under `jira field`. Read a field's current definition through `twg jira workitem field update-metadata --id <KEY>` on a work item that carries it. See `fields-and-transitions.md`. | `twg jira field create`, `update`, `delete`, `cancel-delete` |
| Issue type | `twg jira workitem types get --id <id-or-ari>` where the ID or ARI is known, else `twg jira workitem types query --project <project-key-or-id>` | None |
| Component | `twg jira space component get <id>`, `query`, `counts` | `twg jira space component create`, `update`, `delete` |
| Version or release | `twg jira space version get <id>`, `counts`; `twg jira space versions query` for a space's list | `twg jira space version create`, `update`, `delete`, `merge`, `move` |
| Filter | `twg jira filter get <id>`, `query` | `twg jira filter create`, `update`, `delete`, `change-owner`; `share` and `subscription` for sharing and subscriptions |
| Dashboard | `twg jira dashboard get <id>`, `query` | `twg jira dashboard create`, `update`, `delete`, `copy`; `gadget` for its gadgets |
| Board | `twg jira board get`, `query` | `twg jira board create`, `delete`; `quick-filter` and `view-settings` for its configuration |
| Space (project) setting | `twg jira space get <id-or-key>`, `query` | `twg jira space create`, `update`, `archive`, `restore`, `delete` |
| Priority | `twg jira workitem priorities query` | None |
| Status | `twg jira space status query --id-or-key <KEY>` for a space's statuses; `twg jira workitem statuses query --id <id-or-ari>` for one status by ID | None |
| Notification scheme | `twg jira space notification-scheme get` | None |
| Field context, screen, workflow, or any scheme other than notification | None | None |

Where the table says `None` for the operation asked for, report that `twg` exposes no command for it and stop. Do not substitute a work item command or a different definition kind's command.

`types query` also takes `--project-key`, `--project-id`, or `--issue <key>` to infer the project. Do not pass `--id` to `types query`; use `types get --id`.

## Configuration Mutations

Before issuing a configuration mutation:

1. Read the current definition with its kind's read command from `Command Families`.
2. Name every project and scheme the definition is used by.
3. State that list to the user and wait for approval before issuing the mutation.
4. After the mutation returns, read the definition back with the command from step 1.
