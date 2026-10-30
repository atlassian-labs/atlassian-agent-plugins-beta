# Jira Duplicate Detection

## Terms

| Term | Means |
| --- | --- |
| a candidate | A work item retrieved for comparison against the target, before any gate has been applied to it. |
| a generated alert family | A generated task family member whose firings are alerts. Distinct from a generated task family member, whose firings are not alerts. |
| a generated task family member | A work item one automated template raised, identified by that template plus the one identifier that varies between members. |
| the permitted fields | The only fields a decision rests on: key, summary, description, created time, project, work type, status, and URL. |
| the target | The work item being checked for having a duplicate. |

## Scope

Run JQL with `twg jira workitem query --jql '<JQL>' --limit <N> --output json --agent-fields data.issues.key,data.issues.summary,data.issues.created,data.issues.issueType.name,data.issues.status.name`. Bound the Jira candidate set before comparing.

Decide whether the target duplicates a work item created before it, or within the same calendar minute as it, on semantic meaning rather than on an exact text match.

## Safety Boundary

Do not create, edit, transition, comment on, link, or delete any Jira work item while detecting a duplicate.

Judge only from the permitted fields. Do not read or use the links or comments of the target or of any candidate.

Read the target and each candidate with `twg jira workitem get <KEY> --output json --agent-fields data.key,data.summary,data.description,data.created,data.project.key,data.issuetype.name,data.status.name,data.url`, without `--full`, `--comments`, or `--remote-links`. `--agent-fields` filters only the JSON output; in text mode the whole record prints. `work-item get` on a key the session scope lacks fetches it with `--full` and links the session to it, so use it only for a key already stored this session, as `work-item get --key <KEY> --scope session --fields key,summary,description,created,issuetype,status,site`: `project` and `url` are not declared fields of the stored record and fail with `Unknown field`, so take the project from the key prefix and the URL from `site` plus the key.

## Prior Cutoff

A candidate is prior where either holds:

1. Its created timestamp is earlier than the target's.
2. Its created timestamp carries the same year, month, day, hour, and minute as the target's, whatever the seconds.

Round the target cutoff to the minute in JQL.

## Duplicate Meaning

A broad report and a specific report can be duplicates where resolving one would resolve the other, and the split between summary and description can differ.

For a monitoring alert or an incident, require evidence in the permitted fields that both work items concern the same event or the same root cause. Repeated firing within 72 hours can be one event. A shared failure pattern across weeks or months does not settle the decision without that evidence.

A generated alert family is held to that same evidence rule. Its shared varying identifier is the evidence, and only while the firing is unbroken. Where a generated alert family stopped firing for more than 30 days and resumed, treat the later firing as a new event rather than collapsing it onto an original raised before the gap.

For a human-written bug, request, service desk item, or accessibility finding, time distance alone does not prevent a duplicate decision.

## Target Comparison

Read the target as `Safety Boundary` says, and record its permitted fields.

Classify the target as exactly one of: an alert or incident; an IT service desk request; a bug; a feature request or improvement; an accessibility finding; a generated task family member; a mirrored alert or tracking work item; a task or chore; or other. Classify a generated alert family as a generated task family member, not as an alert or incident.

Extract the comparison details the class calls for. For an alert, those are the alert name, service, environment, severity, and error type. For human-written work, those are the core product area, component, action, problem, and affected scope. Ignore the generic tokens: "issue", "problem", "ticket", "please", "need", and "Jira".

For a generated task family member, identify both the common template and the exact identifier that varies between members, such as a configuration name, a resource ID, or a control ID.

For a mirrored alert, identify the bracketed Jira key in the summary.

## Semantic Pass

Build the query from the comparison details, then run:

```bash
twg rovo search "<3 to 5 content words>" --app jira --limit 30
```

A query returns nothing at around eight words. Spend the 3 to 5 content words on the distinctive identifiers only: the alert name and error type, or the product area and the failing thing. Do not include a connective, punctuation, or text copied wholesale from the description.

Where `items` is empty, retry once with the two or three rarest tokens from the first attempt.

A result carries a title, a text snippet, and a browse URL, and no created time, project, work type, status, or relationship field. Take the key from the browse URL. Drop a result outside the user's JQL scope before hydrating it. Fetch the permitted fields for the highest-ranked results with native reads, then apply every gate below.

The pass is degraded only where the command is unavailable, exits non-zero, or reports `partial` true. On a degraded pass, continue with the JQL pass.

### Early Exit

Where at least one hydrated semantic result passes every gate and is a full match under `Match Criteria`, select from the passing candidates by `Rule Precedence` and skip the JQL pass.

## JQL Pass

Run one to three focused JQL queries where the semantic pass produced no full match. A semantic result can serve as a token hint.

