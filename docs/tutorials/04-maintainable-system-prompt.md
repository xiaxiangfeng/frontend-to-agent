# 设计可维护的 System Prompt

## 本章目标

把「对比两个开源文档问答项目的文档导入与证据引用方式，给出有出处的借鉴建议」转成可执行的研究计划。计划列出研究问题、每步要用的资料和完成条件，以及最终交付物。

第 3 章根据会话 ID 选择要发给模型的历史。本章把注意力移到 `system` 消息，抽出可独立修改的指令，并让程序检查模型的输出。每次生成计划都能看到实际使用的指令版本。

## 完成后的可见结果

在仓库根目录运行 `pnpm research:plan`，终端输出两个练习项目的评审计划。输出包含 `mode: fixture`、`promptVersion: research-plan.v1` 和 `plan`。计划中的第一步如下。

```json
{
  "action": "分别从两个 README 提取文档导入与引用相关说明。",
  "sourceIds": ["a-readme", "b-readme"],
  "doneWhen": "为每个项目记录对应段落的标题，并标记 README 未说明的部分。"
}
```

对同一个评审请求，删掉 `doneWhen` 或将来源改成 `web-search`，校验会报告具体字段。命令停在计划生成与校验，资料读取与取证会在后续章节接入。

## 前置条件

- 使用 Node.js 24 和 pnpm 11，完成[第 3 章](./03-persist-conversations.md)。
- 默认练习通过固定响应模拟模型调用，费用为 ¥0。可选的在线练习复用[第 2 章的百炼配置](./02-call-qwen-with-typescript.md)。

## 起始代码检查点

在仓库根目录检出起点，先确认已有的模型和会话测试通过。

```text
git switch -c learn/chapter-04 chapter-04-start
pnpm install --frozen-lockfile
pnpm test
```

先取本章测试，只运行模型适配层的测试观察第一次失败。

```text
git restore --source=chapter-04-end --worktree -- packages/model-runtime/test/qwen.test.ts packages/research-core/test/research-plan.test.ts tests/repository/workspace.test.mjs
pnpm exec vitest run packages/model-runtime/test/qwen.test.ts
```

计划请求的测试会看到请求体缺少 `response_format`，并且仍使用 256 个输出 Token 的上限。

## 实现步骤

### 1. 给计划请求开启 JSON 输出

为 `complete(messages, options?)` 增加可选的输出设置。研究计划请求用 `responseFormat: 'json'` 和 `maxOutputTokens: 1024`。千问适配器把它们转换为 `response_format: { type: 'json_object' }` 和 `max_completion_tokens: 1024`。普通文本调用默认最多生成 256 个输出 Token。

