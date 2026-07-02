#!/usr/bin/env node

const fs = require("fs");

const {
  claudeSettingsFile,
  claudeSkillDir,
  codexHooksFile,
  codexSkillDir,
} = require("./install-paths.js");
const {
  ensureArrayPath,
  readJson,
  removeManagedCommandHooks,
  writeJson,
} = require("./install-shared.js");

const CLAUDE_MANAGED = new Set([
  "claude-hook-user-prompt-submit.js",
  "claude-hook-stop.js",
]);
const CODEX_MANAGED = new Set([
  "codex-hook-user-prompt-submit.js",
  "codex-hook-stop.js",
]);

function parseBoolean(value) {
  return ["true", "1", "yes", "y"].includes(String(value || "").toLowerCase());
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/uninstall-team-skill.js [--target both|claude|codex] [--remove-files]

Removes managed hooks. Pass --remove-files to also delete installed skill dirs.
`);
}

function uninstallHooks(configFile, managedNames) {
  const payload = readJson(configFile);
  payload.hooks = payload.hooks || {};
  payload.hooks.UserPromptSubmit = removeManagedCommandHooks(
    ensureArrayPath(payload.hooks, "UserPromptSubmit"),
    managedNames
  );
  payload.hooks.Stop = removeManagedCommandHooks(
    ensureArrayPath(payload.hooks, "Stop"),
    managedNames
  );
  writeJson(configFile, payload);
}

function run(args = {}, options = {}) {
  const target = String(args.target || "both").toLowerCase();
  if (!["both", "claude", "codex"].includes(target)) {
    throw new Error("Invalid --target value");
  }

  const removeFiles = parseBoolean(args["remove-files"]);
  const result = {};

  if (target === "both" || target === "claude") {
    const settingsFile = options.claudeSettingsFile || claudeSettingsFile();
    uninstallHooks(settingsFile, CLAUDE_MANAGED);
    if (removeFiles) {
      fs.rmSync(options.claudeSkillDir || claudeSkillDir(), { recursive: true, force: true });
    }
    result.claude = settingsFile;
  }

  if (target === "both" || target === "codex") {
    const hooksFile = options.codexHooksFile || codexHooksFile();
    uninstallHooks(hooksFile, CODEX_MANAGED);
    if (removeFiles) {
      fs.rmSync(options.codexSkillDir || codexSkillDir(), { recursive: true, force: true });
    }
    result.codex = hooksFile;
  }

  console.log(`Uninstalled self-improvement target(s): ${Object.keys(result).join(", ")}`);
  return result;
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv);
    if (args.help) {
      printHelp();
    } else {
      run(args);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  parseArgs,
  parseBoolean,
  printHelp,
  run,
  uninstallHooks,
};
