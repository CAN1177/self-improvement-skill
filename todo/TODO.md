# TODO — 待处理的不足

对 self-improvement-skill 通读后梳理出的不足，按「是否影响核心学习闭环能否跑起来」分为 A/B/C 三类。核心闭环：追踪 slash skill → 捕获助手回复 → 检测纠正记事件 → 蒸馏候选规则 → 人工晋升。

---

## A 类 — 可能让核心闭环根本不工作（最关键）

### A1. `observed` 上下文大概率永远为空
**问题**：`Stop` hook（`scripts/hook-utils.js` 的 `handleStopPayload`）依赖 payload 里存在 `last_assistant_message` / `assistant_message` / `response` / `output_text` 等字段拿助手回复正文。但 Claude Code 的 Stop hook 实际不直接在 stdin 传正文——正文在 transcript 文件（`~/.claude/projects/<slug>/<session>.jsonl`，助手正文在 `message` 嵌套字段）。
**影响**：`observed`（"观察到的行为"）很可能一直为空，记录的 event 缺失最关键上下文。
**证据状态**：初步证据支持（真实 transcript 中正文在 `.jsonl` 的 `message` 字段，非顶层）；实证验证（临时装 Stop hook dump stdin）**尚未完成**。
**待办**：
- [ ] 完成实证验证，确认 Stop hook stdin 真实字段
- [ ] 若确认不传正文，改为通过 `transcript_path` 读 transcript 解析最后一条 assistant message
- [ ] 核对 `UserPromptSubmit` 是否真有 `prompt`、`turn_id` 字段

### A2. 纠正检测只支持中文，与英文文档矛盾
**问题**：`looksLikeCorrection` / `CORRECTION_PREFIXES` 只匹配中文前缀（"不对/不是/应该"等），但英文 README 承诺检测 "wrong"、"not that"、"you should have..."。
**影响**：文档与实现直接矛盾。英文用户装上后基本记录不到纠正事件。
**待办**：
- [ ] 补充英文纠正短语/模式，或明确文档只支持中文（消除矛盾）

### A3. lesson 质量差，导致晋升阈值形同虚设
**问题**：`inferLesson` 只把用户原话去掉开头的"不对"等词直接当 lesson。而 `distill-patterns.js` 用 lesson 原文做聚合 key（`buildPatternKey`）。用户每次措辞不同 → 几乎永远聚不到同一 key → 达不到 ≥3 证据 → 候选永远晋升不了。
**影响**：闭环后半段（蒸馏→晋升）实际是断的。
**待办**：
- [ ] 改进 lesson 归一化/语义聚合，或调整聚合 key 策略（如按 skill + signal_type 粗聚再人工细分）

---

## B 类 — 设计缺陷，会污染数据或误归因

### B4. 单一全局状态 + 无 TTL
**问题**：只有一个 `last-skill-context.json`（`scripts/runtime-state.js`）。多 session / 多 skill 交替会互相覆盖；且无过期时间——3 天前用过的 skill，今天一句"不对"会被错误归因过去。
**待办**：
- [ ] 状态按 session 隔离
- [ ] 给追踪的 skill 上下文加 TTL，过期不归因

### B5. 无去重
**问题**：同一纠正被 hook 触发多次或用户重复说，会记多条重复事件，直接虚高 `evidence_count`。
**待办**：
- [ ] 记录前按内容/时间窗去重

### B6. 晋升之后无闭环
**问题**：候选写进 `promotion_candidates.md`（`distill-patterns.js`）后没有"已采纳/已拒绝"状态，每次 distill 重复列出同样候选，无法收敛。
**待办**：
- [ ] 给候选加状态跟踪（pending / accepted / rejected），已处理的不再重复列出

---

## C 类 — 健壮性与可用性

### C7. 一行坏 JSON 就让整个 distill 崩溃
**问题**：`readJsonLines`（`distill-patterns.js`）遇到坏行直接 throw。append-only 日志一旦某次写入被打断就永久损坏。
**待办**：
- [ ] 坏行跳过并告警，而非整体崩溃；写入考虑原子性

### C8. 没有查看/管理命令
**问题**：CLI 只有 install/doctor/uninstall/distill。想看记了什么只能手动翻 markdown。
**待办**：
- [ ] 增加 `list` / `status` / `report` 命令

### C9. 零敏感数据防护
**问题**：事件原样存用户 prompt 和助手输出片段，可能含密钥，工具本身不做脱敏，只在 README 提醒。
**待办**：
- [ ] 记录前做基础脱敏（如常见密钥/token 模式）

### C10. Codex hook 格式存疑
**问题**：代码假设 Codex 的 `hooks.json` 结构与 Claude 完全一样（`install-codex-hooks.js`），但 HOOKS_INSTALL.md 自己都说 Codex 也可能用 `config.toml`——兼容性可能没对齐真实格式。
**待办**：
- [ ] 核对 Codex 真实 hook 配置格式，对齐或补充 config.toml 支持

---

*备注：`/tmp/hook-probe/` 下有为验证 A1 准备的 stdin dump 脚本和 settings 备份，验证完成后可删。settings.json 未被修改。*
