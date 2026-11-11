# 保存会话，让 A 和 B 各自续聊

## 本章目标

让 A 和 B 用同一个聊天服务，各自接着自己的话题聊。服务把每轮提问和回复存进 SQLite，重启后还能用原来的会话 ID 继续聊。

## 完成后的可见结果

在第 5 步的离线练习里，A 发「我在研究 Vue 响应式」，B 发「我在研究 Node 事件循环」。随后 A 回到原来的会话问「刚才我说了什么？」，会收到这句回复。

```text
上一条用户消息是「我在研究 Vue 响应式。」。
```

### A 追问时，服务怎么找回历史

| 请求里的信息 | 服务用它做什么 |
| --- | --- |
| A 的访问令牌 | 认出这次请求来自 A。 |
| 会话 ID（`conversationId`） | 找到 A 想继续聊的那段会话。 |
| 本轮问题（`content`） | 放在发给模型的消息末尾。 |

服务用 A 的身份和会话 ID 一起查 SQLite，读出这段会话的旧问答。和第 2 章的续聊实验一样，模型会在同一次请求里收到这段历史和新问题。

<details>
<summary>展开 A 追问时发给模拟模型的完整消息</summary>

```json
[
  { "role": "system", "content": "你是一位技术研究助手，请用简短中文回答。" },
  { "role": "user", "content": "我在研究 Vue 响应式。" },
  { "role": "assistant", "content": "已收到，这是本会话的第一条消息。" },
  { "role": "user", "content": "刚才我说了什么？" }
]
```

</details>

B 用自己的令牌读或续接 A 的会话，接口会返回 `404`。重启服务后，B 带上自己的令牌和原来的会话 ID 追问，回复仍会提到 Node 事件循环。

## 前置条件

