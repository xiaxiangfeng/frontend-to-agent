# 组织、选择和压缩上下文

## 本章目标

第 4 章的计划要比较项目 A 和 B 的文档导入与引用方式。本章先处理其中一个问题「两个项目分别支持导入哪些文件？」。应用把这个问题、两份 README 的导入段落和本轮用得上的工具说明放到 `messages` 里。这些随请求交给模型看的内容，就是这一轮的上下文。

## 完成后的可见结果

在仓库根目录运行 `pnpm research:context`。终端会对每道题显示两种输入的大小，并说明每项内容为什么保留、换成摘要或跳过。

| 本轮问题 | 保留的 README 段落 | 全量消息 | 按需组装 |
| --- | --- | ---: | ---: |
| 项目 A 和 B 分别支持导入哪些文件？ | A 的「文档导入」和 B 的「添加资料」 | 2405 字节 | 1182 字节 |
| 项目 A 和 B 怎么在回答里标明资料出处？ | A 的「引用」和 B 的「来源」 | 2411 字节 | 1192 字节 |

拿第一题来说，A 的导入段落列出 Markdown 和 PDF，B 的导入段落列出 Markdown 和纯文本。这两段都保留。工具说明里带上读段落和查文件格式的说明，跳过查引用示例的说明。旧研究笔记太长，就用一句话提醒模型给每条结论记下出处。

这里的项目、README 段落和工具说明都是离线练习数据。命令组装消息并显示结果，练习费用为 ¥0。字节数来自 `messages` 序列化后的 UTF-8 大小，方便比较两份输入。实际调用的 Token 用量以模型服务返回的数据为准。

<details>
<summary>展开第一题组装出的两条消息</summary>

执行 `pnpm research:context --messages` 可以看到全量和按需组装的 `messages`。第一题按需组装的 `system` 内容如下。

```text
你是技术研究助手。根据提供的资料回答当前问题，标明出处。
```

`user` 消息的 `content` 是一个 JSON 字符串，这里按缩进展示。

```json
{
  "goal": "对比两个开源文档问答项目 A 和 B 的文档导入与证据引用方式，给出有出处的借鉴建议。",
  "question": "项目 A 和 B 分别支持导入哪些文件？",
  "context": [
    {
      "id": "read-document",
      "kind": "tool",
      "text": "read_document(sourceId, heading) 读取指定 README 的段落。"
    },
    {
      "id": "list-import-formats",
      "kind": "tool",
      "text": "list_import_formats(sourceId) 从指定 README 的导入说明提取文件格式。"
    },
    {
      "id": "a-import",
      "kind": "evidence",
      "text": "a-readme / 文档导入：支持上传 Markdown 和 PDF 文件。"
    },
    {
      "id": "b-import",
      "kind": "evidence",
      "text": "b-readme / 添加资料：支持导入 Markdown 和纯文本。"
    },
    {
      "id": "review-scope",
      "kind": "history",
      "text": "这次评审以两份 README 为依据。资料没有说明的地方标为待核实。"
    },
    {
      "id": "review-notes",
      "kind": "history",
      "text": "按维度对照，每条结论记录 README 段落标题。资料没说明的地方标为待核实。"
    }
  ]
}
```

</details>

## 前置条件

- 使用 Node.js 24 和 pnpm 11，了解上一章的评审目标和资料 ID。 [第 4 章](./04-maintainable-system-prompt.md)
- 练习使用固定资料，装好项目依赖即可运行。

## 起始代码检查点

从本章起点创建练习分支，先运行上一章的计划命令和测试。

```sh
git switch -c learn/chapter-05 chapter-05-start
pnpm install --frozen-lockfile
pnpm research:plan
pnpm test
```

取出本章测试，观察起点缺少的功能。

```sh
git restore --source=chapter-05-end --worktree -- packages/research-core/test/context-builder.test.ts
pnpm exec vitest run packages/research-core/test/context-builder.test.ts
```

测试会报告 `Cannot find module '../src/context-builder.ts'`。接下来加上组装消息和选择资料的逻辑。

## 实现步骤

### 1. 先决定这道题需要什么

