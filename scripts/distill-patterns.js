#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
  node scripts/distill-patterns.js [--min-evidence 3] [--min-distinct-tasks 2]
`);
}

function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const lines = fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSON on line ${index + 1} of ${filePath}`);
    }
  });
}

function normalizeKeyPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\u4e00-\u9fa5 -]/g, "");
}

function buildPatternKey(event) {
  return [
    normalizeKeyPart(event.target_scope),
    normalizeKeyPart(event.target_name),
    normalizeKeyPart(event.proposed_lesson),
  ].join("::");
}

function isRecent(timestamp) {
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) {
    return false;
  }
  return Date.now() - time <= THIRTY_DAYS_MS;
}

function groupEvents(events) {
  const groups = new Map();

  for (const event of events) {
    const key = buildPatternKey(event);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(event);
  }

  return groups;
}

function createPattern(key, events) {
  const first = events[0];
  const distinctTasks = new Set(
    events
      .map((event) => event.task_id || event.task_summary)
      .filter(Boolean)
  );
  const signalTypes = Array.from(
    new Set(events.map((event) => event.signal_type).filter(Boolean))
  );
  const evidenceRefs = events.map((event) => event.id);
  const lastSeen = events
    .map((event) => event.timestamp)
    .sort()
    .slice(-1)[0];

  return {
    pattern_key: key,
    summary: first.proposed_lesson,
    evidence_count: events.length,
    distinct_tasks: distinctTasks.size,
    last_seen: lastSeen,
    recent: isRecent(lastSeen),
    signal_types: signalTypes,
    target_scope: first.target_scope,
    target_name: first.target_name,
    candidate_rule: first.proposed_lesson,
    evidence_refs: evidenceRefs,
    status: "candidate",
  };
}

function buildCandidates(patterns, minEvidence, minDistinctTasks) {
  return patterns.filter((pattern) => {
    return (
      pattern.evidence_count >= minEvidence &&
      pattern.distinct_tasks >= minDistinctTasks &&
      pattern.recent
    );
  });
}

function writePatterns(filePath, patterns) {
  const payload = {
    generated_at: new Date().toISOString(),
    patterns,
  };
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function renderCandidates(candidates) {
  if (candidates.length === 0) {
    return "# Promotion Candidates\n\nNo promoted candidates yet.\n";
  }

  const lines = ["# Promotion Candidates", ""];
  for (const candidate of candidates) {
    lines.push(`## Candidate: ${candidate.pattern_key}`);
    lines.push("");
    lines.push(`- Target scope: \`${candidate.target_scope}\``);
    lines.push(`- Target name: \`${candidate.target_name}\``);
    lines.push(`- Evidence count: ${candidate.evidence_count}`);
    lines.push(`- Distinct tasks: ${candidate.distinct_tasks}`);
    lines.push(`- Last seen: ${candidate.last_seen}`);
    lines.push(`- Candidate rule: ${candidate.candidate_rule}`);
    lines.push("");
    lines.push("### Evidence refs");
    lines.push("");
    for (const ref of candidate.evidence_refs) {
      lines.push(`- ${ref}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function validateThresholds(args) {
  const minEvidence = Number(args["min-evidence"] || 3);
  const minDistinctTasks = Number(args["min-distinct-tasks"] || 2);

  if (!Number.isFinite(minEvidence) || minEvidence < 1) {
    throw new Error("Invalid --min-evidence value");
  }
  if (!Number.isFinite(minDistinctTasks) || minDistinctTasks < 1) {
    throw new Error("Invalid --min-distinct-tasks value");
  }

  return { minEvidence, minDistinctTasks };
}

function run(args = {}, options = {}) {
  const { minEvidence, minDistinctTasks } = validateThresholds(args);

  const skillDir = options.skillDir || path.resolve(__dirname, "..");
  const learningsDir = path.join(skillDir, ".learnings");
  const eventsFile = path.join(learningsDir, "events.jsonl");
  const patternsFile = path.join(learningsDir, "patterns.json");
  const candidatesFile = path.join(learningsDir, "promotion_candidates.md");

  const events = readJsonLines(eventsFile);
  const groups = groupEvents(events);
  const patterns = Array.from(groups.entries())
    .map(([key, groupedEvents]) => createPattern(key, groupedEvents))
    .sort((a, b) => {
      if (a.evidence_count !== b.evidence_count) {
        return b.evidence_count - a.evidence_count;
      }
      return String(b.last_seen).localeCompare(String(a.last_seen));
    });

  const candidates = buildCandidates(patterns, minEvidence, minDistinctTasks);

  writePatterns(patternsFile, patterns);
  fs.writeFileSync(candidatesFile, renderCandidates(candidates), "utf8");

  console.log(
    `Distilled ${patterns.length} pattern(s), promoted ${candidates.length} candidate(s)`
  );
  return { patterns, candidates, patternsFile, candidatesFile };
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
  THIRTY_DAYS_MS,
  buildCandidates,
  buildPatternKey,
  createPattern,
  groupEvents,
  isRecent,
  main,
  normalizeKeyPart,
  parseArgs,
  printHelp,
  readJsonLines,
  renderCandidates,
  run,
  validateThresholds,
  writePatterns,
};
