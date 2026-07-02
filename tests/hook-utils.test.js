const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  extractAssistantMessage,
  extractPrompt,
  extractSlashCommand,
  handlePromptPayload,
  handleStopPayload,
  shouldTrackSlashCommand,
} = require("../scripts/hook-utils.js");

function makeTempSkillDir() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "self-improvement-"));
  const skillDir = path.join(baseDir, "self-improvement");
  fs.mkdirSync(skillDir, { recursive: true });
  return skillDir;
}

function readJsonLines(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("extract helpers find prompt, slash command, and assistant message", () => {
  assert.equal(extractPrompt({ prompt: "hello" }), "hello");
  assert.equal(extractSlashCommand("/super-get-wiki page"), "super-get-wiki");
  assert.equal(extractAssistantMessage({ last_assistant_message: "done" }), "done");
});

test("shouldTrackSlashCommand ignores built-in slash commands", () => {
  assert.equal(shouldTrackSlashCommand("super-get-wiki"), true);
  assert.equal(shouldTrackSlashCommand("hooks"), false);
});

test("handlePromptPayload tracks slash skills and records corrections", () => {
  const skillDir = makeTempSkillDir();

  const tracked = handlePromptPayload(
    {
      prompt: "/super-get-wiki read this page",
      hook_event_name: "UserPromptSubmit",
      turn_id: "turn-1",
    },
    { skillDir, platform: "claude" }
  );

  const updated = handleStopPayload(
    {
      last_assistant_message: "cached first",
      hook_event_name: "Stop",
      turn_id: "turn-1",
    },
    { skillDir, platform: "codex" }
  );

  const recorded = handlePromptPayload(
    {
      prompt: "不对，可以先不缓存，先输出内容，在子agent去缓存内容",
      hook_event_name: "UserPromptSubmit",
      turn_id: "turn-2",
    },
    { skillDir, platform: "codex" }
  );

  const events = readJsonLines(path.join(skillDir, ".learnings", "events.jsonl"));

  assert.equal(tracked.action, "tracked-skill");
  assert.equal(updated.action, "updated-observed");
  assert.equal(recorded.action, "recorded-correction");
  assert.equal(events.length, 1);
  assert.equal(events[0].skill_name, "super-get-wiki");
  assert.equal(events[0].what_happened, "cached first");
});
