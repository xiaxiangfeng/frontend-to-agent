# 主线教程

本目录存放二十二章学习主线。教程面向掌握 JavaScript/TypeScript、但几乎没有 AI 应用开发经验的前端开发者。

每章从一个可运行的起始检查点出发，通过连续的小步骤增加一项可观察能力。概念背景放在 `docs/explanations`，独立操作放在 `docs/how-to`，版本和 Schema 等事实放在 `docs/reference`。

1. [从前端应用走向 Agent 应用](./01-from-frontend-to-agent.md)
2. [用 TypeScript 调用千问 API](./02-call-qwen-with-typescript.md)
3. [保存会话，让 A 和 B 各自续聊](./03-persist-conversations.md)
4. [设计可维护的 System Prompt](./04-maintainable-system-prompt.md)

新章节必须从 [_chapter-template.md](./_chapter-template.md) 开始，并通过 `pnpm chapter:check -- <章节编号>` 验收。
