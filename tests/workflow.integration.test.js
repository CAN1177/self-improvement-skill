const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { run: runLogLearning } = require("../scripts/log-learning.js");
const {
  run: runDistillPatterns,
} = require("../scripts/distill-patterns.js");

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

test("log-learning writes jsonl and markdown logs into .learnings", () => {
  const skillDir = makeTempSkillDir();

  const event = runLogLearning(
    {
      skill: "frontend-api-integration",
      type: "user_correction",
      task: "API integration plan",
      happened: "Missed field mapping table",
      feedback: "Field mapping should come first",
      lesson: "Prioritize field mapping before process narrative",
      scope: "skill",
      target: "frontend-api-integration",
      "task-id": "api-001",
      source: "session-001",
    },
    {
      skillDir,
      nowIso: () => "2026-06-30T10:11:12.000Z",
    }
  );

  const learningsDir = path.join(skillDir, ".learnings");
  const events = readJsonLines(path.join(learningsDir, "events.jsonl"));
  const learningsMarkdown = fs.readFileSync(
    path.join(learningsDir, "LEARNINGS.md"),
    "utf8"
  );

  assert.equal(event.id, "evt-20260630101112");
  assert.equal(events.length, 1);
  assert.equal(events[0].proposed_lesson, event.proposed_lesson);
  assert.match(learningsMarkdown, /## 2026-06-30T10:11:12.000Z/);
  assert.match(
    learningsMarkdown,
    /- proposed_lesson: Prioritize field mapping before process narrative/
  );
});

test("distill-patterns promotes only sufficiently repeated recent patterns", () => {
  const skillDir = makeTempSkillDir();

  runLogLearning(
    {
      skill: "frontend-api-integration",
      type: "user_correction",
      task: "API integration plan",
      happened: "Missed field mapping table",
      feedback: "Field mapping should come first",
      lesson: "Prioritize field mapping before process narrative",
      scope: "skill",
      target: "frontend-api-integration",
      "task-id": "api-001",
      source: "session-001",
    },
    {
      skillDir,
      nowIso: () => "2026-06-28T08:00:00.000Z",
    }
  );

  runLogLearning(
    {
      skill: "frontend-api-integration",
      type: "success_pattern",
      task: "API fallback checklist",
      happened: "Field mapping first avoided rework",
      feedback: "This order works better",
      lesson: "Prioritize field mapping before process narrative",
      scope: "skill",
      target: "frontend-api-integration",
      "task-id": "api-002",
      source: "session-002",
    },
    {
      skillDir,
      nowIso: () => "2026-06-29T09:00:00.000Z",
    }
  );

  runLogLearning(
    {
      skill: "frontend-api-integration",
      type: "user_correction",
      task: "API schema review",
      happened: "Overview was too generic",
      feedback: "Need concrete field mapping first",
      lesson: "Prioritize field mapping before process narrative",
      scope: "skill",
      target: "frontend-api-integration",
      "task-id": "api-003",
      source: "session-003",
    },
    {
      skillDir,
      nowIso: () => "2026-06-30T10:00:00.000Z",
    }
  );

  runLogLearning(
    {
      skill: "frontend-api-integration",
      type: "feature_request",
      task: "Different request",
      happened: "User asked for OpenAPI examples",
      feedback: "Need examples too",
      lesson: "Add OpenAPI example payloads",
      scope: "skill",
      target: "frontend-api-integration",
      "task-id": "api-004",
      source: "session-004",
    },
    {
      skillDir,
      nowIso: () => "2026-06-30T11:00:00.000Z",
    }
  );

  const result = runDistillPatterns(
    {
      "min-evidence": "3",
      "min-distinct-tasks": "2",
    },
    {
      skillDir,
    }
  );

  const patternsPayload = JSON.parse(
    fs.readFileSync(result.patternsFile, "utf8")
  );
  const candidatesMarkdown = fs.readFileSync(result.candidatesFile, "utf8");

  assert.equal(patternsPayload.patterns.length, 2);
  assert.equal(result.candidates.length, 1);
  assert.equal(
    result.candidates[0].candidate_rule,
    "Prioritize field mapping before process narrative"
  );
  assert.match(
    candidatesMarkdown,
    /Candidate rule: Prioritize field mapping before process narrative/
  );
  assert.doesNotMatch(candidatesMarkdown, /Add OpenAPI example payloads/);
});
