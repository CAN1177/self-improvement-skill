const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  contextToLogArgs,
  normalizeSignal,
  run,
} = require("../scripts/record-from-context.js");

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

test("normalizeSignal maps active learning signals to event types", () => {
  assert.equal(normalizeSignal("correction"), "user_correction");
  assert.equal(normalizeSignal("failure"), "error_pattern");
  assert.equal(normalizeSignal("workaround"), "success_pattern");
  assert.equal(normalizeSignal("capability_gap"), "feature_request");
});

test("contextToLogArgs converts skill-use context into logger args", () => {
  const args = contextToLogArgs({
    used_skill: "frontend-api-integration",
    signal: "correction",
    task: "Generate API integration plan",
    what_happened: "Missed field mapping",
    user_feedback: "Fields matter first",
    proposed_lesson: "Prioritize field mapping",
    task_id: "api-001",
    source_reference: "session-001",
  });

  assert.deepEqual(args, {
    skill: "frontend-api-integration",
    type: "user_correction",
    task: "Generate API integration plan",
    happened: "Missed field mapping",
    feedback: "Fields matter first",
    lesson: "Prioritize field mapping",
    scope: "skill",
    target: "frontend-api-integration",
    "task-id": "api-001",
    source: "session-001",
  });
});

test("run records an event from context flags", () => {
  const skillDir = makeTempSkillDir();

  const event = run(
    {
      "used-skill": "frontend-api-integration",
      signal: "capability_gap",
      task: "Generate frontend integration checklist",
      observed: "Checklist missed mock data examples",
      feedback: "Need example payloads too",
      lesson: "Include mock payload examples in integration checklists",
      "target-scope": "skill",
      "target-name": "frontend-api-integration",
      "task-id": "api-002",
      source: "session-002",
    },
    {
      skillDir,
      nowIso: () => "2026-07-01T10:00:00.000Z",
    }
  );

  const events = readJsonLines(path.join(skillDir, ".learnings", "events.jsonl"));

  assert.equal(event.signal_type, "feature_request");
  assert.equal(events.length, 1);
  assert.equal(events[0].target_name, "frontend-api-integration");
  assert.equal(
    events[0].proposed_lesson,
    "Include mock payload examples in integration checklists"
  );
});
