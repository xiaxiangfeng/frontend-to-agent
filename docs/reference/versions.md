# 已验证版本

本页记录教程代码实际验证过的运行环境。依赖升级必须同时更新 `pnpm-lock.yaml`、`.env.example` 和本页，并重新执行对应章节验收。

## 基础环境

| 项目 | 已验证值 | 验证日期 |
| --- | --- | --- |
| Node.js | 24.13.0 | 2026-08-24 |
| Node.js | 24.20.0 | 2026-11-09 |
| pnpm | 11.25.0 | 2026-11-09 |
| 操作系统 | Windows，开发环境 | 2026-08-24 |
| 操作系统 | macOS，开发环境 | 2026-11-09 |

## 依赖版本

所有 JavaScript 依赖使用精确版本并由 `pnpm-lock.yaml` 固化。每引入一个应用或包，都必须在本节补充经过测试的直接依赖版本。

| 直接依赖 | 已验证版本 | 说明 |
| --- | --- | --- |
| TypeScript | 5.9.3 | 与当前 typescript-eslint peer 范围兼容 |
| Vitest | 4.1.11 | 使用 `test.projects`，不使用已移除的 `test.workspace` |
| ESLint | 9.39.5 | flat config |
| neostandard | 0.13.0 | TypeScript 与无 JSX 配置 |
| `@types/node` | 24.13.3 | 对齐 Node 24 |
| Fastify | 5.12.1 | API 应用 |
| tsx | 4.23.12 | Fastify TypeScript 开发态热更新 |
| VitePress | 2.0.0-alpha.19 | 本地教程站与静态文档构建；精确锁定以控制预发布升级 |
| Vue | 3.5.41 | Composition API 与 script setup |
| Vite | 8.2.2 | Vue 构建与 Vitest 运行时 |
| `@vitejs/plugin-vue` | 6.0.8 | Vue SFC 转换 |
| `@vue/compiler-sfc` | 3.5.41 | 与 Vue 版本一致 |
| `@vue/test-utils` | 2.4.11 | Vue 组件测试 |
| happy-dom | 20.11.6 | Vue 测试 DOM 环境 |
| vue-tsc | 3.3.11 | Vue SFC 类型检查 |


## 模型与接口

阶段 01 不调用付费模型。模型 ID、百炼接口兼容参数和 Embedding 维度只在相应在线烟雾测试通过后记录，不能根据记忆猜测。

## 环境变量

| 变量 | 用途 | 是否敏感 |
| --- | --- | --- |
| `DASHSCOPE_API_KEY` | 服务端调用阿里云百炼 | 是 |
| `APP_ACCESS_TOKEN` | 保护实时研究模式 | 是 |
| `QWEN_MODEL` | 文本生成模型 ID | 否 |
| `QWEN_EMBEDDING_MODEL` | Embedding 模型 ID | 否 |
| `DATABASE_URL` | SQLite 连接位置 | 否 |
| `QDRANT_URL` | Qdrant 服务地址 | 否 |
| `RUN_LIVE_TESTS` | 显式允许付费在线测试 | 否 |
