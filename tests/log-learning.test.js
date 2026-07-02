const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
  VALID_TYPES,
  compactDateStamp,
  parseArgs,
  pickLogFile,
} = require("../scripts/log-learning.js");

test("parseArgs parses named flags", () => {
  const args = parseArgs([
    "node",
    "log-learning.js",
    "--skill",
    "frontend-api-integration",
    "--type",
    "user_correction",
    "--task",
    "Summarize task",
  ]);

  assert.deepEqual(args, {
    skill: "frontend-api-integration",
    type: "user_correction",
    task: "Summarize task",
  });
});

test("parseArgs rejects missing values", () => {
  assert.throws(
    () => parseArgs(["node", "log-learning.js", "--skill"]),
    /Missing value for --skill/
  );
});

test("VALID_TYPES contains supported learning signals", () => {
  assert.deepEqual(Array.from(VALID_TYPES).sort(), [
    "error_pattern",
    "feature_request",
    "success_pattern",
    "user_correction",
  ]);
});

test("compactDateStamp removes separators from ISO timestamp", () => {
  assert.equal(
    compactDateStamp("2026-06-30T10:11:12.345Z"),
    "20260630101112"
  );
});

test("pickLogFile routes events by signal type", () => {
  const learningsDir = "/tmp/learnings";

  assert.equal(
    pickLogFile(learningsDir, "error_pattern"),
    path.join(learningsDir, "ERRORS.md")
  );
  assert.equal(
    pickLogFile(learningsDir, "feature_request"),
    path.join(learningsDir, "FEATURE_REQUESTS.md")
  );
  assert.equal(
    pickLogFile(learningsDir, "user_correction"),
    path.join(learningsDir, "LEARNINGS.md")
  );
});
