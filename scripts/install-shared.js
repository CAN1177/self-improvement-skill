const fs = require("fs");
const path = require("path");

const EXCLUDED_TOP_LEVEL = new Set([
  ".git",
  "node_modules",
  ".DS_Store",
  ".learnings",
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function shouldCopy(src, rootDir) {
  const rel = path.relative(rootDir, src);
  if (!rel) {
    return true;
  }
  const top = rel.split(path.sep)[0];
  if (EXCLUDED_TOP_LEVEL.has(top)) {
    return false;
  }
  return true;
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function copySkillTree(sourceDir, targetDir) {
  resetDir(targetDir);
  fs.cpSync(sourceDir, targetDir, {
    recursive: true,
    filter: (src) => shouldCopy(src, sourceDir),
  });
  ensureDir(path.join(targetDir, ".learnings", "runtime"));
}

function readJson(file) {
  if (!fs.existsSync(file)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, payload) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function ensureArrayPath(root, key) {
  if (!root[key]) {
    root[key] = [];
  }
  return root[key];
}

function removeManagedCommandHooks(eventHandlers, markerNames) {
  return eventHandlers
    .map((group) => {
      if (!Array.isArray(group.hooks)) {
        return group;
      }
      const hooks = group.hooks.filter((hook) => {
        if (hook.type !== "command" || !hook.command) {
          return true;
        }
        const base = path.basename(hook.command);
        return !markerNames.has(base);
      });
      return { ...group, hooks };
    })
    .filter((group) => Array.isArray(group.hooks) && group.hooks.length > 0);
}

function addCommandHook(eventHandlers, commandPath) {
  eventHandlers.push({
    hooks: [
      {
        type: "command",
        command: commandPath,
      },
    ],
  });
}

module.exports = {
  addCommandHook,
  copySkillTree,
  ensureArrayPath,
  ensureDir,
  readJson,
  removeManagedCommandHooks,
  resetDir,
  writeJson,
};
