# Self Improvement CLI

The npm CLI is the supported team installation path. It installs the skill files and configures Claude Code / Codex hooks in one command.

## Install

```bash
npx self-improvement-skill install
```

This installs the skill into:

- `~/.claude/skills/self-improvement`
- `~/.codex/skills/self-improvement`

It also writes managed hooks into:

- `~/.claude/settings.json`
- `~/.codex/hooks.json`

Install for one platform only:

```bash
npx self-improvement-skill install --target claude
npx self-improvement-skill install --target codex
```

## Check

```bash
npx self-improvement-skill doctor
```

Machine-readable output:

```bash
npx self-improvement-skill doctor --json
```

## Distill

```bash
npx self-improvement-skill distill
```

Custom thresholds:

```bash
npx self-improvement-skill distill --min-evidence 3 --min-distinct-tasks 2
```

## Uninstall

Remove managed hooks only:

```bash
npx self-improvement-skill uninstall
```

Remove managed hooks and installed skill files:

```bash
npx self-improvement-skill uninstall --remove-files
```

Limit uninstall to one platform:

```bash
npx self-improvement-skill uninstall --target claude
npx self-improvement-skill uninstall --target codex
```

## Notes

The CLI owns setup directly so team users do not need to edit hook files or run internal scripts. Hook details are documented in [HOOKS_INSTALL.md](HOOKS_INSTALL.md).
