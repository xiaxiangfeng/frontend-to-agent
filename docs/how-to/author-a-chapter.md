# 编写并验收一章教程

本指南说明如何从上一章的可运行结果开始，完成一章主线教程并固化 Git 检查点。

## 前置条件

- 工作区没有未提交修改。
- 上一章的最终门禁全部通过。
- 已在 [章节映射](../reference/chapter-map.md) 中确认章节编号、标题和 tag 名称。

## 操作步骤

1. 在当前通过测试的提交创建 `chapter-xx-start` tag。
2. 以 [章节模板](../tutorials/_chapter-template.md) 创建 `docs/tutorials/xx-kebab-case-title.md`。
3. 按“实验、失败、正式实现、验证、写作”的顺序完成章节；每一步保留可观察结果。
4. 执行 `pnpm chapter:check -- xx`，修正章节结构或项目测试错误。
5. 执行 `pnpm lint`、`pnpm typecheck`、`pnpm docs:check` 和 `pnpm build`。
6. 从新的临时检出中回到 start tag，严格按教程重走全部步骤。
7. 提交章节和代码，再创建 `chapter-xx-end` tag。

## 预期结果

- start tag 能运行上一章最终结果。
- end tag 通过本章全部自动化验收。
- 教程不依赖作者机器的隐藏配置，不包含密钥，并记录真实失败与模型成本。
