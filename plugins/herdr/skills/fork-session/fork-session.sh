#!/bin/bash
# Usage: fork-session.sh <session-id> [arguments]
# Splits the calling herdr pane and starts a forked copy of the session in it.
# The first word of the arguments is the agent when it is a supported one; the rest is the prompt.
set -euo pipefail

session_id=$1
arguments=${2:-}
agent=claude
prompt=$arguments
case ${arguments%% *} in
  claude|codex) agent=${arguments%% *}; prompt=${arguments#"$agent"}; prompt=${prompt# } ;;
esac
test "${HERDR_ENV:-}" = 1 || { echo "Not inside a herdr pane. Run manually: claude --resume $session_id --fork-session"; exit 1; }

case $agent in
  claude)
    command="claude --resume $session_id --fork-session"
    test -n "$prompt" && command+=" $(printf '%q' "$prompt")"
    ;;
  codex)
    transcript=$(find "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects" -maxdepth 2 -name "$session_id.jsonl" | head -1)
    test -n "$transcript" || { echo "No transcript found for session $session_id"; exit 1; }
    handoff_dir=${TMPDIR:-/tmp}
    handoff="${handoff_dir%/}/herdr-handoff/$session_id.md"
    mkdir -p "$(dirname "$handoff")"
    title=$(jq -r 'select(.type == "ai-title") | .aiTitle' "$transcript" | tail -1)
    { printf '# Claude Code session: %s\n\nSession %s in %s\n\n' "${title:-untitled}" "$session_id" "$PWD"; jq -r -s -f "$(dirname "$0")/transcript.jq" "$transcript"; } > "$handoff"
    instruction="You are taking over a Claude Code session in this directory. Its transcript is at $handoff. Read the whole file before doing anything else, then ${prompt:-summarize where things stand in a few lines and ask what to do next}"
    command="codex $(printf '%q' "$instruction")"
    ;;
esac

rect=$(herdr pane layout --pane "$HERDR_PANE_ID" | jq -r --arg id "$HERDR_PANE_ID" '.result.layout.panes[] | select(.pane_id == $id) | "\(.rect.width) \(.rect.height)"')
read -r width height <<< "$rect"
direction=down
test "$width" -ge $((height * 2)) && direction=right

pane=$(herdr pane split --current --direction "$direction" --cwd "$PWD" --focus | jq -r '.result.pane.pane_id')
herdr pane run "$pane" "$command"
echo "Forked this session into herdr pane $pane as $agent (split $direction)."
