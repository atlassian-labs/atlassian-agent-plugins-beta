#!/bin/sh
# Runs before `jira-cli.mjs hook link-prompt` on every Bash call,
# and exits without starting Node when the session can no longer be prompted:
# it was already shown the ask-to-link prompt, or it already holds a work item.
# Both are visible as files in the session's store, which is laid out as
# <data>/sessions/<session id>/memory/records/<URI-encoded key>.json
# (packages/storage). The data directory is resolved as the CLI resolves it
# (src/storage/plugin-data.ts): JIRA_DATA_HOME, then $HOME/.jira, which is
# what the CLI's os.homedir() answers wherever $HOME is set. CLAUDE_PLUGIN_DATA
# and JIRA_PLUGIN_DATA are ignored here as there.
#
# It only skips. Whenever it cannot tell (no data directory, no session id, an
# id it would have to encode), it hands off to the CLI, which decides as it
# always has. It reads file existence only, never file contents or the hook
# payload, which reaches the CLI untouched on stdin.
#
# Usage: sh link-prompt-gate.sh <plugin root>

root=$1
if [ -n "$JIRA_DATA_HOME" ]; then
  data=$JIRA_DATA_HOME
elif [ -n "$HOME" ]; then
  data=$HOME/.jira
else
  data=''
fi
session=${CLAUDE_CODE_SESSION_ID:-$CODEX_SESSION_ID}

case $session in
  '' | . | .. | *[!A-Za-z0-9._-]*) session='' ;;
esac

if [ -n "$data" ] && [ -n "$session" ]; then
  records=$data/sessions/$session/memory/records
  if [ -e "$records/jira%2Fmarkers%2Fprompt-link-shown.json" ]; then
    exit 0
  fi
  for item in "$records"/jira%2Fwork-items%2F*.json; do
    if [ -e "$item" ]; then
      exit 0
    fi
    break
  done
fi

exec "$root/bin/jira-cli.mjs" hook link-prompt
