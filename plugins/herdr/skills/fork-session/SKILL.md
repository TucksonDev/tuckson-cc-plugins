---
name: fork-session
description: Fork the current Claude Code session into a new herdr pane, as Claude or as Codex with a transcript handoff.
argument-hint: [claude|codex] [prompt]
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/fork-session.sh:*)
---

!`${CLAUDE_SKILL_DIR}/fork-session.sh ${CLAUDE_SESSION_ID} "$ARGUMENTS"`

The fork has already been started by the command above. Relay its output line to the user in one sentence and stop. Do not run any tools.
