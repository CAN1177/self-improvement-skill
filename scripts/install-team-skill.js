#!/usr/bin/env node

const path = require("path");

const { run: installClaudeHooks } = require("./install-claude-hooks.js");
const { run: installCodexHooks } = require("./install-codex-hooks.js");
const { claudeSkillDir, codexSkillDir } = require("./install-paths.js");
const { copySkillTree } = require("./install-shared.js");

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
      throw new Error(`Missing value for --${key}`);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/install-team-skill.js [--target both|claude|codex]

Copies this skill into the standard global install directory for each platform
and repoints hooks to the installed copy instead of the current repo path.
`);
}

function run(args = {}, options = {}) {
  const sourceDir = options.sourceDir || path.resolve(__dirname, "..");
  const target = String(args.target || "both").toLowerCase();

  if (!["both", "claude", "codex"].includes(target)) {
    throw new Error("Invalid --target value");
  }

  const result = {};

  if (target === "both" || target === "claude") {
    const dir = options.claudeSkillDir || claudeSkillDir();
    copySkillTree(sourceDir, dir);
    installClaudeHooks({
      skillDir: dir,
      settingsFile: options.claudeSettingsFile,
    });
    result.claude = dir;
  }

  if (target === "both" || target === "codex") {
    const dir = options.codexSkillDir || codexSkillDir();
    copySkillTree(sourceDir, dir);
    installCodexHooks({
      skillDir: dir,
      hooksFile: options.codexHooksFile,
    });
    result.codex = dir;
  }

  console.log(`Installed team skill target(s): ${Object.keys(result).join(", ")}`);
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
  printHelp,
  run,
};