应用给候选内容写上主题标签。文件格式题用 `import`，引用题用 `citation`。练习里的 `requiredIds` 是应用事先为每道题列出的必需项。文件格式题要同时有 A 和 B 的导入段落，还要带上读取段落与查文件格式的说明。主题标签用来筛选其余候选项。换到引用题，应用传入另一份必需清单和主题。

```sh
git restore --source=chapter-05-end --worktree -- packages/research-core/src/context-fixture.ts
```

打开 `context-fixture.ts`，对照两道题的 `requiredIds` 和每条资料的 `topics`。以后接入检索时，可以把查到的段落作为候选内容交给这一步。

### 2. 把必需项放进消息，再用预算筛选其余内容

`assembleContext` 把评审目标、本轮问题和选中的内容放进 `user` 消息，再计算两条消息序列化后的大小。全量和按需组装走同一个函数，可以直接比较大小。

`buildContext` 先放入必需项，再看其他条目的主题是否相关。相关条目的原文能放下，就保留原文。相关的旧研究记录放不下时，尝试用已写好的摘要替换，摘要也放不下就跳过。必需项缺失或超出预算时，程序报错，方便调用方调整输入。

```sh
git restore --source=chapter-05-end --worktree -- packages/research-core/src/context-builder.ts
pnpm exec vitest run packages/research-core/test/context-builder.test.ts -t 'keeps required inputs|cannot fit|missing required evidence'
```

旧笔记的摘要提前写在 `summary` 里。程序在本轮组装时选择它，原文仍可供回看。后续做会话上下文时也可以用同样的办法，先带上这轮需要的消息，再决定是否用摘要代替较长的历史。

### 3. 对照全量和按需组装

命令为每道题各组装一份全量消息和一份按需选择的消息。默认输入预算是 1300 字节，只对按需组装生效。`decisions` 记录每项结果。比如导入题的 `a-import` 是 `included / required`，`a-citation` 是 `skipped / unrelated`，`review-notes` 是 `summarized / budget`。

```sh
git restore --source=chapter-05-end --worktree -- packages/research-core/src/context-cli.ts package.json tests/repository/workspace.test.mjs
pnpm research:context
pnpm research:context --messages
```

工具说明在这里是消息里的文本。到第 7 章，程序会把可调用工具的定义交给模型，收到调用请求后再执行。第 6 章先接模型的流式回复，并处理请求失败和输出预算。

## 每一步的验证方式

| 步骤 | 应观察到的结果 |
| --- | --- |
| 1. 核对候选项 | 两道题都指定了两份 README 的相关段落和本题需要的工具说明。 |
| 2. 核对预算 | 相关长笔记可以用摘要保留。必需内容放不下时，测试会捕获错误。 |
| 3. 对照输入 | 两道题的按需消息都更小。打开 `--messages` 可以核对保留的证据和工具说明。 |

## 常见错误

试着执行 `pnpm research:context --max-input-bytes 300`。输入预算小于第一题的必需内容，命令会报错并以退出码 `1` 结束。

```text
必需上下文超出输入预算（需要 873 字节，上限 300 字节）。
```

查看报错里的需要量和上限。如果必需内容确实要带上，可以提高预算。也可以把当前问题缩小到一个更具体的比较项，再重新确定要带的资料。

## 最终验收

补齐本章教程与站点入口，运行验收命令。

```sh
git restore --source=chapter-05-end --worktree -- docs/tutorials/05-build-context.md docs/tutorials/README.md docs/.vitepress/config.mts README.md ROADMAP.md
pnpm chapter:check -- 05
pnpm lint
pnpm typecheck
pnpm docs:check
pnpm docs:build
pnpm build
```

用 `pnpm research:context --messages` 核对两道题都保留了必要的工具说明和 A、B 的原文段落。再看 `decisions`，找到一条因主题不相关被跳过的内容，以及一条因预算改用摘要的记录。

## 延伸练习

把预算从 1300 字节调到 1100 字节，观察哪些内容还会留下。两份 README 的必需段落仍然保留，长笔记的摘要会因剩余空间不足而跳过。可以用 `--messages` 核对。

## 相关解释与参考

- [第 3 章如何取出会话历史](./03-persist-conversations.md)
- [第 4 章如何生成并校验评审计划](./04-maintainable-system-prompt.md)
- [术语表中的 Context](../reference/glossary.md#context)
