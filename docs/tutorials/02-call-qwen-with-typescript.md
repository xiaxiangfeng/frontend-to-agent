# 用 TypeScript 调用千问 API

## 本章目标

用 TypeScript 把一个问题发给模型，在终端看到回复、耗时和 Token 用量。再用 Vue 响应式做例子，看看同一句追问带上上一轮问答后，会得到什么回复。

## 完成后的可见结果

```text
pnpm model:ask "用一句话解释 Vue 响应式"
pnpm model:ask --compare
```

第一条命令会显示一条模拟回复、耗时和示例 Token 用量。默认练习在本地模拟千问响应，费用为 ¥0。

第二条命令先发送「我的研究主题是 Vue 响应式。」，接着把同一句「刚才的研究主题是什么？」发两次。

| 追问 | 发给模型的 `messages` | 终端里的模拟回复 |
| --- | --- | --- |
| A | 系统指令和本轮追问 | 这次请求没有提供研究主题。 |
| B | 系统指令、上一轮的用户消息和助手回复、本轮追问 | 刚才的研究主题是 Vue 响应式。 |

两次追问使用同一个模型客户端。程序给 B 组的 `messages` 加上了上一轮的两条消息，模拟模型就能从这次收到的内容里找到研究主题。

<details>
<summary>展开两次追问实际发出的消息</summary>

**追问 A**

```json
[
  {"role": "system", "content": "你是一位技术研究助手，请用简短中文回答。"},
  {"role": "user", "content": "刚才的研究主题是什么？"}
]
```

**追问 B**

```json
[
  {"role": "system", "content": "你是一位技术研究助手，请用简短中文回答。"},
  {"role": "user", "content": "我的研究主题是 Vue 响应式。"},
  {"role": "assistant", "content": "收到，研究主题是 Vue 响应式。"},
  {"role": "user", "content": "刚才的研究主题是什么？"}
]
```

</details>

## 前置条件

- 完成[第 1 章](./01-from-frontend-to-agent.md)，使用仓库约定的 Node.js 24 和 pnpm 11。
- 如果要调用真实模型，在百炼控制台准备同一地域和业务空间的 API Key、兼容 Chat 基础地址，以及已开通的千问文本模型。模型需要支持关闭思考模式和 `max_completion_tokens`。参考[百炼兼容 Chat 接口](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)。

## 起始代码检查点

保留本章页面，在仓库根目录创建练习分支。

```text
git switch -c learn/chapter-02 chapter-02-start
pnpm install --frozen-lockfile
pnpm test
```

用本章已有的用例观察失败，再逐步补上实现。

```text
git restore --source=chapter-02-end --worktree -- packages/model-runtime/test
pnpm exec vitest run packages/model-runtime/test
```

起点的 `model-runtime` 只有包名，测试会找不到模型调用函数和 CLI。完成下面两步后重跑。

## 实现步骤

### 1. 把一次模型调用封装到 model-runtime

这次调用是一个 HTTP POST。Node 从配置取得基础地址，拼接 `/chat/completions`，再把 API Key 放进请求头。请求体里的 `model` 选择模型，`messages` 按顺序列出本次提交的消息。

| 角色 | 在本章中的用途 |
| --- | --- |
| `system` | 指定技术研究助手的职责和回答语言 |
| `user` | 提供用户问题或用户之前发过的消息 |
| `assistant` | 把上一轮模型回复带到新的请求 |

```text
git restore --source=chapter-02-end --worktree -- packages/model-runtime/src/index.ts
```

`complete(messages)` 返回应用可以直接使用的结果。它从 `choices[0].message.content` 取文本，从 `usage` 读输入、输出和总 Token 数。服务没有给出可用用量时，返回 `null`。调用为非流式，收到完整回复后才返回。

### 2. 用命令行运行一次调用

`cli.ts` 读取命令行的问题，组装成 `messages`，调用模型并打印结果。默认的 `simulateFetch` 在本地返回一份兼容 Chat 格式的响应，仍然走步骤 1 的请求组装和解析。

```text
git restore --source=chapter-02-end --worktree -- packages/model-runtime/src/cli.ts packages/model-runtime/tsconfig.json package.json .env.example tests/repository/workspace.test.mjs
```

根目录的 `model:ask` 命令运行 `node packages/model-runtime/src/cli.ts`。CLI 用 Node.js 24 直接运行 TypeScript，导入写成 `./index.ts`。构建时，`rewriteRelativeImportExtensions` 会把该导入改成 `./index.js`。在线练习使用的 `DASHSCOPE_BASE_URL` 已放进 `.env.example`。

