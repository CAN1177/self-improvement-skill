# self-improvement

Evidence-backed self-improvement for agent skills. The package installs a `self-improvement` skill and wires Claude Code / Codex hooks so user corrections after slash-skill usage are recorded automatically.

## Quick Start

```bash
npx self-improvement-skill install
npx self-improvement-skill doctor
```

After installation, use Claude Code or Codex normally. When a slash skill such as `/super-get-wiki` is followed by a correction like "不对..." or "应该先...", the hook records a learning event under the installed skill's `.learnings/` directory.

## CLI

```bash
npx self-improvement-skill install [--target both|claude|codex]
npx self-improvement-skill doctor [--json]
npx self-improvement-skill uninstall [--target both|claude|codex] [--remove-files]
npx self-improvement-skill distill [--min-evidence 3] [--min-distinct-tasks 2]
```

See [CLI.md](CLI.md) for details.

## What Gets Installed

The CLI installs the skill into:

- `~/.claude/skills/self-improvement`
- `~/.codex/skills/self-improvement`

It also writes managed hook entries into:

- `~/.claude/settings.json`
- `~/.codex/hooks.json`

The hooks are the automation layer. They track the most recent slash skill on `UserPromptSubmit`, capture observed assistant output on `Stop` when available, and record a correction when the next user prompt looks like reusable feedback.

## Learning Workflow

This skill does not directly rewrite another `SKILL.md`. It keeps the improvement loop traceable:

1. Record raw events in `.learnings/events.jsonl`.
2. Mirror events into human-readable Markdown logs under `.learnings/`.
3. Distill repeated lessons into `.learnings/patterns.json`.
4. Generate promotion candidates in `.learnings/promotion_candidates.md`.
5. Promote a candidate only after enough evidence exists.

Default promotion threshold:

1. `evidence_count >= 3`
2. `distinct_tasks >= 2`
3. seen within the last 30 days
4. expressible as a reusable instruction

## Manual Script Entry Points

The CLI and hooks are the normal team path. These scripts remain available for tests, debugging, and custom runtime integration:

```bash
node scripts/log-learning.js --help
node scripts/record-from-context.js --help
node scripts/distill-patterns.js --help
```

Use `record-from-context.js` when a host runtime already knows a reusable signal should be recorded. Use `log-learning.js` when all event fields are already known.

## Runtime Integration

Hook behavior is described in [HOOKS_INSTALL.md](HOOKS_INSTALL.md). The minimum event context used by the recorder is:

- `used_skill`: skill that produced the experience
- `signal`: `correction`, `failure`, `success`, `workaround`, or `capability_gap`
- `task`: short task summary
- `observed`: concrete behavior or previous assistant output
- `feedback`: raw user correction or acceptance signal
- `lesson`: reusable lesson
- `target_scope`: usually `skill`
- `target_name`: usually the used skill name

Do not record every skill call. Record only events with a plausible reusable lesson.

## Directory Layout

```text
self-improvement/
|-- SKILL.md
|-- README.md
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
`-- .learnings/
    |-- events.jsonl
    |-- patterns.json
    `-- promotion_candidates.md
```

## Testing

```bash
npm test
```

The test suite covers CLI parsing, hook behavior, installation wiring, event logging, pattern distillation, and the end-to-end local learning workflow.

## Files

- [SKILL.md](SKILL.md): agent-facing rules
- [CLI.md](CLI.md): npm CLI reference
- [HOOKS_INSTALL.md](HOOKS_INSTALL.md): Claude Code and Codex hook behavior
- [references/event-schema.md](references/event-schema.md): event schema
- [scripts/log-learning.js](scripts/log-learning.js): low-level event logger
- [scripts/record-from-context.js](scripts/record-from-context.js): runtime-friendly recording entry point
- [scripts/hook-utils.js](scripts/hook-utils.js): shared hook logic
- [scripts/install-team-skill.js](scripts/install-team-skill.js): installer used by the CLI
- [scripts/distill-patterns.js](scripts/distill-patterns.js): pattern distillation
