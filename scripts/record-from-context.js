#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { run: logLearningRun } = require("./log-learning.js");

const SIGNAL_MAP = {
  correction: "user_correction",
  user_correction: "user_correction",
  failure: "error_pattern",
  error: "error_pattern",
  error_pattern: "error_pattern",
  success: "success_pattern",
  success_pattern: "success_pattern",
  workaround: "success_pattern",
  capability_gap: "feature_request",
  feature: "feature_request",
  feature_request: "feature_request",
};

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
  node scripts/record-from-context.js --context-json <file>

  or:

  node scripts/record-from-context.js \\
    --used-skill <skill_name> \\
    --signal <correction|failure|success|workaround|capability_gap> \\
    --task <task_summary> \\
    --observed <what_happened> \\
    --feedback <user_feedback> \\
    --lesson <proposed_lesson> \\
    --target-scope <skill|project|new_skill> \\
    --target-name <target_name> \\
    [--task-id <task_id>] \\
    [--source <source_reference>]

Context JSON fields use the same names as the flags above.
`);
}

function readContextJson(filePath) {
  const resolved = path.resolve(filePath);
  try {
    return JSON.parse(fs.readFileSync(resolved, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read context JSON ${resolved}: ${error.message}`);
  }
}

function normalizeSignal(signal) {
  const key = String(signal || "").trim().toLowerCase();
  const normalized = SIGNAL_MAP[key];
  if (!normalized) {
    throw new Error(`Unsupported signal: ${signal}`);
  }
  return normalized;
}

function pick(context, flagName, jsonName = flagName) {
  return context[flagName] || context[jsonName];
}

function contextToLogArgs(context) {
  const usedSkill = pick(context, "used-skill", "used_skill");
  const targetName = pick(context, "target-name", "target_name") || usedSkill;

  return {
    skill: usedSkill,
    type: normalizeSignal(pick(context, "signal")),
    task: pick(context, "task"),
    happened: pick(context, "observed", "what_happened"),
    feedback: pick(context, "feedback", "user_feedback"),
    lesson: pick(context, "lesson", "proposed_lesson"),
    scope: pick(context, "target-scope", "target_scope") || "skill",
    target: targetName,
    "task-id": pick(context, "task-id", "task_id") || "",
    source: pick(context, "source", "source_reference") || "",
  };
}

function validateContext(context) {
  const required = [
    ["used-skill", "used_skill"],
    ["signal", "signal"],
    ["task", "task"],
    ["observed", "what_happened"],
    ["feedback", "user_feedback"],
    ["lesson", "proposed_lesson"],
  ];

  for (const [flagName, jsonName] of required) {
    if (!pick(context, flagName, jsonName)) {
      throw new Error(`Missing required context field: ${flagName}`);
    }
  }
}

function run(args, options = {}) {
  const context = args["context-json"]
    ? { ...readContextJson(args["context-json"]), ...args }
    : args;

  delete context["context-json"];
  validateContext(context);

  const logArgs = contextToLogArgs(context);
  return logLearningRun(logArgs, options);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
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
  SIGNAL_MAP,
  contextToLogArgs,
  main,
  normalizeSignal,
  parseArgs,
  printHelp,
  readContextJson,
  run,
  validateContext,
};
