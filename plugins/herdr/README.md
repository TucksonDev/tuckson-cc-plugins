# herdr

Claude Code skills for sessions running inside [herdr](https://herdr.dev) panes.

## Skills

### `/herdr:fork-session [claude|codex] [prompt]`

Fork the current session into a new herdr pane. The first word picks the agent that opens there; it defaults to `claude`. The rest is an optional prompt the new session starts with. The bare `/fork-session` works too when nothing else uses that name.

```
/herdr:fork-session
/herdr:fork-session try the other approach
/herdr:fork-session codex
/herdr:fork-session codex port this to Python
```

**Claude** gets a real fork: a separate Claude Code session that starts with the full conversation so far, so you can try a different approach without losing your place in the original.

**Codex** can't read Claude's session format, so it gets a handoff instead. The skill renders the transcript as Markdown and starts Codex with a prompt that tells it to read that file first, then continue with your prompt, or summarize where things stand and ask what to do next. The rendering keeps user and assistant messages, one line per file Claude created or edited, and nothing else: no tool output, no thinking. It follows the live conversation only, so rewound branches are left out. There is no size cap. The file is written to `$TMPDIR/herdr-handoff/<session-id>.md`, outside the repo.

Everything in that file is sent to OpenAI. Claude's own replies can quote tool output, so check the transcript if the session touched secrets.

## Requirements

- [herdr](https://herdr.dev), with Claude Code running inside a herdr pane
- Claude Code 2.1.292 or later (tested on 2.1.312)
- `jq`
- The Codex CLI, for `codex`

## Install

```bash
claude plugin install herdr --marketplace TucksonDev/tuckson-cc-plugins
```

Or inside a session: `/plugin install herdr --marketplace TucksonDev/tuckson-cc-plugins`.

To try it for one session without installing, from a clone of the marketplace repo:

```bash
claude --plugin-dir ./plugins/herdr
```

## How the Claude fork works

1. The skill runs `fork-session.sh` before Claude sees the message, with the current session ID substituted in.
2. The script asks herdr for the pane's size, splits it (right if wide, down if tall) with the same working directory, and focuses the new pane.
3. In the new pane it runs `claude --resume <session-id> --fork-session`, which copies the saved transcript into a new session ID. The original session is untouched.

## Notes

- The fork contains everything saved up to your previous turn. The `/herdr:fork-session` message itself is not included. The same applies to the Codex handoff.
- To keep focus in the original pane, change `--focus` to `--no-focus` in `skills/fork-session/fork-session.sh`.
- A prompt containing a double quote breaks the command's quoting.
- Outside herdr the command prints the manual `claude --resume <id> --fork-session` line instead.
