const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  parseArgs,
  run,
} = require("../bin/cli.js");
const { run: installTeamSkillRun } = require("../scripts/install-team-skill.js");
const { run: runDoctor } = require("../scripts/doctor.js");
const { run: runUninstall } = require("../scripts/uninstall-team-skill.js");

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "self-improvement-cli-"));
}

function makeSourceSkill(root) {
  const dir = path.join(root, "source-skill");
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "SKILL.md"), "# skill\n", "utf8");
  for (const file of [
    "claude-hook-user-prompt-submit.js",
    "claude-hook-stop.js",
    "codex-hook-user-prompt-submit.js",
    "codex-hook-stop.js",
  ]) {
    fs.writeFileSync(path.join(dir, "scripts", file), "", "utf8");
  }
  return dir;
}

test("parseArgs supports boolean flags", () => {
  assert.deepEqual(parseArgs(["node", "cli.js", "doctor", "--json"]), {
    _: "doctor",
    json: "true",
  });
});

test("doctor reports installed hooks and writable learnings", () => {
  const root = makeTempRoot();
  const sourceDir = makeSourceSkill(root);
  const claudeSkillDir = path.join(root, "claude-skill");
  const codexSkillDir = path.join(root, "codex-skill");
  const claudeSettingsFile = path.join(root, "claude-settings.json");
  const codexHooksFile = path.join(root, "codex-hooks.json");

  installTeamSkillRun(
    { target: "both" },
    {
      sourceDir,
      claudeSkillDir,
      codexSkillDir,
      claudeSettingsFile,
      codexHooksFile,
    }
  );

  const result = runDoctor(
    {},
    {
      claudeSkillDir,
      codexSkillDir,
      claudeSettingsFile,
      codexHooksFile,
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.platforms.length, 2);
});

test("uninstall removes managed hooks and optionally installed files", () => {
  const root = makeTempRoot();
  const sourceDir = makeSourceSkill(root);
  const claudeSkillDir = path.join(root, "claude-skill");
  const codexSkillDir = path.join(root, "codex-skill");
  const claudeSettingsFile = path.join(root, "claude-settings.json");
  const codexHooksFile = path.join(root, "codex-hooks.json");

  installTeamSkillRun(
    { target: "both" },
    {
      sourceDir,
      claudeSkillDir,
      codexSkillDir,
      claudeSettingsFile,
      codexHooksFile,
    }
  );

  runUninstall(
    { target: "both", "remove-files": "true" },
    {
      claudeSkillDir,
      codexSkillDir,
      claudeSettingsFile,
      codexHooksFile,
    }
  );

  const result = runDoctor(
    {},
    {
      claudeSkillDir,
      codexSkillDir,
      claudeSettingsFile,
      codexHooksFile,
    }
  );

  assert.equal(fs.existsSync(claudeSkillDir), false);
  assert.equal(fs.existsSync(codexSkillDir), false);
  assert.equal(result.ok, false);
  assert.equal(result.platforms[0].user_prompt_hook, false);
  assert.equal(result.platforms[1].stop_hook, false);
});

test("CLI install delegates to team installer", () => {
  const root = makeTempRoot();
  const sourceDir = makeSourceSkill(root);
  const result = run(
    { _: "install", target: "claude" },
    {
      sourceDir,
      claudeSkillDir: path.join(root, "claude-skill"),
      claudeSettingsFile: path.join(root, "claude-settings.json"),
    }
  );

  assert.equal(Boolean(result.claude), true);
  assert.equal(Boolean(result.codex), false);
});
