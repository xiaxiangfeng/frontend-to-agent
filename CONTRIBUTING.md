# 贡献指南

## 开发环境

1. 安装 [版本参考](./docs/reference/versions.md) 中记录的 Node.js 和 pnpm。
2. 执行 `pnpm install --frozen-lockfile`。
3. 执行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm docs:check` 和 `pnpm build`，确认起点干净。

## 开发循环

- 行为修改先写失败测试，确认失败原因正确后再写最小实现。
- 一次提交只完成一个可验证目标，不混入无关格式化或重构。
- Agent 领域规则放在 packages，不进入 Fastify handler、Vue component 或 composable。
- 新依赖使用精确版本，并同步更新 lockfile 与版本参考页。

## 编写章节

按 [编写并验收一章教程](./docs/how-to/author-a-chapter.md) 执行。每章必须有 `chapter-xx-start` 与 `chapter-xx-end` tag，并能从 start tag 独立复走。

## 密钥与费用

- `.env`、API Key、访问令牌和私有文档不得提交。
- 默认测试只使用 fixture，不得产生模型费用。
- 真实模型调用只在显式 live test 开关下运行，并在章节中记录估算成本。

## 提交前门禁

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm docs:check
pnpm build
```
