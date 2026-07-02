#!/usr/bin/env node

const path = require("path");

const { run: runDoctor } = require("../scripts/doctor.js");
const { run: runInstall } = require("../scripts/install-team-skill.js");
const { run: runUninstall } = require("../scripts/uninstall-team-skill.js");
const { run: runDistillPatterns } = require("../scripts/distill-patterns.js");

function parseArgs(argv) {
  const command = argv[2] || "help";
  const args = { _: command };

  for (let i = 3; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    i += 1;
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  self-improvement-skill install [--target both|claude|codex]
  self-improvement-skill doctor [--json]
  self-improvement-skill uninstall [--target both|claude|codex] [--remove-files]
  self-improvement-skill distill [--min-evidence 3] [--min-distinct-tasks 2]
`);
}

function packageRoot() {
  return path.resolve(__dirname, "..");
}

function run(args, options = {}) {
  const sourceDir = options.sourceDir || packageRoot();

  if (args._ === "help" || args.help) {
    printHelp();
    return { command: "help" };
  }

  if (args._ === "install") {
    return runInstall(
      { target: args.target || "both" },
      {
        ...options,
        sourceDir,
      }
    );
  }

  if (args._ === "doctor") {
    return runDoctor({ json: args.json === "true" }, options);
  }

  if (args._ === "uninstall") {
    return runUninstall(
      {
        target: args.target || "both",
        "remove-files": args["remove-files"] || "false",
      },
      options
    );
  }

  if (args._ === "distill") {
    return runDistillPatterns(args, options);
  }

  throw new Error(`Unknown command: ${args._}`);
}

function main() {
  const args = parseArgs(process.argv);
  run(args);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  main,
  parseArgs,
  printHelp,
  run,
};