- 使用 Node.js 24 和 pnpm 11，完成[第 2 章](./02-call-qwen-with-typescript.md)。
- 本章用 Node.js 自带的 `node:sqlite` 打开本地数据库。默认模型使用固定规则读取本次输入，练习费用为 ¥0。[Node.js 24 SQLite 文档](https://github.com/nodejs/node/blob/v24.13.0/doc/api/sqlite.md)

## 起始代码检查点

保留当前教程页面，在仓库根目录切到本章起点。

```text
git switch -c learn/chapter-03 chapter-03-start
pnpm install --frozen-lockfile
pnpm test
```

先取本章会话测试并运行。

```text
git restore --source=chapter-03-end --worktree -- apps/api/test/conversations.test.ts
pnpm exec vitest run apps/api/test/conversations.test.ts
```

此时会出现 `openConversationStore is not a function`，因为起点的持久层还只有包名。后续步骤会让这批测试依次具备需要的模块。

## 实现步骤

### 1. 连上工作区里的模型、会话和持久层

`apps/api` 引入 `model-runtime`、`research-core` 和 `persistence`。模型包继续处理模型协议，核心包定义会话处理规则，持久包实现 SQLite 读写。

```text
git restore --source=chapter-03-end --worktree -- apps/api/package.json packages/model-runtime/package.json packages/research-core/package.json packages/persistence/package.json pnpm-lock.yaml tests/repository/development-commands.test.ts tests/repository/package-shells.test.ts
pnpm install --frozen-lockfile
```

这几个包的入口用 `types` 为 TypeScript 提供源码类型，开发态用 `development` 读取源码，默认入口读取 `dist/index.js`。因此开发命令带上 `--conditions=development`。运行构建产物前，执行根目录的 `pnpm build` 来构建各个工作区包。

### 2. 定义会话和一次回复

`ConversationOwner` 包含 `tenantId` 与 `userId`，会话 ID 由服务端生成。一次回复先按这三项读取会话，创建新的 `messages` 数组，按顺序放入系统指令、该会话历史和用户新问题。

模型客户端和数据库连接可以在服务启动时创建一次。每次生成回复时，服务单独查这段会话的历史，再组装 `messages`。

```text
git restore --source=chapter-03-end --worktree -- packages/research-core/src/index.ts
```

<<< ../../packages/research-core/src/index.ts

模型失败时返回失败结果。成功后，核心层携带读取时的版本写入这一轮。到这里还只约定了存储接口，接下来用数据库实现。

### 3. 用 SQLite 保存完整的一轮

`conversations` 保存会话 ID 和归属，`conversation_turns` 的每行保存一条用户消息和一条助手回复。查询同时匹配租户、用户与会话 ID，再按轮次还原 `user` 和 `assistant` 消息。

```text
git restore --source=chapter-03-end --worktree -- packages/persistence/src/index.ts
```

<<< ../../packages/persistence/src/index.ts

版本就是会话已保存的问答轮数。如果 A 已聊了 1 轮，两条请求可能同时读到这 1 轮历史。先保存成功的请求把轮数推进到 2。另一条请求保存时发现轮数已经变化，接口返回 `409`。

写入语句会同时核对会话归属和轮数，一次保存本轮提问与回复。`(conversation_id, turn_index)` 主键保证每个会话的同一轮只存一条问答记录。

### 4. 在 Fastify 验证身份并挂载会话路由

发送消息时，请求头 `Authorization` 带令牌，URL 带会话 ID，请求体带本轮 `content`。服务端从令牌查到 `tenantId` 和 `userId`，用这两个 ID 和会话 ID 查询历史、保存新一轮问答。

```text
git restore --source=chapter-03-end --worktree -- apps/api/src/app.ts apps/api/src/conversations.ts apps/api/src/chat-config.ts apps/api/src/server.ts .env.example tests/repository/workspace.test.mjs
pnpm exec vitest run apps/api/test/conversations.test.ts
```

| 请求 | 成功结果 |
| --- | --- |
| `POST /conversations` | HTTP 201 和新的 `conversationId` |
| `GET /conversations/:conversationId` | 当前版本和已保存的消息 |
| `POST /conversations/:conversationId/messages` | 助手回复、耗时和模型用量 |

Fastify 负责请求校验和 HTTP 状态。会话归属和本轮写入由核心层与数据库检查。生产应用可以把演示令牌映射换成登录认证，再使用相同的会话接口。

### 5. 在同一服务里让 A 和 B 交替请求

在仓库根目录的本地 `.env` 增加这些配置。两条令牌用于本地练习，分别映射到两个租户的用户。

```dotenv
CHAT_DEMO_TOKEN_A=local-chapter-a
CHAT_DEMO_TOKEN_B=local-chapter-b
CHAT_MODEL_MODE=fixture
DATABASE_URL=file:./data/research.sqlite
```

在终端一执行 `pnpm dev:api`。会话启用时默认监听 `127.0.0.1:3000`。如果已有 `HOST` 或 `PORT` 配置，以本地实际地址为准。

在终端二运行 `node`，在 REPL 里定义两个请求函数。

```js
const base = 'http://127.0.0.1:3000'
const a = { authorization: 'Bearer local-chapter-a' }
const b = { authorization: 'Bearer local-chapter-b' }

async function create (headers) {
  const response = await fetch(base + '/conversations', { method: 'POST', headers })
  return response.json()
}

async function send (headers, id, content) {
  const response = await fetch(base + '/conversations/' + id + '/messages', {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ content })
  })
  return response.json()
}
```

先创建两段会话，再让 A 和 B 各发一条消息。

```js
const aId = (await create(a)).conversationId
const bId = (await create(b)).conversationId
await send(a, aId, '我在研究 Vue 响应式。')
await send(b, bId, '我在研究 Node 事件循环。')
console.log((await send(a, aId, '刚才我说了什么？')).message.content)
console.log((await fetch(base + '/conversations/' + aId, { headers: b })).status)
```

第一条输出包含「我在研究 Vue 响应式。」，第二条输出 `404`。模拟模型按本次收到的 `messages` 找上一条用户消息，可以用它观察上下文是否选对。

保留终端二里的 `aId` 和 `bId`。在终端一按 Ctrl+C 后重新执行 `pnpm dev:api`，然后在终端二续接 B 的会话。

```js
console.log((await send(b, bId, '刚才我说了什么？')).message.content)
```

重启后的回复包含「我在研究 Node 事件循环。」。这条消息来自同一个 SQLite 文件。

想接入真实千问时，先按[第 2 章的在线配置](./02-call-qwen-with-typescript.md)填写百炼环境变量，再把 `CHAT_MODEL_MODE` 改为 `qwen` 并重启。每次发送消息可能产生一次模型费用，响应里的 `usage` 提供服务返回的用量。本章把该会话的已保存历史加入请求，后续会用上下文预算来选择和压缩消息。

## 每一步的验证方式

| 步骤 | 验证方式 |
| --- | --- |
| 链接工作区包 | 冻结安装成功，`pnpm typecheck` 能解析包类型 |
| 加载会话 | 自动化测试比较 A、B 和 A 的第二段会话发给模型的消息 |
| 持久化 | 测试关闭应用并重新打开同一个数据库文件，继续原会话 |
| 拒绝越权 | 无有效令牌返回 401，访问不属于自己的会话返回 404 |
| 处理失败和并发 | 模型失败返回 502，重复轮次返回 409，数据库保留完整问答 |
| 重启实验 | 按上面的 REPL 步骤重新启动进程，B 仍能续聊 |

## 常见错误

**带 B 的令牌请求 A 的会话时收到 404。** 这个结果在测试和重启实验中都可以复现。后端只查询当前身份有权访问的会话，使用 A 的身份和会话 ID 才能读取 A 的消息。

**两个同会话请求中一个返回 409。** 这意味着另一条请求已经推进了轮次。读取最新历史后再决定是否重新发送。

**会话路径全部返回 404。** 如果两个演示令牌都为空，服务只启动基础路由。检查根目录 `.env` 是否设置了两条不同的令牌，并重启 API。

## 最终验收

从起点练习的读者先把本章文档放到当前检出。

```text
git restore --source=chapter-03-end --worktree -- docs/tutorials/03-persist-conversations.md
pnpm chapter:check -- 03
pnpm lint
pnpm typecheck
pnpm docs:check
pnpm docs:build
pnpm build
```

确认模拟模式下 A、B 的追问分别取得自己的历史。再重启服务，用原会话 ID 完成下一轮。成品对应 `chapter-03-end`。

## 延伸练习

用 A 的令牌创建第二段会话。先给两段会话各发一条不同的消息，再在两段会话里问「刚才我说了什么？」。对照返回内容和 GET 接口的数据，看看同一个用户如何用不同的会话 ID 隔开话题。

## 相关解释与参考

- [用 TypeScript 调用千问 API](./02-call-qwen-with-typescript.md)
- [Agent 工程术语表](../reference/glossary.md)
- [Node.js 24 SQLite 文档](https://github.com/nodejs/node/blob/v24.13.0/doc/api/sqlite.md)
