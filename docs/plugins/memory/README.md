# Memory plugin

> [!NOTE]
> **Early Access Program (EAP) notice:** Code memories is available to customers in the Early Access Program (EAP). Behaviour, controls and retention may change before general availability. Your use during the EAP is governed by the Free or Beta Product terms in the [Atlassian Customer Agreement](https://www.atlassian.com/legal/customer-agreement).

# What are code memories?

Code memories provide a shared memory layer for AI coding agents. They enable agents to persist what they've learned, carry organizational knowledge across sessions, and retrieve the right context at the right moment.

Today, agent sessions are largely ephemeral - when a terminal or chat closes, the agent's learnings vanish, and team members must repeatedly teach their agents the same codebase and organizational nuances. Code memories reduce this friction through three core capabilities:

- **Persist learning beyond the session**: Automatically extracts durable decisions, codebase conventions, and debugging pitfalls from completed agent runs so lessons aren't lost.
- **Carry organizational knowledge across teams and tools**: Centralizes repository knowledge in the Teamwork Graph, meaning a convention discovered via Codex or Claude Code is instantly available to teammates for their own coding sessions.
- **Retrieve context at the right moment**: Uses semantic recall to surface the relevant decisions, file pointers, and constraints when an agent begins a task. Code memories capture things that are hard to rediscover each time, for example:

- **Decisions**: "We chose X over Y for the payments client because…"
- **Conventions**: "Tests in this repository use fixtures from `/test/support`, not inline mocks."
- **Pitfalls**: "Running the migration locally fails unless the cache container is running first."

Each memory belongs to a repository, and can point to a specific directory, file, code symbol or tool within it. When anyone with access to that repository starts a new agent session, their coding agent can recall the relevant memories as context.

Memories are machine-readable context for coding agents. They aren't shown in a human-facing view.

Today Code memories work with:

- **Claude Code** and **Codex**, desktop app or command line, through the respective Atlassian plugins
- **Jira Coding Agent**
- **Rovo CLI**

> [!WARNING]
> **Note on third-party coding agents:** Claude Code and Codex are third-party products. When you run a session with a third-party agent, your prompts and code are sent to that provider and governed by its terms. You are responsible for assessing each provider's security and suitability and for managing all third-party provider costs, API capacity and agent actions. (Jira Coding Agent and the Rovo CLI run within Atlassian.)

# Before you start

You need all of the following.

### 1. Admin enablement

An organization admin has to turn the feature on. It's off by default.

1. Go to **Atlassian Administration** > **AI and Rovo** > **Agents** > **Sessions [Beta]**.
2. Read and accept the disclosures.
3. Turn on **Capture full transcripts** of all agent sessions so your agents can reuse them as context.

When the admin turns this on, Atlassian starts capturing and sanitizing agent session transcripts from users who have installed the plugin, and creates code memories from them.

### 2. A connected Bitbucket Cloud or GitHub repository

Code memories are created only for work that can be linked to a code repository connected to Atlassian through either:

- **Bitbucket Cloud**, or
- **GitHub for Atlassian**

Ask your admin to check that the repositories your team works in are connected.

### 3. The plugin for your coding agent (Claude Code or Codex only)

**You'll need:**

- Claude Code or Codex (desktop or command line)
- Node.js 22 or later
- Permission to add the early-access plugin marketplace, a GitHub repository at `github.com/atlassian-labs/atlassian-agent-plugins-beta`. If your organization restricts which plugin marketplaces can be added, ask your admin to allow it first.
- Atlassian's **twg** command-line tool, installed and signed in. See the [twg installation guide](https://developer.atlassian.com/cloud/twg-cli/getting-started/installation/). To sign in, run `twg login` in your own terminal.
- Git

**Set up Claude Code**

```
claude plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git

claude plugin marketplace update atlassian-beta-marketplace

claude plugin install memory@atlassian-beta-marketplace
```

Start a new Claude Code session, then run `claude plugin list` to check the plugins are active.

**Set up Codex**

```
codex plugin marketplace add https://github.com/atlassian-labs/atlassian-agent-plugins-beta.git

codex plugin marketplace upgrade atlassian-beta-marketplace

codex plugin add memory@atlassian-beta-marketplace
```

Start a new Codex session, then run `codex plugin list` to check the plugins are active.

### 4. Acknowledge the notice

The first time you run a session after your admin has turned the feature on, your agent shows a notice explaining that your session transcripts will be captured and used to create code memories. Transcript capture for you starts only after you acknowledge it.

# How code memories are created

1. **Your session ends.** When an agent session finishes, the plugin uploads the session transcript to Atlassian. This includes your prompts, the agent's responses, and tool output such as command results.
2. **The transcript is sanitized.** Atlassian scans the transcript file content and attempts to redact sensitive content (see the next section for details).
3. **Memories are extracted.** A third-party large language model reviews the sanitized session transcript and picks out reusable knowledge about the repository: decisions, conventions and pitfalls.
4. **Memories are checked and saved.** Each candidate memory is checked against a defined format, and only valid ones are saved. Memories are designed to extract only from code-related activity that can be linked to a connected repository.
5. **Memories are recalled in future sessions.** When an AI coding agent runs a new session in future and accesses the repository, Atlassian code memories will recall relevant memories for the agent to reference.

> [!NOTE]
> Memories aren't reviewed, edited or deleted by Admins or end users before they're saved. Creation is automatic.

# What data does Atlassian store?

When the feature is enabled, Atlassian stores the following for each captured session:

| **What is stored** | **Details** | **Who can access it** |
| --- | --- | --- |
| Raw transcripts | The full session, including your prompts, the agent's responses, and tool output such as file contents and command results.<br>Stored in an isolated store readable only by the processing pipeline, this data remains until sanitization, memory extraction, and any needed troubleshooting complete. Transcripts are deleted after 30 days. | This is designed to be accessed solely by the processing pipeline and not for human review.<br>Raw transcripts are deleted automatically after 30 days. |
| Sanitized transcripts | The transcript after sensitive content has been detected and redacted. | This is designed to be accessed solely by the processing pipeline and not for human review.<br>Sanitized transcripts are kept for the length of the Early Access Program, unless you ask for deletion. |
| Code memories | Short, structured notes about a repository (decisions, conventions, pitfalls), each linked to a repository.<br>Memories belong to the repository, not the agent. A memory created in a session with one coding agent (for example, Codex) can be recalled in a session with another (for example, Claude Code).<br>Code memories are stored in your site's Teamwork Graph and kept logically isolated per site. Your transcripts and memories are not pooled or combined with any other customer's data, and are never surfaced to another customer. | Coding agents run by anyone on your site who has read access to that repository and has installed the plugin. Memories are recalled as agent context, and there is no human-facing view during the EAP.<br>Code memories: kept until your Jira subscription terminates. Stale or invalid memories may be pruned. |

**Visibility and control during the EAP**

Users and admins can't view, edit or delete individual transcripts or code memories. Atlassian is collecting feedback from EAP customers on what visibility and governance controls they need before building them. See "Turning it off and requesting deletion" for what you can do today.

Turning off transcript capture doesn't delete existing transcripts or code memories. To delete them, contact Atlassian Support (see "Turning it off and requesting deletion").

# How transcripts are sanitized

Before a raw transcript is used for code memory creation, Atlassian scans it and attempts to redact sensitive content:

- **Secrets and credentials**, such as API keys, tokens and passwords
- **Personal information (PII)**, such as email addresses and phone numbers

The scanning uses the same technology behind Atlassian Guard, with an Atlassian-managed policy. It understands the structure of transcripts, so it can redact values without breaking the transcript. Detected values are replaced with a redaction marker.

> [!NOTE]
> **Redaction is best effort.** No automated scanner catches everything, especially names, identifiers or context that doesn't follow a known pattern. Follow the best practices below to limit what ends up in a transcript.
>
> Best practices for your agent sessions:
>
> - **Keep secrets out of prompts.** Don't paste credentials, tokens or connection strings into a session. Use environment variables or a secrets manager.
> - **Limit personal and customer data.** Use test or synthetic data instead of real customer records when debugging.
> - **Pause capture for sensitive work.** Run `/twg session set upload disable` before a session involving confidential material, and turn it back on afterwards.
> - **Be clear about decisions.** Memories come from what happens in the session. Saying *why* you chose an approach helps the agent capture a useful decision.
> - **Make sure your sessions follow all applicable policies** before you start.

## Turning it off and requesting deletion

**As a user**

You can stop your own sessions from being captured at any time, and turn capture back on later. Run the following commands inside your Claude or Codex session:

```
twg session set upload disable
twg session set upload enable
```

Your choice applies to your third-party coding agent, Jira Coding Agent and Rovo CLI.

**As an admin**

Turn off the **Sessions [Beta]** setting in Atlassian Administration, and transcripts capture stops straight away.

> [!NOTE]
> Turning it off doesn't delete existing transcripts or code memories.

**Deleting data**

To delete existing transcripts and code memories for your site, contact [support.atlassian.com](http://support.atlassian.com). Include:

- Your site URL and organization ID
- That you're asking to delete **code memories and agent session transcripts**
- Whether you want all data for the site deleted, or data for specific repositories

Atlassian deletes the data manually and confirms when it's done.

**Excluding specific users**

Admins can ask Atlassian Support to exclude named users from transcript capture and memory creation altogether.

# Known limitations

Code memories is an early-access feature. Please be aware of the following limitations before relying on it.

| **Limitation** | **Details** |
| --- | --- |
| Redaction is best effort | Automated redaction does not catch everything, especially names, identifiers or context that does not follow a known pattern. Follow the best practices above to limit what ends up in a transcript. |
| No human-facing view | During the Early Access Program there is no interface to browse, search or review memories directly. They are only recalled as agent context. |
| No per-code memory edit or delete | You cannot edit or delete an individual memory or transcript during the EAP. Deletion is handled per site or per repository through Support. |
| No data residency support | Transcripts and memories are stored and processed in the United States. Data residency is not available during the EAP. If your organization has data residency obligations, confirm that participation is permissible before enabling. |
| Supported SCMs (EAP) | Only Bitbucket Cloud and GitHub for Atlassian are supported. Other source code management platforms are not yet available. |

## Best practices for enabling and using code memories

- **Review your codebase and workflows for sensitive data.** Transcripts can include file contents and command output. Where practical, remove hardcoded secrets, keys and PII from repositories, and use test or synthetic data when debugging. Keep sensitive data out of sessions. Don't paste credentials, tokens or connection strings into a session, and pause capture (`/twg session set upload disable`) before confidential work.
- **Confirm your data residency requirements.** Transcripts and memories are stored in the United States. If your organization restricts processing to other regions, confirm that EAP participation is permissible before enabling.
- **Confirm you have the necessary rights and approvals** for Atlassian to capture, sanitize, store and process your agent session transcripts for the purpose of providing this feature.
- **Make sure participation follows all applicable policies** before you turn the feature on.
- **Verify memories before acting on them.** Review AI suggestions related to your code base. Treat them as hints, not authoritative facts, particularly in critical contexts.
- **Manage repository permissions.** Memory recall is scoped to users with read access to the repository in the source SCM. Ensure repository permissions are correctly configured and up to date.

# Feedback and support

We actively want your feedback to help us improve code memories:

- Share what works, what doesn't, and what you'd like to see next with your designated Atlassian EAP contact, or through the standard Atlassian support channel.
- We will also regularly check in to see how we can support your use of the feature.

To request deletion of transcripts or memories, contact <http://support.atlassian.com> as described above. For general questions, contact your Atlassian product team.