### 3. 对照带历史和只带追问的请求

执行 `pnpm model:ask --compare`，在终端找到 A 和 B 各自的 `messages`。程序把第一轮回复存进 `firstReply`。组装 B 时，程序把原研究主题作为 `user` 消息，把 `firstReply` 作为 `assistant` 消息，再把本轮追问放在最后。

第 3 章会把每轮问答存起来，下一次按会话 ID 找回并加入请求。对话变长后，后续章节会从历史里选出本轮需要的消息。

### 4. 可选练习，接入真实千问

在本地 `.env` 填写以下三项。基础地址从百炼控制台复制，末尾为 `/compatible-mode/v1`。华北 2（北京）的业务空间地址形如 `https://你的业务空间ID.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`。密钥只保存在本地环境里。

| 变量 | 值 |
| --- | --- |
| `DASHSCOPE_API_KEY` | 百炼业务空间的 API Key |
| `DASHSCOPE_BASE_URL` | 同一业务空间的兼容 Chat 基础地址 |
| `QWEN_MODEL` | 已开通的模型 ID，例如 `qwen3.8-flash` |

```text
pnpm model:ask --live "用一句话解释 Vue 响应式"
```

加上 `--live` 才会发送在线请求。单个问题会调用一次模型，`--live --compare` 会调用三次。代码把输出上限设为 256 Token，并给单次请求设置 30 秒超时。

以华北 2（北京）`qwen3.8-flash` 的按量价举例，输入和输出每百万 Token 分别为 ¥0.8 和 ¥2.7。若一次调用用了 200 个输入 Token、100 个输出 Token，费用约为 `(200 × 0.8 + 100 × 2.7) / 1_000_000 = ¥0.00043`。按控制台价格和每次实际用量核算。[百炼价格表](https://help.aliyun.com/zh/model-studio/model-pricing)

## 每一步的验证方式

| 步骤 | 执行 | 观察 |
| --- | --- | --- |
| 模型适配 | `pnpm exec vitest run packages/model-runtime/test/qwen.test.ts` | 请求带上指定消息，响应可以读出文本和 Token，HTTP 401 返回可定位的错误 |
| 单轮 CLI | `pnpm model:ask "用一句话解释 Vue 响应式"` | 终端显示模拟模式、回复、耗时和模拟用量 |
| 多轮对照 | `pnpm model:ask --compare` | 两组最后一条用户消息相同，B 组保留前一轮的用户消息和助手回复 |
| 在线练习 | `pnpm model:ask --live "用一句话解释 Vue 响应式"` | 配置正确时显示在线模式和服务返回的回复与用量 |

## 常见错误

在未配置在线调用的环境运行 `pnpm model:ask --live "你好"`，程序会以退出码 1 结束，并提示「请设置 DASHSCOPE_API_KEY、DASHSCOPE_BASE_URL 和 QWEN_MODEL。」这说明调用在配置检查处结束。按上面的表补齐配置再运行。

如果提示「百炼请求失败（HTTP 401）。」，先检查 API Key 是否有效，以及 Key 和基础地址是否来自同一地域。适配层保留 HTTP 状态供排查，日志里可以用状态码定位到鉴权环节。

## 最终验收

从起点练习的读者先把本章文档放入当前检出，再运行门禁。

```text
git restore --source=chapter-02-end --worktree -- docs/tutorials/02-call-qwen-with-typescript.md
pnpm chapter:check -- 02
pnpm lint
pnpm typecheck
pnpm docs:check
pnpm docs:build
pnpm build
```

检查默认测试能在空白密钥环境通过。再运行多轮对照，确认程序把第一轮返回的回复放进 B 组的 `assistant` 消息。对照成品的 Git 检查点是 `chapter-02-end`。

## 延伸练习

把追问 B 的 `assistant` 消息改成与本轮主题无关的内容。在线模式下观察模型如何处理冲突，并记录请求数组和实际回复。

## 相关解释与参考

- [Agent、聊天与 Workflow 的边界](../explanations/agent-vs-workflow.md)
- [术语表中的 Context](../reference/glossary.md#context)
- [百炼 OpenAI 兼容 Chat 接口](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)
- [千问 3.8 Flash 模型说明](https://help.aliyun.com/zh/model-studio/qwen3-8-flash)
