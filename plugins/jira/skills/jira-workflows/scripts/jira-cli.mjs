#!/usr/bin/env -S OPENSSL_CONF=/dev/null node
// The fallback for skill text's bare jira-cli.mjs where bin/ is not on PATH. Named by
// this skill-relative path because Codex may not expand ${CLAUDE_PLUGIN_ROOT} in skill text.
import '../../../bin/jira-cli.mjs';
