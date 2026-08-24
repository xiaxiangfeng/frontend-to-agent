# 从前端应用走向 Agent 应用

## 本章目标

这一章不急着调用大模型。我们先把熟悉的前端开发心智模型迁移到 Agent 工程：分清聊天界面、Workflow 与 Agent，认识项目各层的职责，并跑通 Vue 3、Fastify 和共享包组成的学习基线。完成后，你会知道后续的 Prompt、Function Calling、RAG、Memory 与 Evaluation 分别应该进入哪一层，而不是把所有逻辑塞进聊天组件。

## 完成后的可见结果

你将得到三个可以直接观察的结果：

- 浏览器显示“AI 技术研究助手”和当前阶段说明；
- Fastify 的 `GET /health/live` 返回 `{ "status": "ok" }`；
- 仓库的 lint、类型检查、测试、文档检查与生产构建全部通过，且不产生模型费用。

当前阶段的系统边界如下：

```mermaid
flowchart LR
  User[用户] --> Web[Vue 3 研究工作台]
  Web --> API[Fastify API]
  API --> Core[research-core\n领域规则]
  Core --> Model[model-runtime\n模型适配]
  Core --> Tools[tool-runtime\n工具执行]
  Core --> Knowledge[knowledge-base\n检索与证据]
  Core --> State[persistence\n状态与检查点]
  Core -. 后续框架适配 .-> Graph[agent-langgraph]
  Core -. 质量反馈 .-> Evals[evals]
```

实线表示最终产品的主要调用方向，虚线表示后续章节才会接入的适配与评测能力。第 1 章只验证外壳和边界，不调用真实模型。

## 前置条件

- 熟悉 JavaScript、TypeScript、组件、HTTP 请求和 `package.json`；
- 安装 [已验证版本](../reference/versions.md) 中的 Node.js 24 与 pnpm 10；
- 已取得本仓库代码；
- 本章不需要 `DASHSCOPE_API_KEY`，费用为 **¥0**。

先确认环境：

```text
node --version
pnpm --version
```

本教程验证时使用 Node.js `24.13.0` 和 pnpm `10.13.1`。如果使用其他大版本，报错时先对齐版本再排查代码。

## 起始代码检查点

每一章都有可复现的 Git 起点。为避免污染自己的主分支，可以从本章起点创建练习分支：

```text
git switch -c learn/chapter-01 chapter-01-start
pnpm install --frozen-lockfile
```

如果分支名已经存在，换一个本地名称即可。安装完成后先运行：

```text
pnpm test
```

预期所有测试通过。若起点测试失败，应先解决环境差异，不要带着未知故障继续学习。

## 实现步骤

### 1. 把前端心智模型映射到 Agent 工程

前端应用通常是“事件触发确定的处理逻辑”。Agent 应用保留了这些工程基础，但把一部分下一步决策交给模型，并用代码约束模型可以看到什么、选择什么以及何时停止。

| 前端概念 | Agent 工程中的对应概念 | 仍由谁负责 |
| --- | --- | --- |
| 用户事件 | Goal / 任务输入 | 应用接收并校验 |
| 组件状态 | Run State / 运行状态 | 应用持有 |
| API Client | Model Runtime / 模型适配器 | 应用封装 |
| 可调用后端接口 | Tool / 工具 | 应用定义权限与 Schema |
| 路由与状态机 | Workflow / Agent Loop | 应用控制边界 |
| 缓存与持久化 | Memory / Checkpoint | 应用选择和恢复 |
| DevTools 与埋点 | Trace / Evaluation | 应用记录并评测 |
| 页面组件 | Vue 工作台 | 只负责交互与展示 |

这里最重要的分界是：**模型提出下一步行动，应用验证并执行行动**。模型输出不是可信命令，也不是业务事实。

### 2. 区分聊天框、Workflow 与 Agent

三者都可能使用大模型，但控制流不同：

- 聊天框：用户输入一次，模型回答一次；
- Workflow：开发者预先写好固定步骤，模型只完成其中某些节点；
- Agent：模型在受约束的循环中，根据目标与观察结果选择下一步行动，直到完成、失败或触发停止条件。

一个最小 Agent 循环可以先用伪代码理解：

```ts
while (!state.done && state.steps < state.maxSteps) {
  const decision = await model.decide(buildContext(state))
  const action = validateDecision(decision)
  const observation = await tools.execute(action)
  state = recordObservation(state, observation)
}
```

真正困难的部分并不是 `while`，而是上下文构建、结构校验、工具权限、停止条件、状态恢复、可观测性和评测。它们也是本书后续章节的主线。

### 3. 认识仓库边界

仓库使用 pnpm workspace：

```text
apps/
  api/                  Fastify 入口与 HTTP 边界
  web/                  Vue 3 用户界面
packages/
  research-core/        不依赖框架的领域规则
  model-runtime/        千问等模型的统一适配边界
  tool-runtime/         工具注册、校验、权限与执行
  knowledge-base/       文档处理、检索、证据与引用
  persistence/          SQLite、状态与检查点
  agent-langgraph/      后期 LangGraph 适配层
  evals/                离线评测与回归数据
```

