# Hooks Install

This package includes native hook handlers for Claude Code and Codex CLI. The supported setup path is:

```bash
npx self-improvement-skill install
```

## What The Hooks Do

Both platforms use the same learning loop:

1. `UserPromptSubmit`
   - if the prompt starts with a slash skill such as `/super-get-wiki`, track that skill as the current context
   - if the prompt looks like a correction, record a learning event against the last tracked skill
2. `Stop`
   - capture the latest assistant message when the platform exposes it
   - store that as `observed` context for the next correction

## Installed Locations

Skill directories:

- `~/.claude/skills/self-improvement`
- `~/.codex/skills/self-improvement`

Hook config files:

- `~/.claude/settings.json`
- `~/.codex/hooks.json`

## Files

- Claude user-prompt hook: [scripts/claude-hook-user-prompt-submit.js](scripts/claude-hook-user-prompt-submit.js)
- Claude stop hook: [scripts/claude-hook-stop.js](scripts/claude-hook-stop.js)
- Codex user-prompt hook: [scripts/codex-hook-user-prompt-submit.js](scripts/codex-hook-user-prompt-submit.js)
- Codex stop hook: [scripts/codex-hook-stop.js](scripts/codex-hook-stop.js)
- Claude config example: [integrations/claude/settings.example.json](integrations/claude/settings.example.json)
- Codex config example: [integrations/codex/hooks.example.json](integrations/codex/hooks.example.json)

## Installer Commands

The public CLI delegates to the same internal installers used by tests:

```bash
node scripts/install-team-skill.js
node scripts/install-claude-hooks.js
node scripts/install-codex-hooks.js
```

For team usage, prefer the public CLI command so users get the stable package entry point:

```bash
npx self-improvement-skill install
```

## Runtime Notes

Claude Code hooks are user-defined shell commands that run at lifecycle points such as `UserPromptSubmit` and `Stop`, with user-level config in `~/.claude/settings.json`.

Codex hooks can live in `~/.codex/hooks.json` or `~/.codex/config.toml`, and `UserPromptSubmit` plus `Stop` are turn-scoped hooks.
