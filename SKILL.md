---
name: self-improvement
description: MUST USE as a meta-skill when any other skill usage produces a user correction, repeated failure, stable success pattern, workaround, capability gap, or explicit "remember this" feedback. Capture usage learnings, distill repeated patterns, and generate evidence-backed improvement candidates without directly rewriting the target SKILL.md.
---

# Self Improvement

This skill is a meta-skill for improving other skills from real usage. It does not directly rewrite other `SKILL.md` files. Its job is to build a low-risk, traceable learning loop for skill evolution.

## When To Use

- The user wants a skill to improve from ongoing usage.
- The user wants to save a lesson from the current interaction.
- The user corrects output and wants similar cases handled better later.
- A task pattern keeps failing or needs repeated cleanup.
- The user wants long-term improvement rules distilled from real usage.
- Another skill just finished and produced a reusable correction, failure, workaround, success pattern, or capability gap.

Do not use this skill when:

- The task is a one-off and no learning should be retained.
- The user already wants a direct edit to a skill and does not need evidence collection first.

## Core Principles

1. Record experience first, discuss promotion second, modify skill rules last.
2. Do not promote a single feedback event into a long-term rule.
3. Every candidate rule must point back to concrete evidence.
4. Default to proposals, not direct skill rewrites.

## Active Recording Protocol

This skill cannot passively listen to all skill calls unless the host runtime provides hooks. Active recording therefore happens through the main agent or the installed Claude Code / Codex hook handlers.

After using another skill, perform a lightweight learning checkpoint:

1. If no reusable learning signal appeared, do nothing.
2. If a reusable signal appeared, record one event without asking the user.
3. If promoting a candidate would modify another skill, ask for confirmation first.

Use `scripts/record-from-context.js` when the agent or a runtime hook has already decided that the just-completed skill usage should be recorded. Use `scripts/log-learning.js` when the event fields are already known.

## Workflow

### 1. Record Events

When one of these signals appears, record a learning event:

- user correction
- task failure
- successful repeatable method
- missing capability request

Use:

```bash
node <SKILL_DIR>/scripts/log-learning.js --help
```

For automatic or hook-driven recording from a skill-use summary, use:

```bash
node <SKILL_DIR>/scripts/record-from-context.js --help
```

### 2. Distill Patterns

After enough events are collected, distill them into candidate patterns:

```bash
node <SKILL_DIR>/scripts/distill-patterns.js --help
```

This updates:

- `.learnings/patterns.json`
- `.learnings/promotion_candidates.md`

### 3. Decide Promotion Level

Candidate patterns should be promoted to one of:

- keep inside `.learnings/`
- promote to project-wide shared guidance
- create a patch proposal for a target skill
- in rare cases, evolve into a new skill

## Minimum Promotion Threshold

By default, a candidate should meet all of these:

1. `evidence_count >= 3`
2. `distinct_tasks >= 2`
3. seen within the last 30 days
4. expressible as a reusable instruction

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
|   |-- claude-hook-user-prompt-submit.js
|   |-- claude-hook-stop.js
|   |-- codex-hook-user-prompt-submit.js
|   `-- codex-hook-stop.js
|-- references/
|   `-- event-schema.md
`-- .learnings/
    |-- events.jsonl
    |-- LEARNINGS.md
    |-- ERRORS.md
    |-- FEATURE_REQUESTS.md
    |-- patterns.json
    `-- promotion_candidates.md
```

## Non-Negotiable Rules

1. Do not create a long-term rule without clear evidence.
2. Do not create a skill-level change suggestion without cross-task recurrence.
3. If a candidate conflicts with an existing rule, flag the conflict instead of silently overriding it.
4. This skill produces evidence and proposals; it does not directly modify other skills without confirmation.

## References

- [README.md](README.md): architecture, workflow, implementation notes
- [CLI.md](CLI.md): npm CLI installation and operations
- [HOOKS_INSTALL.md](HOOKS_INSTALL.md): Claude Code and Codex hook behavior
- [references/event-schema.md](references/event-schema.md): event field definitions
- [scripts/log-learning.js](scripts/log-learning.js): event logging script
- [scripts/record-from-context.js](scripts/record-from-context.js): runtime-friendly recording script
- [scripts/distill-patterns.js](scripts/distill-patterns.js): pattern distillation script