这套边界遵循一个简单规则：Vue 组件和 Fastify 路由可以调用领域能力，领域规则不能反过来依赖 UI 或 Web 框架。这样我们可以先用原生 TypeScript 理解 Agent，再在后期接入 LangGraph，而不必重写产品核心。

### 4. 跑通 Fastify 健康检查

先构建 API：

```text
pnpm --filter @agent-book/api build
pnpm --filter @agent-book/api start
```

保持这个终端运行，在另一个 PowerShell 终端请求：

```text
Invoke-RestMethod http://127.0.0.1:3000/health/live
```

预期看到 `status` 为 `ok`。这个端点只证明进程能够启动并响应，不代表模型、数据库或向量库已经就绪。

### 5. 跑通 Vue 工作台

在新终端启动前端：

```text
pnpm --filter @agent-book/web dev
```

打开终端显示的本地地址，通常是 `http://localhost:5173`。页面应显示“AI 技术研究助手”。当前页面是 smoke app，它的职责是给后续能力提供可见载体，而不是假装已经完成了 Agent。

### 6. 理解本书的增量路线

接下来的能力按依赖关系逐层增加：

```mermaid
flowchart LR
  Model[模型调用] --> Prompt[Prompt 与 Context]
  Prompt --> Call[Function Calling]
  Call --> Loop[Agent Loop]
  Docs[文档处理] --> RAG[RAG 与引用]
  Loop --> State[State / Memory / Checkpoint]
  RAG --> State
  State --> HITL[Human-in-the-loop]
  HITL --> Eval[Trace / Evaluation / 安全 / 成本]
```

Prompt、Function Calling 和 RAG 很关键，但并不是全部。一个可交付的 Agent 还需要状态、记忆、工作流、工具治理、失败恢复、人工审批、可观测性、评测、安全和成本控制。

## 每一步的验证方式

| 步骤 | 验证方式 | 成功信号 |
| --- | --- | --- |
| 环境准备 | `node --version`、`pnpm --version` | 大版本分别为 24 与 10 |
| 安装依赖 | `pnpm install --frozen-lockfile` | lockfile 未被改写且命令退出码为 0 |
| 理解边界 | 找出 Vue、Fastify 与 `research-core` 的方向 | 领域包不依赖 UI 或 HTTP 框架 |
| API smoke | 请求 `/health/live` | 返回 `{ "status": "ok" }` |
| Web smoke | 打开 Vite 本地地址 | 显示“AI 技术研究助手” |
| 仓库门禁 | 运行下方五条验收命令 | 所有命令退出码为 0 |

如果只想快速确认本章结构和自动化门禁，可以运行：

```text
pnpm chapter:check -- 01
```

## 常见错误

### 把聊天框误当成 Agent

我们最初最容易画出的产品图只有“输入框 → 大模型 → 消息气泡”。它能聊天，但没有目标状态、工具协议、行动循环、停止条件、证据记录和失败恢复，因此不能证明系统具备 Agent 能力。

排查时不要先问“页面像不像 ChatGPT”，而要依次问：

1. 当前目标和运行状态保存在哪里？
2. 模型可以选择哪些行动，参数由什么 Schema 校验？
3. 工具结果如何作为 observation 回到下一步？
4. 什么条件会完成、暂停或终止运行？
5. 失败后能否定位到具体 step，并安全恢复？

本章的修正方式是先把领域、模型、工具、知识库、持久化和评测边界留出来。页面只展示状态，不承担 Agent 决策。

### 把健康检查当成完整就绪检查

`/health/live` 返回 `ok` 只代表进程存活。后续接入模型、SQLite 和 Qdrant 后，还需要区分 liveness 与 readiness，避免外部依赖故障时给出错误的可用性信号。

## 最终验收

停止本章手动启动的开发服务器，然后在仓库根目录依次执行：

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm docs:check
pnpm build
```

验收标准：

- 五条命令全部通过；
- API 健康检查返回 `ok`；
- Vue 页面显示项目标题；
- 没有配置或调用任何付费模型，实测成本为 **¥0**；
- 你能用自己的话解释聊天框、Workflow 和 Agent 的区别。

## 延伸练习

1. 画一张你熟悉的前端应用架构图，再标出如果加入 Agent，哪些边界需要新增。不要接模型。
2. 给 `/health/live` 增加一个测试用例，尝试解释为什么这里使用 Fastify `inject()` 比启动真实端口更稳定。
3. 在不改领域包的前提下替换 Vue 页面文案，体会“产品界面可以变化，核心规则不应被迫变化”的边界。

练习不要求新增依赖、API Key 或在线服务，也不应改变本章验收结果。

## 相关解释与参考

- [Agent、聊天与 Workflow 的边界](../explanations/agent-vs-workflow.md)
- [Agent 工程术语表](../reference/glossary.md)
- [章节与代码检查点映射](../reference/chapter-map.md)
- [已验证版本](../reference/versions.md)
- [编写并验收一章教程](../how-to/author-a-chapter.md)
