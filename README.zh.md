# self-improvement-skill

面向 agent skills 的本地、证据化自改进工具。

`self-improvement-skill` 会安装一个 `self-improvement` skill，并可选配置
Claude Code / Codex hooks。当某次 slash skill 使用后出现用户纠正时，hooks 可以把这次反馈记录成本地学习证据，而不是把一次性的反馈直接变成不可追溯的长期规则。

English documentation: [README.md](README.md).

## 适用场景

当你希望 agent skills 从真实使用中持续改进，同时保留可审计的改进链路时，可以使用这个项目：

- 记录用户纠正、失败、绕行方案和可复用成功模式
- 把原始证据保存在本地 `.learnings/` 文件中
- 将重复出现的 lesson 归纳为候选晋升规则
- 后续再由人判断候选规则是否应该成为长期 skill 规则

这个项目不会直接改写其它 `SKILL.md` 文件。它负责记录证据并生成候选项，方便人在晋升长期规则前审查。

## 环境要求

- Node.js 18 或更新版本
- 如需 hook 自动记录，需要 Claude Code 和/或 Codex CLI
- 本地环境允许 CLI 写入 `~/.claude` 和/或 `~/.codex`

## 快速开始

同时安装到两个支持的平台：

```bash
npx self-improvement-skill install
```

只安装到单个平台：

```bash
npx self-improvement-skill install --target claude
npx self-improvement-skill install --target codex
```

检查安装状态：

```bash
npx self-improvement-skill doctor
```

安装后正常使用 Claude Code 或 Codex。当你执行 `/super-get-wiki` 这类 slash skill，并在下一轮用“不对”“不是这个”“应该先...”这类话纠正输出时，hook 可以把这条反馈记录到前一次使用的 skill 上。

## 安装内容

安装器会把这个 skill 复制到选定平台的全局 skill 目录：

- `~/.claude/skills/self-improvement`
- `~/.codex/skills/self-improvement`

同时会把受管理的 hook 写入选定平台的配置文件：

- `~/.claude/settings.json`
- `~/.codex/hooks.json`

这些 hook 会指向已安装 skill 目录中的脚本。已有的非托管配置应保持在安装器管理区块之外。

## 工作方式

学习闭环分成两层：

1. `UserPromptSubmit` 跟踪最近一次 slash skill，并检测后续用户输入是否像可复用纠正。
2. `Stop` 在宿主运行时提供输出时捕获最新助手回复，让下一次纠正有具体 observed 上下文。

记录后的事件会进入以下流程：

1. 原始事件追加到 `.learnings/events.jsonl`。
2. 同步生成人类可读的 Markdown 日志到 `.learnings/`。
3. 将重复 lesson 归纳到 `.learnings/patterns.json`。
4. 在 `.learnings/promotion_candidates.md` 中生成候选晋升项。
5. 由人判断证据是否足够，是否晋升为长期规则。

默认晋升阈值：

- `evidence_count >= 3`
- `distinct_tasks >= 2`
- 最近 30 天内出现过
- 能表达成可复用 instruction

## 隐私与本地数据

这个包面向本地证据收集。学习文件会写入已安装的 `self-improvement` skill 的 `.learnings/` 目录。

项目不包含云同步服务或遥测管线。学习日志可能包含用户输入、助手输出片段和纠正内容，因此应视为潜在敏感数据。分享或发布任何生成文件前，请先审查 `.learnings/`。

## CLI 参考

```bash
npx self-improvement-skill install [--target both|claude|codex]
npx self-improvement-skill doctor [--json]
npx self-improvement-skill uninstall [--target both|claude|codex] [--remove-files]
npx self-improvement-skill distill [--min-evidence 3] [--min-distinct-tasks 2]
```

完整命令说明见 [CLI.md](CLI.md)。

## 卸载

只移除受管理的 hook：

```bash
npx self-improvement-skill uninstall
```

移除受管理的 hook，并删除已安装的 skill 文件：

```bash
npx self-improvement-skill uninstall --remove-files
```

只卸载单个平台：

```bash
npx self-improvement-skill uninstall --target claude
npx self-improvement-skill uninstall --target codex
```

## 运行时集成

hook 行为见 [HOOKS_INSTALL.md](HOOKS_INSTALL.md)。记录器使用的最小事件上下文是：

- `used_skill`：产生经验的 skill
- `signal`：`correction`、`failure`、`success`、`workaround` 或
  `capability_gap`
- `task`：任务摘要
- `observed`：实际行为或上一轮助手输出
- `feedback`：用户原始纠正或接受信号
- `lesson`：可复用 lesson
- `target_scope`：通常是 `skill`
- `target_name`：通常是被使用的 skill 名称

不要记录每一次 skill 调用。只有包含可复用 lesson 的事件才应该记录。

## 手动脚本入口

团队使用优先走 CLI 和 hooks。下面这些脚本保留给测试、调试和自定义运行时集成：

```bash
node scripts/log-learning.js --help
node scripts/record-from-context.js --help
node scripts/distill-patterns.js --help
```

当宿主运行时已经判断出需要记录某个可复用信号时，用 `record-from-context.js`。当完整事件字段已经明确时，用 `log-learning.js`。

## 开发

运行测试：

```bash
npm test
```

测试覆盖 CLI 参数、hook 行为、安装配置、事件记录、模式归纳和端到端本地学习流程。

## 目录结构

```text
self-improvement-skill/
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
`-- tests/
```

## 贡献

欢迎提交 issue 和 pull request。代码变更请在提交 PR 前运行 `npm test`，并尽量让每次变更聚焦在一个行为或一份文档上。

请避免提交本地 `.learnings/` 数据、生成的 npm 包 tarball 或机器相关的 hook 配置。

## 许可证

[MIT](LICENSE)
