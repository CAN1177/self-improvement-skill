const fs = require("fs");
const path = require("path");

function runtimeDir(skillDir) {
  return path.join(skillDir, ".learnings", "runtime");
}

function stateFile(skillDir) {
  return path.join(runtimeDir(skillDir), "last-skill-context.json");
}

function readState(skillDir) {
  const file = stateFile(skillDir);
  if (!fs.existsSync(file)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeState(skillDir, payload) {
  const file = stateFile(skillDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

function trackSkillContext(skillDir, context) {
  return writeState(skillDir, {
    used_skill: context.used_skill,
    task: context.task || "",
    observed: context.observed || "",
    task_id: context.task_id || "",
    source_reference: context.source_reference || "",
    tracked_at: new Date().toISOString(),
  });
}

function updateState(skillDir, updater) {
  return writeState(skillDir, updater(readState(skillDir)));
}

module.exports = {
  readState,
  runtimeDir,
  stateFile,
  trackSkillContext,
  updateState,
  writeState,
};
