#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { claudeSettingsFile, claudeSkillDir } = require("./install-paths.js");
const {
  addCommandHook,
  ensureArrayPath,
  readJson,
  removeManagedCommandHooks,
  writeJson,
} = require("./install-shared.js");

const MANAGED_BASENAMES = new Set([
  "claude-hook-user-prompt-submit.js",
  "claude-hook-stop.js",
]);

function run(options = {}) {
  const settingsFile = options.settingsFile || claudeSettingsFile();
  const skillDir = options.skillDir || claudeSkillDir();
  const userPromptCommand = path.join(skillDir, "scripts", "claude-hook-user-prompt-submit.js");
  const stopCommand = path.join(skillDir, "scripts", "claude-hook-stop.js");

  const settings = readJson(settingsFile);
  settings.hooks = settings.hooks || {};
  settings.hooks.UserPromptSubmit = removeManagedCommandHooks(
    ensureArrayPath(settings.hooks, "UserPromptSubmit"),
    MANAGED_BASENAMES
  );
  settings.hooks.Stop = removeManagedCommandHooks(
    ensureArrayPath(settings.hooks, "Stop"),
    MANAGED_BASENAMES
  );

  addCommandHook(settings.hooks.UserPromptSubmit, userPromptCommand);
  addCommandHook(settings.hooks.Stop, stopCommand);

  writeJson(settingsFile, settings);
  console.log(`Installed Claude hooks into ${settingsFile}`);
  return { settingsFile, skillDir };
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { run };
