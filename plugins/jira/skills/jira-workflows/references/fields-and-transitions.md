# Jira Fields And Transitions

## Terms

| Term | Means |
| --- | --- |
| a custom field | A field a project defines, carrying a `customfield_*` ID, reached through `--field` or `--fields-json`, and distinct from a system field. |
| a system field | A field Jira ships built in (Summary, Priority, Resolution, and similar), reached through `workitem get` and `workitem update`, and distinct from a custom field, which `update-metadata` returns. |

## Making A Change

Read the item's current values through `read-work-item.md`. Change only the fields the request names. Obtain the user's approval before issuing a field change, a description write included, or a transition. Write a description in a format `rich-content.md` accepts. Issue a field change and a transition as separate commands, read back each on its own, then report the item's key and URL.

## Custom And Required Fields

Before a create or an update, discover the field metadata for the project and work type (`customfield_*` IDs, display names, allowed values, required flags):

```bash
twg jira workitem field create-metadata --space <KEY> --type <TYPE>
twg jira workitem field update-metadata --id <KEY>
```

Use the `customfield_*` IDs in `--field` or `--fields-json`. Respect the metadata's required, allowed-values, schema, and operation constraints, and report a missing field or an unsupported operation as a configuration gap.

`update-metadata` returns custom fields alone unless `--include-system-fields` is passed, and carries no current values. Read a system field's current value by naming the field:

```bash
twg jira workitem get <KEY> --fields summary,priority,resolution
```

Write a system field through its own flag on `twg jira workitem update --id <KEY>`: `--summary`, `--description`, `--assignee`, `--type`, `--priority`, `--labels` (or `--add-labels` and `--remove-labels`), `--components` (or `--add-components` and `--remove-components`), `--fix-versions` (or `--add-fix-versions` and `--remove-fix-versions`), `--parent`, `--resolution`, `--due-date`, `--story-points`, `--original-estimate`, `--remaining-estimate`, `--sprint`, or `--team`. Do not route a system field through `--field`.

Read a system field's allowed values from the resource that owns them: `twg jira workitem priorities query`, `twg jira space status query --id-or-key <KEY>`, or `twg jira workitem types query --project <KEY>`. No resolutions resource exists: read the Resolution values in use from resolved items already read this session, or from a transition's `requirements`, and state that the reported set is a floor from observed usage rather than the site's full list.

Do not validate a field value through JQL: a JQL predicate naming a value that does not exist returns zero results and no error.

Do not supply the same field key through both `--field` and `--fields-json`.

`--field` values parse as JSON where the value is valid JSON. Quote as a JSON string any value that resembles a number, a boolean, or an object but is meant to stay a string.

## Transitions

In order:

1. **Read the status.** Read the work item's current status.
2. **Discover the transitions.** Discover the transitions available from that status by omitting `--transition-id`. This call is read-only and does not transition the work item:

   ```bash
   twg jira workitem transition --id <KEY> --site <SITE> -o json
   ```

   It returns the available transitions with their screen field requirements.

3. **Match the outcome.** Match the user's requested outcome to one advertised transition. Do not guess a transition ID from another project or another work type.
4. **Gather the screen fields.** Include every transition-screen field the selected transition's `requirements` marks required. Where the user did not supply a screen-required value, use the one allowed value the request names or plainly describes, and name it in the approval. Where none or several fit, ask, offering the allowed values. Do not infer from the target status alone, and do not read a request to cancel as implying `Won't Do`, `Declined`, `Duplicate`, or any other Resolution.
5. **Execute and read back.** Call again with `--transition-id <id>` and each screen field as `--field <field-id>=<value>`, then read back the resulting status.

Do not use a direct status-field update where Jira requires a workflow transition.
