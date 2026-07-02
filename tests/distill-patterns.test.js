const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildCandidates,
  buildPatternKey,
  createPattern,
  groupEvents,
  normalizeKeyPart,
  renderCandidates,
} = require("../scripts/distill-patterns.js");

function makeEvent(overrides = {}) {
  return {
    id: "evt-001",
    timestamp: "2026-06-29T10:00:00.000Z",
    skill_name: "frontend-api-integration",
    signal_type: "user_correction",
    task_summary: "API plan",
    what_happened: "Missed field mapping",
    user_feedback: "Need field mapping first",
    proposed_lesson:
      "Prioritize field mapping and fallback handling before process narrative",
    target_scope: "skill",
    target_name: "frontend-api-integration",
    task_id: "api-001",
    source_reference: "session-001",
    ...overrides,
  };
}

test("normalizeKeyPart lowercases and strips noisy punctuation", () => {
  assert.equal(
    normalizeKeyPart("  Field Mapping! First?  "),
    "field mapping first"
  );
});

test("buildPatternKey combines normalized scope, target, and lesson", () => {
  const key = buildPatternKey(
    makeEvent({
      target_scope: "Skill",
      target_name: "Frontend API Integration",
      proposed_lesson: "Prefer field mapping first.",
    })
  );

  assert.equal(
    key,
    "skill::frontend api integration::prefer field mapping first"
  );
});

test("groupEvents groups events with the same normalized key", () => {
  const events = [
    makeEvent({ id: "evt-001", task_id: "api-001" }),
    makeEvent({ id: "evt-002", task_id: "api-002" }),
    makeEvent({
      id: "evt-003",
      target_name: "other-skill",
      proposed_lesson: "Different lesson",
    }),
  ];

  const groups = groupEvents(events);

  assert.equal(groups.size, 2);
  assert.equal(
    groups.get(buildPatternKey(events[0])).length,
    2
  );
});

test("createPattern summarizes aggregated evidence", () => {
  const pattern = createPattern("pattern-key", [
    makeEvent({ id: "evt-001", task_id: "api-001" }),
    makeEvent({
      id: "evt-002",
      task_id: "api-002",
      signal_type: "success_pattern",
      timestamp: "2026-06-30T11:00:00.000Z",
    }),
  ]);

  assert.equal(pattern.pattern_key, "pattern-key");
  assert.equal(pattern.evidence_count, 2);
  assert.equal(pattern.distinct_tasks, 2);
  assert.deepEqual(pattern.signal_types.sort(), [
    "success_pattern",
    "user_correction",
  ]);
  assert.deepEqual(pattern.evidence_refs, ["evt-001", "evt-002"]);
});

test("buildCandidates enforces evidence, task diversity, and recency", () => {
  const candidates = buildCandidates(
    [
      {
        pattern_key: "eligible",
        evidence_count: 3,
        distinct_tasks: 2,
        recent: true,
      },
      {
        pattern_key: "stale",
        evidence_count: 5,
        distinct_tasks: 3,
        recent: false,
      },
      {
        pattern_key: "weak",
        evidence_count: 2,
        distinct_tasks: 2,
        recent: true,
      },
    ],
    3,
    2
  );

  assert.deepEqual(candidates, [
    {
      pattern_key: "eligible",
      evidence_count: 3,
      distinct_tasks: 2,
      recent: true,
    },
  ]);
});

test("renderCandidates prints markdown report", () => {
  const markdown = renderCandidates([
    {
      pattern_key: "skill::frontend-api-integration::prioritize field mapping",
      target_scope: "skill",
      target_name: "frontend-api-integration",
      evidence_count: 3,
      distinct_tasks: 2,
      last_seen: "2026-06-30T11:00:00.000Z",
      candidate_rule: "Prioritize field mapping",
      evidence_refs: ["evt-001", "evt-002", "evt-003"],
    },
  ]);

  assert.match(markdown, /# Promotion Candidates/);
  assert.match(markdown, /Candidate: skill::frontend-api-integration::prioritize field mapping/);
  assert.match(markdown, /Evidence count: 3/);
  assert.match(markdown, /- evt-003/);
});
