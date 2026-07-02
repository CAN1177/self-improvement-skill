const fs = require("fs");
const path = require("path");

const { run: recordFromContextRun } = require("./record-from-context.js");
const {
  readState,
  trackSkillContext,
  updateState,
} = require("./runtime-state.js");

const CORRECTION_PREFIXES = [
  "不对",
  "不是",
  "不行",
  "不应该",
  "错了",
  "有问题",
  "不需要",
  "不要这样",
  "先不要",
  "应该",
  "应当",
  "改成",
  "换成",
  "可以先",
  "应该先",
];

const BUILTIN_SLASH_COMMANDS = new Set([
  "add-dir",
  "agent",
  "agents",
  "approve",
  "apps",
  "clear",
  "compact",
  "config",
  "continue",
  "doctor",
  "exit",
  "feedback",
  "help",
  "hooks",
  "import",
  "mcp",
  "memories",
  "model",
  "plugins",
  "quit",
  "resume",
  "skills",
]);

function readJsonStdin() {
  const raw = fs.readFileSync(0, "utf8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

function pickFirstString(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function extractPrompt(payload) {
  return pickFirstString([
    payload.prompt,
    payload.user_prompt,
    payload.message,
    payload.input,
    payload.text,
  ]);
}

function extractAssistantMessage(payload) {
  return pickFirstString([
    payload.last_assistant_message,
    payload.assistant_message,
    payload.message,
    payload.response,
    payload.output_text,
  ]);
}

function extractSlashCommand(prompt) {
  const text = String(prompt || "").trim();
  if (!text.startsWith("/")) {
    return "";
  }
  const command = text.slice(1).split(/\s+/)[0].trim();
  return command;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function looksLikeCorrection(message) {
  const text = normalizeText(message);
  if (!text) {
    return false;
  }

  if (CORRECTION_PREFIXES.some((prefix) => text.startsWith(prefix))) {
    return true;
  }

  return /不要|别|先.*再|不是.*而是|应该.*不要|应该先|先不要/.test(text);
}

function inferLesson(message) {
  const text = normalizeText(message);
  if (!text) {
    return "";
  }

  const stripped = text
    .replace(/^(不对|不是|不行|错了|有问题)[，,\s]*/u, "")
    .replace(/^(应该|应当|可以|可以先|应该先|先不要)[，,\s]*/u, "")
    .trim();

  return stripped || text;
}

function shouldTrackSlashCommand(command) {
  if (!command) {
    return false;
  }
  return !BUILTIN_SLASH_COMMANDS.has(command);
}

function handlePromptPayload(payload, options = {}) {
  const skillDir = options.skillDir || path.resolve(__dirname, "..");
  const prompt = extractPrompt(payload);
  if (!prompt) {
    return { action: "skip", reason: "no prompt" };
  }

  const command = extractSlashCommand(prompt);
  if (command && shouldTrackSlashCommand(command)) {
    const result = trackSkillContext(skillDir, {
      used_skill: command,
      task: prompt,
      observed: "",
      task_id: payload.turn_id || "",
      source_reference: `${options.platform || "hook"}:${payload.hook_event_name || "UserPromptSubmit"}`,
    });
    return { action: "tracked-skill", result };
  }

  if (!looksLikeCorrection(prompt)) {
    return { action: "skip", reason: "prompt does not look like a correction" };
  }

  const tracked = readState(skillDir);
  const usedSkill = tracked.used_skill;
  if (!usedSkill) {
    return { action: "skip", reason: "no tracked skill context" };
  }

  const event = recordFromContextRun(
    {
      "used-skill": usedSkill,
      signal: "correction",
      task: tracked.task || "(unspecified task)",
      observed: tracked.observed || "(user corrected previous output)",
      feedback: prompt,
      lesson: inferLesson(prompt),
      "target-scope": "skill",
      "target-name": usedSkill,
      "task-id": payload.turn_id || tracked.task_id || "",
      source: `${options.platform || "hook"}:${payload.hook_event_name || "UserPromptSubmit"}`,
    },
    { skillDir }
  );
  return { action: "recorded-correction", event };
}

function handleStopPayload(payload, options = {}) {
  const skillDir = options.skillDir || path.resolve(__dirname, "..");
  const message = extractAssistantMessage(payload);
  if (!message) {
    return { action: "skip", reason: "no assistant message" };
  }

  const next = updateState(skillDir, (state) => ({
    ...state,
    observed: message,
    last_turn_id: pickFirstString([payload.turn_id, state.last_turn_id]),
    last_stop_source: `${options.platform || "hook"}:${payload.hook_event_name || "Stop"}`,
  }));

  return { action: "updated-observed", state: next };
}

module.exports = {
  CORRECTION_PREFIXES,
  BUILTIN_SLASH_COMMANDS,
  extractAssistantMessage,
  extractPrompt,
  extractSlashCommand,
  handlePromptPayload,
  handleStopPayload,
  inferLesson,
  looksLikeCorrection,
  normalizeText,
  pickFirstString,
  readJsonStdin,
  shouldTrackSlashCommand,
};
