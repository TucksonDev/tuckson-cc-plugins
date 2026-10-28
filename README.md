# tuckson-cc-plugins

TucksonDev's Claude Code plugin marketplace.

| Plugin | What it adds |
| :- | :- |
| [herdr](plugins/herdr) | `/herdr:fork-session [claude|codex] [prompt]`: fork the current session into a new [herdr](https://herdr.dev) pane, as Claude or as Codex with a transcript handoff |
| [fitness](plugins/fitness) | A mod that suggests a desk-friendly exercise while Claude works and tracks what you did |

## Install

Add the marketplace once, then install what you want:

```bash
claude plugin marketplace add TucksonDev/tuckson-cc-plugins
claude plugin install herdr@tuckson-cc-plugins
claude plugin install fitness@tuckson-cc-plugins
```

Or add and install in one command:

```bash
claude plugin install herdr --marketplace TucksonDev/tuckson-cc-plugins
```

## Develop

Add the marketplace from your local clone so Claude Code reads the plugins in place:

```bash
claude plugin marketplace add ./tuckson-cc-plugins
claude plugin install herdr@tuckson-cc-plugins
claude plugin install fitness@tuckson-cc-plugins
```

To change a plugin:

1. Edit the files under `plugins/herdr` or `plugins/fitness`.
2. Validate from the repo root with `claude plugin validate . --strict`. For the fitness mod, `claude plugin test plugins/fitness` runs its tests.
3. Run `/reload-plugins` in a running session, or start a new one. In-place loads need no version bump.

Edits to a skill's shell script apply immediately. Changes to a `SKILL.md` or to a mod's hooks module need the reload.

To release to other people, bump `version` in the plugin's `.claude-plugin/plugin.json` before pushing. Users only get a new copy when that version changes.
