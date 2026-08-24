# 前端转 Agent：从 Vue 开发者到 Agent 工程师

面向前端开发者的中文 Agent 工程实战教程。使用 TypeScript、Vue 3 与 Fastify，边学习 Agent 核心能力，边完成一个可验证的 AI 技术研究助手。

> **持续更新中：** 当前已完成工程基线、第 1 章、Vue 与 Fastify 启动链路，以及基于 VitePress 的本地教程站。Prompt、Tool Calling、RAG、Memory、Workflow 和 Evaluation 将按路线图逐步实现，不把规划中的能力描述成已完成功能。

## 适合谁

- 熟悉 JavaScript、TypeScript、Vue、组件、HTTP 请求和 `package.json` 的前端开发者。
- 想从“会调用大模型 API”走向“能交付 Agent 系统”的工程师。
- 希望理解原生 Agent Loop 后，再学习 LangGraph 等框架的读者。

## 你会学到什么

本项目按依赖关系覆盖：

```text
模型调用 → Prompt / Context → Tool Calling → MCP
        → RAG / Memory → Workflow / Agent Loop
        → Checkpoint / Human-in-the-loop
        → Trace / Evaluation / 安全 / 成本 / 部署
```

我们不会把 Agent 简化成聊天框。教程会持续补齐状态、停止条件、工具权限、失败恢复、人工审批、可观测性和评测。

## 当前进度

- [x] pnpm monorepo、TypeScript、ESLint、Vitest 工程基线
- [x] Vue 3 工作台与 Fastify 健康检查
- [x] 第 1 章：从前端应用走向 Agent 应用
- [x] VitePress 2 本地教程站
- [ ] 模型运行时、Prompt 与 Context Engineering
- [ ] Function Calling、工具治理与 MCP
- [ ] RAG、知识库与 Memory
- [ ] Workflow、Checkpoint 与 Human-in-the-loop
- [ ] Vue 研究助手产品与 LangGraph 重构
- [ ] Evaluation、安全、成本和部署

完整阶段安排见 [ROADMAP.md](./ROADMAP.md)。

## 技术栈

- Node.js 24、TypeScript 5.9、pnpm 10
- Vue 3、Vite 8
- Fastify
- Vitest、ESLint
- VitePress 2

具体版本见 [已验证版本](./docs/reference/versions.md)。

## 三分钟启动

安装依赖：

```text
pnpm install --frozen-lockfile
```

同时启动 Vue 与 Fastify：

```text
pnpm dev
```

- Vue：`http://localhost:5173`
- Fastify：`http://127.0.0.1:3000`
- 健康检查：`http://127.0.0.1:3000/health/live`

单独启动某个应用：

```text
pnpm dev:web
pnpm dev:api
```

启动教程站：

```text
pnpm docs:dev
```

访问 `http://127.0.0.1:5174`。更多说明见 [本地启动指南](./docs/how-to/run-project-locally.md)。

## 从哪里开始

1. 阅读 [第 1 章：从前端应用走向 Agent 应用](./docs/tutorials/01-from-frontend-to-agent.md)。
2. 使用 `chapter-01-start` 创建练习分支，按教程完成代码。
3. 使用 `pnpm chapter:check -- 01` 验收章节结构与项目门禁。
4. 遇到概念问题时查阅 [原理解释](./docs/explanations/README.md) 和 [参考资料](./docs/reference/README.md)。

## 仓库结构

```text
apps/
  web/                 Vue 工作台
  api/                 Fastify HTTP 边界
packages/
  research-core/       Agent 领域模型与稳定接口
  model-runtime/       模型适配层
  tool-runtime/        工具与 MCP
  knowledge-base/      RAG 与知识库
  persistence/         状态、记忆与检查点
  agent-langgraph/     后期 LangGraph 适配
  evals/               离线评测与回归
docs/                  教程、指南、解释和参考资料
```

## API Key 与费用

第 1 章不需要 API Key，也不会产生模型费用。后续真实模型调用只在显式开启的 live test 或开发命令中执行。

- 不要提交 `.env`、API Key、访问令牌或私有文档。
- 默认测试使用 fixture，不应产生模型费用。
- 每个需要在线模型的章节都会说明环境变量、调用方式和估算成本。

## 参与贡献

提交前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，并运行：

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm docs:check
pnpm docs:build
pnpm build
```

## 许可证

- 源代码和文档中的代码示例采用 [MIT License](./LICENSE)。
- 教程正文、解释文字、图表和其他非代码内容采用 [CC BY-NC-SA 4.0](./LICENSE-DOCS.md)，要求署名、禁止商业使用，并以相同方式共享演绎内容。

未经版权人另行书面授权，不得把教程内容包装为付费课程、付费专栏或商业出版物。
