# self-improvement-skill

Local, evidence-backed self-improvement for agent skills.

`self-improvement-skill` installs a `self-improvement` skill and optional
Claude Code / Codex hooks. When a user correction follows a slash-skill call,
the hooks can record that feedback as local learning evidence instead of
turning one-off feedback into an untraceable rule change.

中文文档见 [README.zh.md](README.zh.md).

## What This Is For

Use this project when you want agent skills to improve from real usage while
keeping the improvement loop auditable:

- record user corrections, failures, workarounds, and reusable success patterns
- keep raw evidence in local `.learnings/` files
- distill repeated lessons into promotion candidates
- decide later whether a candidate should become a durable skill rule

This project does not directly rewrite other `SKILL.md` files. It records
evidence and generates candidates so humans can review changes before promoting
them.

## Requirements

- Node.js 18 or newer
- Claude Code and/or Codex CLI, if you want hook-based recording
- A local environment where the CLI may write to `~/.claude` and/or `~/.codex`

## Quick Start

Install for both supported platforms:

```bash
npx self-improvement-skill install
```

Install for one platform only:

```bash
npx self-improvement-skill install --target claude
npx self-improvement-skill install --target codex
```

Check the installation:

```bash
npx self-improvement-skill doctor
```

After installation, use Claude Code or Codex normally. When a slash skill such
as `/super-get-wiki` is followed by a correction like "wrong", "not that", or
"you should have...", the hook can record a learning event for the previously
used skill.

## What Gets Installed

The installer copies this skill into the selected global skill directories:

- `~/.claude/skills/self-improvement`
- `~/.codex/skills/self-improvement`

It also writes managed hook entries into the selected platform config files:

- `~/.claude/settings.json`
- `~/.codex/hooks.json`

Those hook entries point at scripts in the installed skill directory. Existing
unmanaged configuration should remain outside the installer-owned block.

## How It Works

The learning loop has two layers:

1. `UserPromptSubmit` tracks the most recent slash skill and detects later
   prompts that look like reusable corrections.
2. `Stop` captures the latest assistant output when the host runtime exposes it,
   so the next correction has concrete observed context.

Recorded events are then processed through this workflow:

1. Raw events are appended to `.learnings/events.jsonl`.
2. Human-readable Markdown logs are mirrored under `.learnings/`.
3. Repeated lessons are distilled into `.learnings/patterns.json`.
4. Promotion candidates are generated in `.learnings/promotion_candidates.md`.
5. Humans decide whether enough evidence exists to promote a candidate.

Default promotion threshold:

- `evidence_count >= 3`
- `distinct_tasks >= 2`
- seen within the last 30 days
- expressible as a reusable instruction

## Privacy And Local Data

This package is designed for local evidence collection. Learning files are
written under the installed `self-improvement` skill's `.learnings/` directory.

The project does not include a cloud sync service or telemetry pipeline. Treat
learning logs as potentially sensitive because they can contain user prompts,
assistant output snippets, and corrections. Review `.learnings/` before sharing
or publishing any generated files.

## CLI Reference

```bash
npx self-improvement-skill install [--target both|claude|codex]
npx self-improvement-skill doctor [--json]
npx self-improvement-skill uninstall [--target both|claude|codex] [--remove-files]
npx self-improvement-skill distill [--min-evidence 3] [--min-distinct-tasks 2]
```

See [CLI.md](CLI.md) for command details.

## Uninstall

Remove managed hook entries only:

```bash
npx self-improvement-skill uninstall
```

Remove managed hook entries and installed skill files:

```bash
npx self-improvement-skill uninstall --remove-files
```

Limit uninstall to one platform:

```bash
npx self-improvement-skill uninstall --target claude
npx self-improvement-skill uninstall --target codex
```

## Runtime Integration

Hook behavior is described in [HOOKS_INSTALL.md](HOOKS_INSTALL.md). The minimum
event context used by the recorder is:

- `used_skill`: skill that produced the experience
- `signal`: `correction`, `failure`, `success`, `workaround`, or
  `capability_gap`
- `task`: short task summary
- `observed`: concrete behavior or previous assistant output
- `feedback`: raw user correction or acceptance signal
- `lesson`: reusable lesson
- `target_scope`: usually `skill`
- `target_name`: usually the used skill name

Do not record every skill call. Record only events with a plausible reusable
lesson.

## Manual Script Entry Points

The CLI and hooks are the normal team path. These scripts remain available for
tests, debugging, and custom runtime integration:

```bash
node scripts/log-learning.js --help
node scripts/record-from-context.js --help
node scripts/distill-patterns.js --help
```

Use `record-from-context.js` when a host runtime already knows a reusable signal
should be recorded. Use `log-learning.js` when all event fields are already
known.

## Development

Run the test suite:

```bash
npm test
```

The tests cover CLI parsing, hook behavior, installation wiring, event logging,
pattern distillation, and the end-to-end local learning workflow.

## Directory Layout

```text
self-improvement-skill/
|-- SKILL.md
|-- README.md
|-- README.zh.md
|-- CLI.md
|-- HOOKS_INSTALL.md
|-- bin/
|   `-- cli.js
|-- scripts/
|   |-- log-learning.js
|   |-- record-from-context.js
|   |-- distill-patterns.js
|   |-- install-team-skill.js
|   |-- uninstall-team-skill.js
|   |-- install-claude-hooks.js
|   |-- install-codex-hooks.js
|   |-- claude-hook-user-prompt-submit.js
|   |-- claude-hook-stop.js
|   |-- codex-hook-user-prompt-submit.js
|   `-- codex-hook-stop.js
|-- integrations/
|-- references/
|   `-- event-schema.md
`-- tests/
```

## Contributing

Issues and pull requests are welcome. For code changes, run `npm test` before
opening a pull request and keep changes focused on one behavior or document at a
time.

Please avoid committing local `.learnings/` data, generated package tarballs, or
machine-specific hook configuration.

## License

[MIT](LICENSE)
