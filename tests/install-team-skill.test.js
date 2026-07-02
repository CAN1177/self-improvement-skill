const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { run: installClaudeHooks } = require("../scripts/install-claude-hooks.js");
const { run: installCodexHooks } = require("../scripts/install-codex-hooks.js");
const { run: installTeamSkillRun } = require("../scripts/install-team-skill.js");

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "self-improvement-install-"));
}

function makeSourceSkill(root) {
  const dir = path.join(root, "source-skill");
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "SKILL.md"), "# skill\n", "utf8");
  fs.writeFileSync(
    path.join(dir, "scripts", "claude-hook-user-prompt-submit.js"),
    "",
    "utf8"
  );
  fs.writeFileSync(path.join(dir, "scripts", "claude-hook-stop.js"), "", "utf8");
  fs.writeFileSync(
    path.join(dir, "scripts", "codex-hook-user-prompt-submit.js"),
    "",
    "utf8"
  );
  fs.writeFileSync(path.join(dir, "scripts", "codex-hook-stop.js"), "", "utf8");
  fs.mkdirSync(path.join(dir, ".learnings", "runtime"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".learnings", "events.jsonl"), "old\n", "utf8");
  return dir;
}

test("hook installers replace old managed paths with installed skill paths", () => {
  const root = makeTempRoot();
  const settingsFile = path.join(root, "claude-settings.json");
  const hooksFile = path.join(root, "codex-hooks.json");
  const claudeInstalledDir = path.join(root, "claude-skill");
  const codexInstalledDir = path.join(root, "codex-skill");
  fs.mkdirSync(path.join(claudeInstalledDir, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(codexInstalledDir, "scripts"), { recursive: true });

  fs.writeFileSync(
    settingsFile,
    JSON.stringify({
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: "command",
                command: "/old/repo/scripts/claude-hook-user-prompt-submit.js",
              },
            ],
          },
        ],
      },
    }),
    "utf8"
  );

  fs.writeFileSync(
    hooksFile,
    JSON.stringify({
      hooks: {
        Stop: [
          {
            hooks: [
              {
                type: "command",
                command: "/old/repo/scripts/codex-hook-stop.js",
              },
            ],
          },
        ],
      },
    }),
    "utf8"
  );

  installClaudeHooks({ settingsFile, skillDir: claudeInstalledDir });
  installCodexHooks({ hooksFile, skillDir: codexInstalledDir });

  const claudeSettings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
  const codexHooks = JSON.parse(fs.readFileSync(hooksFile, "utf8"));

  assert.equal(
    claudeSettings.hooks.UserPromptSubmit[0].hooks[0].command,
    path.join(claudeInstalledDir, "scripts", "claude-hook-user-prompt-submit.js")
  );
  assert.equal(
    codexHooks.hooks.Stop[0].hooks[0].command,
    path.join(codexInstalledDir, "scripts", "codex-hook-stop.js")
  );
});

test("team installer copies the skill tree without learnings noise", () => {
  const root = makeTempRoot();
  const sourceDir = makeSourceSkill(root);
  const claudeTarget = path.join(root, "claude-install");
  const codexTarget = path.join(root, "codex-install");
  const settingsFile = path.join(root, "claude-settings.json");
  const hooksFile = path.join(root, "codex-hooks.json");

  installTeamSkillRun(
    { target: "both" },
    {
      sourceDir,
      claudeSkillDir: claudeTarget,
      codexSkillDir: codexTarget,
      claudeSettingsFile: settingsFile,
      codexHooksFile: hooksFile,
    }
  );

  assert.equal(fs.existsSync(path.join(claudeTarget, "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(codexTarget, "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(claudeTarget, ".learnings", "events.jsonl")), false);
  assert.equal(fs.existsSync(path.join(codexTarget, ".learnings", "events.jsonl")), false);
  assert.equal(fs.existsSync(path.join(claudeTarget, ".learnings", "runtime")), true);
  assert.equal(fs.existsSync(path.join(codexTarget, ".learnings", "runtime")), true);
});
