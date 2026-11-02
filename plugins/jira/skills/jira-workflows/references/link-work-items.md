# Link Work Items

## Terms

| Term | Means |
| --- | --- |
| a devinfo write | A Jira Software development-information or provider write. No command in this file performs one. |
| a remote link | A Jira remote link, which each artifact link command writes. |

## Issue Links

Resolve both endpoints before writing a link. Resolve a key not already held through `query-work-items.md`.

`twg jira workitem link workitem --id X --target-id Y` makes X the _outward_ item: "X blocks Y", "X duplicates Y", "X depends on Y". Resolve this direction with `work-item link --dry-run` before asking for approval:

```bash
jira-cli.mjs work-item link \
  --key <SOURCE-KEY> --target <TARGET-KEY> \
  --relationship "<phrase the user used>" \
  [--link-type "<type name or id>"] [--site <SITE>] --dry-run
```

Read `status` from the verdict on stdout. On `"fail"` with `relationship-ambiguous`, ask the user which of the types named in `reasons[0].detail` they mean, then re-run with `--link-type "<name>"`. The phrase still decides direction; `--link-type` only picks the type. Pass `--link-type` only on that retry or when the user named a type. On `link-type-unresolved`, report the available names in `reasons[0].detail` and stop. On any other `"fail"`, report `reasons` and stop; nothing is written. On `"pass"`, show the user the resolved direction, `link.id` as the outward item and `link.targetId` as the inward item, and ask for approval before writing. Retain `link.linkTypeId`.

On approval, reissue the same command without `--dry-run`. That single call writes the link, reads it back, and asserts the stored direction. Read `status` from the verdict rather than trusting the call's exit status alone:

```bash
jira-cli.mjs work-item link \
  --key <SOURCE-KEY> --target <TARGET-KEY> \
  --relationship "<phrase the user used>" \
  [--link-type "<type name or id>"] [--site <SITE>]
```

On `"pass"`, report the link and the source item's URL. On `"fail"` with `direction-reversed`, the link was written backwards: delete it, re-create it with the endpoints swapped, then confirm the stored direction with `twg jira workitem link query --issue-id <SOURCE-KEY>`. Re-running `work-item link` would repeat the same write. To delete it, first read the link's own ID from that same `link query`, then:

```bash
twg jira workitem unlink workitem --link-id <LINK-ID> [--site <SITE>]
twg jira workitem link workitem --id <link.targetId> --target-id <link.id> --link-type-id <link.linkTypeId> [--site <SITE>]
```

taking the three values from the dry-run `pass` and `--site` from the `work-item link` call. On any other `"fail"`, report `reasons` and stop.

## Artifact Links

Attach a pull request, repository, deployment, build, branch, commit, Loom video, or meeting through the matching typed artifact link command: `jira workitem link pr`, `repo`, `deployment`, `build`, `branch`, `commit`, `loom`, or `meeting`. Do not use one in place of a devinfo write. Ask for approval before the write, then read the item back with `jira-cli.mjs work-item get --key <KEY> --refresh --fields remoteLinks` and report the link and the item's URL.
