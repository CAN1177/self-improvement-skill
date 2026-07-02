const os = require("os");
const path = require("path");

const SKILL_NAME = "self-improvement";

function homeDir() {
  return os.homedir();
}

function claudeSkillDir(home = homeDir()) {
  return path.join(home, ".claude", "skills", SKILL_NAME);
}

function codexSkillDir(home = homeDir()) {
  return path.join(home, ".codex", "skills", SKILL_NAME);
}

function claudeSettingsFile(home = homeDir()) {
  return path.join(home, ".claude", "settings.json");
}

function codexHooksFile(home = homeDir()) {
  return path.join(home, ".codex", "hooks.json");
}

module.exports = {
  SKILL_NAME,
  claudeSettingsFile,
  claudeSkillDir,
  codexHooksFile,
  codexSkillDir,
  homeDir,
};