Every candidate retrieval query includes `created <= "YYYY-MM-DD HH:MM"`. Pass a quoted date in `YYYY-MM-DD HH:MM`, `YYYY/MM/DD HH:MM`, or `YYYY-MM-DD` format: an ISO timestamp containing `T` or `Z` returns zero results with exit 0 and no error. Confirm the format before treating an empty JQL pass as a no-result.

Start in the target's project where its key is known, and include one cross-project query. Pass `ORDER BY created DESC` and a limit from 20 to 50, using 20 for a broad text search.

Choose the queries by the target's class:

| Trigger | Next |
| --- | --- |
| An alert or incident | Search the project by the identifying alert details, then by service or environment; search across projects by the rarest key token |
| A generated task family member | Search the project by the exact identifier, then by template plus identifier; search across projects by the exact identifier |
| A mirrored alert | Search all projects for the target key in brackets; where the target is itself a tracking work item with a bracketed key, read that key directly and confirm its created time |
| Human-written work | Search the project summary with two core tokens, then the project text with those tokens; search summaries across projects with the same tokens |

Do not issue a candidate retrieval query whose only purpose is to fetch the target key. A direct read of a known candidate key is a hydration call rather than a retrieval query.

## Gates

### Gate 0: Prior And Self

The candidate satisfies the prior cutoff, and its key differs from the target's.

### Gate 1: Type Compatibility

The primary types match: an incident to an incident, a bug to a bug, a feature request to a feature request, an IT request to an IT request, and an accessibility finding to an accessibility finding. A bug and a feature request about the same component fail this gate.

### Gate 2: Semantic Match

The two work items describe the same problem, request, need, or event. Decide it by whether resolving one would also resolve the other, and by whether the differences are confined to wording, level of detail, or perspective.

### Gate 3: Scope Compatibility

Product area, feature, component, and affected user, team, resource, or system match wherever both work items specify them.

### Gate 4: Alert Event Proximity

Apply this gate to an alert or an incident only. A generated alert family is held to the 30-day gap rule in `Duplicate Meaning` in this gate's place.

Two events within 24 hours pass where the other identifying details match. Two events more than 30 days apart fail without permitted-field evidence of the same event or root cause.

## Hard False Positive Filters

Apply these even where the semantic similarity is high:

1. A generated task family candidate carries the same varying identifier as the target.
2. Prefer the earliest original generated task. Discard a summary marked as an update, a revision, or a later version wherever an unmarked candidate exists, then choose the lowest-numbered key among those remaining. Where every match is marked as a revision, choose the lowest-numbered key.
3. A mirrored tracking work item carries the target key in brackets.
4. A recurring weekly or monthly task is not a duplicate unless it represents the same specific instance.
5. A candidate is not a duplicate where either its summary or its description carries no term beyond the generic tokens listed in `Target Comparison`.
6. Two different IT operations, such as a grant and a revoke, are not duplicates.
7. IT requests for different users, teams, or resources are not duplicates, unless the permitted fields show one request submitted twice.

## Match Criteria

A summary carries the match where its own identifying terms align with the target's: the alert identifiers, or the product area, component, action, and problem. A description carries the match where its body does the same. A candidate passing every gate meets at most one of these:

1. Full match: both fields carry the match, as with the same event or nearly the same semantic content.
2. Partial match: exactly one field carries the match, and the other is compatible while adding no evidence.
3. Contextual match: neither field carries the match alone. The match rests on project, work type, component, or created proximity, with the summary and description agreeing only in general terms.

Do not promote a candidate to a full match to reach the early exit. A gate-passing candidate meeting none of the three is not a duplicate. A hydrated semantic result passing gates 0 through 3 as a partial or contextual match remains eligible without reaching the early exit.

## Rule Precedence

Resolve every selection among candidates by these steps, in order:

1. Discard every candidate failing a gate.
2. Discard every candidate a hard false positive filter rejects. Do not apply filter 2's ordering at this step.
3. Where the target is a generated task family member, order the survivors by filter 2's ordering and select the first.
4. Where the target is of any other class, order the survivors by match criterion, full before partial before contextual, then by earlier created time, then by lower-numbered key, and select the first.

## Output

Where a candidate is selected, report its key, title, and URL, with one sentence on what settled it: the shared varying identifier, the bracketed key, or the fields that carried the match. Use the URL the native read returned; otherwise form the browse URL from the selected Jira site and the candidate key. Do not guess a Jira hostname.

Where the search completes and no candidate is selected, report "No duplicate found."

Where a permission gap or a failed search prevented a decision, report "Could not complete duplicate search: <brief reason>." Do not report it as a completed no-match.
