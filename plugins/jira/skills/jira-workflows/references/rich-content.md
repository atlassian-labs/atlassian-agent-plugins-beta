# Jira Rich Content

## Body Format

`--body` on `jira-cli.mjs work-item comment` and `--description` on `twg jira workitem update` take HTML by default. Pass `--body-format markdown` or `--description-format markdown` for a markdown body, or `plain` for plain text. Do not pass Jira wiki markup, such as `h2. Heading`, `[label|url]`, or `*bold*`. Write a new item's description through `work-item create` (`create-work-item.md`), not `twg jira workitem create`.

Where the body carries more than one paragraph, a list, or a code block, pass it as a quoted heredoc in the body flag's value, `--body "$(cat <<'EOF'` ... `EOF` `)"` for a comment or the same under `--description` for a description. Neither command takes a file flag.

To rewrite one section of a templated description, write the whole description back with the other sections as read. Take what the section contains from the template's `guidance`, as `read-work-item.md` says.

## Mentions

Resolve the person to an Atlassian account ID before writing a mention. Do not invent an account ID.

For an HTML body, use this form:

```html
<span data-type="mention" data-user-id="AAID">@Display Name</span>
```

Use `[~accountId:AAID]` only under a `markdown` or `plain` body format. Where the body format is open to choice, use the HTML form.

## Confirming The Result

Where the body carried a mention, a link, a list, or a code block, check the written body: from the `work-item comment` verdict's `comment.body` for a comment, and by reading the item back for a description.
