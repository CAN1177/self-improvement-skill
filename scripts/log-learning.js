#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const VALID_TYPES = new Set([
  "success_pattern",
  "user_correction",
  "error_pattern",
  "feature_request",
]);

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
  node scripts/log-learning.js \\
    --skill <skill_name> \\
    --type <success_pattern|user_correction|error_pattern|feature_request> \\
    --task <task_summary> \\
    --happened <what_happened> \\
    --feedback <user_feedback> \\
    --lesson <proposed_lesson> \\
    --scope <target_scope> \\
    --target <target_name> \\
    [--task-id <task_id>] \\
    [--source <source_reference>]
`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function compactDateStamp(iso) {
  return iso.replace(/[-:.TZ]/g, "").slice(0, 14);
}

function appendMarkdown(logFile, event) {
  const content = [
    "",
    `## ${event.timestamp}`,
    `- id: ${event.id}`,
    `- skill_name: ${event.skill_name}`,
    `- signal_type: ${event.signal_type}`,
    `- task_summary: ${event.task_summary}`,
    `- what_happened: ${event.what_happened}`,
    `- user_feedback: ${event.user_feedback || "(none)"}`,
    `- proposed_lesson: ${event.proposed_lesson}`,
    `- target_scope: ${event.target_scope}`,
    `- target_name: ${event.target_name}`,
    `- task_id: ${event.task_id || "(none)"}`,
    `- source_reference: ${event.source_reference || "(none)"}`,
    "",
  ].join("\n");

  fs.appendFileSync(logFile, content, "utf8");
}

function pickLogFile(learningsDir, signalType) {
  if (signalType === "error_pattern") {
    return path.join(learningsDir, "ERRORS.md");
  }
  if (signalType === "feature_request") {
    return path.join(learningsDir, "FEATURE_REQUESTS.md");
  }
  return path.join(learningsDir, "LEARNINGS.md");
}

function validateArgs(args) {
  const required = [
    "skill",
    "type",
    "task",
    "happened",
    "feedback",
    "lesson",
    "scope",
    "target",
  ];

  for (const key of required) {
    if (!args[key]) {
      throw new Error(`Missing required argument --${key}`);
    }
  }

  if (!VALID_TYPES.has(args.type)) {
    throw new Error(`Invalid --type value: ${args.type}`);
  }
}

function run(args, options = {}) {
  validateArgs(args);

  const skillDir = options.skillDir || path.resolve(__dirname, "..");
  const learningsDir = path.join(skillDir, ".learnings");
  ensureDir(learningsDir);

  const timestamp = options.nowIso ? options.nowIso() : nowIso();
  const event = {
    id: `evt-${compactDateStamp(timestamp)}`,
    timestamp,
    skill_name: args.skill,
    signal_type: args.type,
    task_summary: args.task,
    what_happened: args.happened,
    user_feedback: args.feedback,
    proposed_lesson: args.lesson,
    target_scope: args.scope,
    target_name: args.target,
    task_id: args["task-id"] || "",
    source_reference: args.source || "",
  };

  const eventsFile = path.join(learningsDir, "events.jsonl");
  fs.appendFileSync(eventsFile, `${JSON.stringify(event)}\n`, "utf8");

  const logFile = pickLogFile(learningsDir, event.signal_type);
  appendMarkdown(logFile, event);

  console.log(`Recorded learning event ${event.id}`);
  return event;
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
  VALID_TYPES,
  appendMarkdown,
  compactDateStamp,
  ensureDir,
  main,
  nowIso,
  parseArgs,
  pickLogFile,
  printHelp,
  run,
  validateArgs,
};