百炼的 JSON Object 模式要求消息中出现 `JSON` 关键词。它约束输出语法，计划字段和来源权限由应用检查。 [百炼结构化输出](https://help.aliyun.com/zh/model-studio/qwen-structured-output)

```text
git restore --source=chapter-04-end --worktree -- packages/model-runtime/src/index.ts packages/model-runtime/src/cli.ts
pnpm exec vitest run packages/model-runtime/test
```

### 2. 给系统指令和研究任务各自一个位置

把角色、资料边界和输出结构写在 `research-plan-prompt.ts`。应用组装 `user` 消息，把用户的目标放在 `goal`，把本次允许的资料放在 `sources`。本章的目录由应用提供，只包含两个 README 的 ID 和描述。

```text
git restore --source=chapter-04-end --worktree -- packages/research-core/src/research-plan-prompt.ts
```

<<< ../../packages/research-core/src/research-plan-prompt.ts

如果新增「交付物逐条注明待核实问题所需的资料」这条指令，就把 `researchPlanPromptVersion` 更新为 `research-plan.v2`。离线测试能检查发出的消息和记录的版本。要观察措辞怎样影响模型输出，可以保持评审目标和来源不变，在线运行两个版本并对照结果。修改输出字段时，也更新 TypeScript 类型、运行时校验和测试。

### 3. 解析并检查计划

`createResearchPlan` 先从应用给出的目录取得允许的来源 ID，再发出模型请求。收到回复后用 `JSON.parse` 得到 `unknown`，逐项检查 `questions`、`steps`、`deliverable`，并验证每步的 `sourceIds` 都在允许范围内。

```text
git restore --source=chapter-04-end --worktree -- packages/research-core/src/research-plan.ts packages/research-core/src/review-fixture.ts
pnpm exec vitest run packages/research-core/test/research-plan.test.ts -t "validated plan|invalid plan output|output limit"
```

比如 `{"action":"查找项目介绍","sourceIds":["web-search"],"doneWhen":"找到三篇文章"}` 是合法的 JSON，但 `web-search` 超出这次任务的资料范围。校验检查的是程序掌握的来源 ID。实际读取资料时，执行器仍需按授权的 ID 查询并验证读取权限。

### 4. 在命令行验证同一个评审任务

加上 `research:plan` 命令。默认使用 `review-fixture.ts` 里的评审请求和固定回复，再走同一套解析与校验流程。

```text
git restore --source=chapter-04-end --worktree -- packages/research-core/src/plan-cli.ts packages/research-core/tsconfig.json package.json
pnpm research:plan
```

如果已按第 2 章配置 `.env`，可用支持 JSON Object 的模型（例如 `qwen3.8-flash`）生成一份在线计划。

```text
pnpm research:plan --live
```

在线模式向百炼发送一次请求，包含练习目标和来源描述。返回的 `usage` 用于估算费用。用输入和输出 Token 数分别乘以每百万 Token 的单价，求和后除以一百万。例如单价分别为 ¥1 和 ¥3，用量为 400 和 250 个 Token 时，费用约为 ¥0.00115。实际单价以模型和地域对应的价格为准。 [百炼价格表](https://help.aliyun.com/zh/model-studio/model-pricing)

## 每一步的验证方式

| 步骤 | 应观察到的结果 |
| --- | --- |
| 1. JSON 输出 | 文本请求的输出上限为 256，计划请求使用 JSON 模式和 1024 的输出上限 |
| 2. 系统指令 | 指令文件包含版本、任务、资料规则与 JSON 示例，具体评审目标来自 `reviewRequest` |
| 3. 计划校验 | 同一请求的合法计划通过，缺完成条件和使用越权来源的回复分别指出问题字段 |
| 4. CLI | `pnpm research:plan` 输出计划与指令版本，`usage` 为 `null` |

## 常见错误

| 现象 | 排查方式 |
| --- | --- |
| 请求体缺少 `response_format` | 检查计划调用是否传入 JSON 输出设置，以及模型适配器是否写入了对应字段 |
| `steps[0].doneWhen 应为非空字符串。` | 检查第一步是否给出能核对的完成条件 |
| `steps[0].sourceIds[0] 使用了未授权来源。` | 将该 ID 与应用给出的 `sources` 对照 |
| `研究计划达到模型输出上限。` | `finish_reason` 是 `length`。缩短计划或按任务需要调整输出上限 |

## 最终验收

补齐教程与站点入口后，运行本章门禁。

```text
git restore --source=chapter-04-end --worktree -- docs/tutorials/04-maintainable-system-prompt.md docs/tutorials/README.md docs/.vitepress/config.mts README.md ROADMAP.md
pnpm chapter:check -- 04
pnpm lint
pnpm typecheck
pnpm docs:check
pnpm docs:build
pnpm build
```

## 延伸练习

给评审目录添加一个指向项目 A 文档的 `a-docs` 条目。在同一个评审请求中验证，计划引用 `a-docs` 时可以通过，从目录中移除该条目后同一份计划会被拒绝。

## 相关解释与参考

- [Prompt 与上下文术语](../reference/glossary.md)
- [章节与代码检查点](../reference/chapter-map.md)
- [百炼结构化输出](https://help.aliyun.com/zh/model-studio/qwen-structured-output)
