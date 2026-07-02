#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { codexHooksFile, codexSkillDir } = require("./install-paths.js");
const {
  addCommandHook,
  ensureArrayPath,
  readJson,
  removeManagedCommandHooks,
  writeJson,
} = require("./install-shared.js");

const MANAGED_BASENAMES = new Set([
  "codex-hook-user-prompt-submit.js",
  "codex-hook-stop.js",
]);

function run(options = {}) {
  const hooksFile = options.hooksFile || codexHooksFile();
  const skillDir = options.skillDir || codexSkillDir();
  const userPromptCommand = path.join(skillDir, "scripts", "codex-hook-user-prompt-submit.js");
  const stopCommand = path.join(skillDir, "scripts", "codex-hook-stop.js");

  const config = readJson(hooksFile);
  config.hooks = config.hooks || {};
  config.hooks.UserPromptSubmit = removeManagedCommandHooks(
    ensureArrayPath(config.hooks, "UserPromptSubmit"),
    MANAGED_BASENAMES
  );
  config.hooks.Stop = removeManagedCommandHooks(
    ensureArrayPath(config.hooks, "Stop"),
    MANAGED_BASENAMES
  );

  addCommandHook(config.hooks.UserPromptSubmit, userPromptCommand);
  addCommandHook(config.hooks.Stop, stopCommand);

  writeJson(hooksFile, config);
  console.log(`Installed Codex hooks into ${hooksFile}`);
  return { hooksFile, skillDir };
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
