# 在本地启动应用与教程站

本指南说明如何启动 Vue、Fastify 和 VitePress。它假设你已安装版本参考中记录的 Node.js 与 pnpm。

## 安装依赖

在仓库根目录执行：

```text
pnpm install --frozen-lockfile
```

## 同时启动前端和 API

```text
pnpm dev
```

- Vue：`http://localhost:5173`
- Fastify：`http://127.0.0.1:3000`
- 健康检查：`http://127.0.0.1:3000/health/live`

按 `Ctrl+C` 停止两个应用。

## 单独启动一个应用

```text
pnpm dev:web
pnpm dev:api
```

这两条命令适合只调试界面或接口时使用。

## 启动教程站

```text
pnpm docs:dev
```

访问 `http://127.0.0.1:5174`。教程站独立运行，不会被 `pnpm dev` 自动启动。

## 构建教程站

```text
pnpm docs:build
pnpm docs:preview
```

构建产物位于 `docs/.vitepress/dist`，只用于本地验证，不提交到 Git。

## 常见启动失败

- 端口被占用：停止占用 3000、5173 或 5174 的进程后重试。
- 依赖与锁文件不一致：确认 Node.js 和 pnpm 版本后重新执行冻结安装。
- API 修改后没有通过类型检查：`tsx` 只负责快速运行，提交前仍必须执行 `pnpm typecheck`。
