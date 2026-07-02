# self-improvement

面向 agent skills 的证据化自改进工具。这个包会安装 `self-improvement` skill，并配置 Claude Code / Codex hooks，让 slash skill 后续出现的用户纠正自动沉淀到 `.learnings/`。

## 快速开始

```bash
npx self-improvement-skill install
npx self-improvement-skill doctor
```

安装后正常使用 Claude Code 或 Codex。当你执行 `/super-get-wiki` 这类 slash skill，并在下一轮用“不对...”“应该先...”这类话纠正输出时，hook 会把这条纠错记录到已安装 skill 的 `.learnings/` 目录。

## CLI

```bash
npx self-improvement-skill install [--target both|claude|codex]
npx self-improvement-skill doctor [--json]
npx self-improvement-skill uninstall [--target both|claude|codex] [--remove-files]
npx self-improvement-skill distill [--min-evidence 3] [--min-distinct-tasks 2]
```

完整说明见 [CLI.md](CLI.md)。

## 安装内容

CLI 会把 skill 安装到：

- `~/.claude/skills/self-improvement`
- `~/.codex/skills/self-improvement`

同时写入受管理的 hook 配置：

- `~/.claude/settings.json`
- `~/.codex/hooks.json`

hooks 是自动化层：在 `UserPromptSubmit` 里跟踪最近一次 slash skill，在 `Stop` 里尽量保存上一轮助手输出，并在下一次用户输入像纠错时，把纠错挂到最近一次 skill 上。

## 学习闭环

这个 skill 不直接改写其它 `SKILL.md`，而是把改进拆成可追溯流程：

1. 原始事件写入 `.learnings/events.jsonl`。
2. 同步写入 `.learnings/` 下的人类可读 Markdown 日志。
3. 把重复 lesson 归纳到 `.learnings/patterns.json`。
4. 生成 `.learnings/promotion_candidates.md`。
5. 证据足够后，再决定是否晋升为长期规则或目标 skill 修改。

默认晋升阈值：

1. `evidence_count >= 3`
2. `distinct_tasks >= 2`
3. 最近 30 天内出现过
4. 能表达成可复用 instruction

## 脚本入口

团队使用优先走 CLI 和 hooks。下面这些脚本保留给测试、调试和自定义运行时集成：

```bash
node scripts/log-learning.js --help
node scripts/record-from-context.js --help
node scripts/distill-patterns.js --help
```

当宿主运行时已经判断出需要记录某个可复用信号时，用 `record-from-context.js`。当完整事件字段已经明确时，用 `log-learning.js`。

## 运行时集成

hook 行为见 [HOOKS_INSTALL.md](HOOKS_INSTALL.md)。记录器使用的最小上下文是：

- `used_skill`：产生经验的 skill
- `signal`：`correction`、`failure`、`success`、`workaround` 或 `capability_gap`
- `task`：任务摘要
- `observed`：实际行为或上一轮助手输出
- `feedback`：用户原始纠错或接受信号
- `lesson`：可复用 lesson
- `target_scope`：通常是 `skill`
- `target_name`：通常是被使用的 skill 名称

不要记录每一次 skill 调用。只有包含可复用 lesson 的事件才应该记录。

## 目录结构

```text
self-improvement/
|-- SKILL.md
|-- README.md
|-- README.zh.md
|-- CLI.md
|-- HOOKS_INSTALL.md
|-- bin/
|   `-- cli.js
|-- scripts/
|   |-- log-learning.js
|   |-- record-from-context.js
|   |-- distill-patterns.js
|   |-- install-team-skill.js
|   |-- uninstall-team-skill.js
|   |-- install-claude-hooks.js
|   |-- install-codex-hooks.js
|   |-- claude-hook-user-prompt-submit.js
|   |-- claude-hook-stop.js
|   |-- codex-hook-user-prompt-submit.js
|   `-- codex-hook-stop.js
|-- integrations/
|-- references/
|   `-- event-schema.md
`-- .learnings/
    |-- events.jsonl
    |-- patterns.json
    `-- promotion_candidates.md
```

## 测试

```bash
npm test
```

测试覆盖 CLI 参数、hook 行为、安装配置、事件记录、模式归纳和端到端本地学习流程。

## 文件

- [SKILL.md](SKILL.md)：agent 侧规则
- [CLI.md](CLI.md)：npm CLI 说明
- [HOOKS_INSTALL.md](HOOKS_INSTALL.md)：Claude Code 和 Codex hooks 行为
- [references/event-schema.md](references/event-schema.md)：事件结构
- [scripts/log-learning.js](scripts/log-learning.js)：底层事件记录器
- [scripts/record-from-context.js](scripts/record-from-context.js)：面向运行时的记录入口
- [scripts/hook-utils.js](scripts/hook-utils.js)：hook 共享逻辑
- [scripts/install-team-skill.js](scripts/install-team-skill.js)：CLI 使用的安装器
- [scripts/distill-patterns.js](scripts/distill-patterns.js)：模式归纳脚本
