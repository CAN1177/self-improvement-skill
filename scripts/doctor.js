#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const {
  claudeSettingsFile,
  claudeSkillDir,
  codexHooksFile,
  codexSkillDir,
} = require("./install-paths.js");
const { readJson } = require("./install-shared.js");

function commandExists(configFile, eventName, expectedCommand) {
  const payload = readJson(configFile);
  const groups = payload.hooks && Array.isArray(payload.hooks[eventName])
    ? payload.hooks[eventName]
    : [];

  return groups.some((group) =>
    Array.isArray(group.hooks) &&
    group.hooks.some((hook) => hook.type === "command" && hook.command === expectedCommand)
  );
}

function dirWritable(dirPath) {
  try {
    if (!fs.existsSync(path.dirname(dirPath))) {
      return false;
    }
    fs.mkdirSync(dirPath, { recursive: true });
    fs.accessSync(dirPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function checkPlatform(name, options) {
  const skillDir = options.skillDir;
  const configFile = options.configFile;
  const userPromptCommand = options.userPromptCommand;
  const stopCommand = options.stopCommand;

  return {
    name,
    skill_dir: skillDir,
    skill_installed: fs.existsSync(path.join(skillDir, "SKILL.md")),
    config_file: configFile,
    config_exists: fs.existsSync(configFile),
    user_prompt_hook: commandExists(configFile, "UserPromptSubmit", userPromptCommand),
    stop_hook: commandExists(configFile, "Stop", stopCommand),
    learnings_writable: dirWritable(path.join(skillDir, ".learnings")),
  };
}

function summarize(platforms) {
  return platforms.every(
    (platform) =>
      platform.skill_installed &&
      platform.config_exists &&
      platform.user_prompt_hook &&
      platform.stop_hook &&
      platform.learnings_writable
  );
}

function render(platforms) {
  const lines = [];
  for (const platform of platforms) {
    lines.push(`${platform.name}:`);
    lines.push(`  skill installed: ${platform.skill_installed ? "yes" : "no"}`);
    lines.push(`  config exists: ${platform.config_exists ? "yes" : "no"}`);
    lines.push(`  UserPromptSubmit hook: ${platform.user_prompt_hook ? "yes" : "no"}`);
    lines.push(`  Stop hook: ${platform.stop_hook ? "yes" : "no"}`);
    lines.push(`  .learnings writable: ${platform.learnings_writable ? "yes" : "no"}`);
  }
  return lines.join("\n");
}

function run(args = {}, options = {}) {
  const claudeDir = options.claudeSkillDir || claudeSkillDir();
  const codexDir = options.codexSkillDir || codexSkillDir();
  const platforms = [
    checkPlatform("claude", {
      skillDir: claudeDir,
      configFile: options.claudeSettingsFile || claudeSettingsFile(),
      userPromptCommand: path.join(claudeDir, "scripts", "claude-hook-user-prompt-submit.js"),
      stopCommand: path.join(claudeDir, "scripts", "claude-hook-stop.js"),
    }),
    checkPlatform("codex", {
      skillDir: codexDir,
      configFile: options.codexHooksFile || codexHooksFile(),
      userPromptCommand: path.join(codexDir, "scripts", "codex-hook-user-prompt-submit.js"),
      stopCommand: path.join(codexDir, "scripts", "codex-hook-stop.js"),
    }),
  ];
  const result = { ok: summarize(platforms), platforms };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(render(platforms));
    console.log(`overall: ${result.ok ? "ok" : "needs attention"}`);
  }

  return result;
}

if (require.main === module) {
  try {
    run({ json: process.argv.includes("--json") });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  checkPlatform,
  commandExists,
  dirWritable,
  render,
  run,
  summarize,
};
