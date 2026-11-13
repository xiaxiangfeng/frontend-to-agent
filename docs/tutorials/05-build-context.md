# 组织、选择和压缩上下文

## 本章目标

第 4 章给项目 A 和 B 写了评审计划。本章沿用评审目标，用两道预设题练习怎么准备模型输入。比如问「两个项目分别支持导入哪些文件？」时，程序带上两份 README 的导入段落。旧评审笔记放不下时，就换成简短的摘要。这些准备交给模型看的内容，就是这一轮的上下文。

## 完成后的可见结果

想先看结果，在包含第 5 章代码的分支运行 `pnpm research:context`。从本章起点动手时，在实现步骤的第 4 步运行。命令在本地组装消息，默认打印大小和选择记录。练习费用为 ¥0。

| 本轮问题 | 保留的 README 段落 | 全部候选内容 | 筛选后的内容 |
| --- | --- | ---: | ---: |
| 项目 A 和 B 分别支持导入哪些文件？ | A 的「文档导入」和 B 的「添加资料」 | 2405 字节 | 1182 字节 |
| 项目 A 和 B 怎么在回答里标明资料出处？ | A 的「引用」和 B 的「来源」 | 2411 字节 | 1192 字节 |

终端的 `comparisons[0]` 对应第一题。`allInputBytes` 和 `selectedInputBytes` 对应表里的两个大小。看 `decisions` 可以知道每一项怎么处理。

| 条目 | 终端里的 `action` / `reason` | 为什么 |
| --- | --- | --- |
| `a-import` | `included` / `required` | 要回答 A 支持哪些文件，必须带上 A 的导入段落。 |
| `a-citation` | `skipped` / `unrelated` | A 的引用说明和这道文件格式题无关。 |
| `review-notes` | `summarized` / `budget` | 旧评审笔记的原文放不下，改用摘要。 |

### 怎么读 `user` 消息里的内容

应用把这次要问的事和参考资料装进 `user` 消息。`goal` 是总任务「评审项目 A 和 B」，`question` 是眼下要答的问题「分别支持导入哪些文件？」，`context` 是程序为这道题选出来的资料和说明。

`context` 里的每一项都有编号 `id`、类型 `kind` 和正文 `text`。比如 `a-import` 的 `kind` 是 `evidence`，表示这段文字是用来回答问题的资料。

| `kind` 的值 | 给模型看的内容 |
| --- | --- |
| `evidence` | 两份示例 README 的导入段落。A 支持 Markdown 和 PDF，B 支持 Markdown 和纯文本。 |
| `history` | 之前的评审约定或笔记摘要，例如每条结论要记下出处。 |
| `tool` | 预先写好的工具说明。例如 `read_document` 将来可以按资料 ID 和标题读取段落。 |

模型通常能结合字段名和值理解含义。比如 `question` 里是一句问话，`kind` 的值是 `evidence`，旁边的 `text` 是 README 段落。像这样的字段可以直接用。项目专用的缩写可以补一句解释。

System Prompt 要写清怎么用这些资料。比如可以把「根据提供的资料回答当前问题」具体写成「只根据 `kind` 为 `evidence` 的段落回答。每条结论注明 README 和段落标题。资料没说明的地方标为待核实。」

用这两段资料，可以写出这样的示例回答。

> 项目 A 支持 Markdown 和 PDF（A 的 README「文档导入」）。项目 B 支持 Markdown 和纯文本（B 的 README「添加资料」）。B 是否支持 PDF，待核实。

两份段落已经提前写在练习数据里。工具说明作为候选内容，用来练习保留查文件格式的说明、跳过查引用示例的说明。到第 7 章接入工具调用后，模型才可以请求读取段落，由应用执行并把结果发回模型。

<details>
<summary>展开第一题组装出的两条消息</summary>

执行 `pnpm research:context --messages` 后，在 `comparisons[0]` 里可以看到 `allMessages` 和 `selectedMessages`。下面展示的是 `selectedMessages` 里的两条消息。第一条的 `role` 是 `system`，`content` 是回答要求。

```text
你是技术研究助手。根据提供的资料回答当前问题，标明出处。
```

第二条的 `role` 是 `user`。应用用 `JSON.stringify({ goal, question, context })` 生成它的 `content`，这里按 JSON 缩进展开。

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

开发者把两道题、示例 README 段落、工具说明和旧笔记写在 `context-fixture.ts`。文件格式题的 `topic` 是 `import`，`requiredIds` 包含 A 的「文档导入」`a-import`、B 的「添加资料」`b-import` 和本题需要的工具说明。程序用 `Map.get(id)` 取出这些条目，再检查其余条目的 `topics`。比如 `a-citation` 只有 `citation` 标签，换到引用题时才会用到。

```sh
git restore --source=chapter-05-end --worktree -- packages/research-core/src/context-fixture.ts
```

第 4 章的 `sourceIds` 指整份 README，比如 `a-readme`。这章的 `requiredIds` 指已经挑好的具体条目，比如 `a-import`。`research:context` 从第 4 章的练习数据复用评审目标，本轮题目和要用的段落取自本章的练习数据。

#### 以后怎么从真实 README 里找段落

假设要回答「A 和 B 分别支持导入哪些文件？」，程序可以先按 `sourceIds` 把搜索范围限定在 A 和 B 的 README，再分别匹配标题或正文。比如查「导入」「上传」「支持」这样的关键词，可以找到 A 的「文档导入」和 B 的「添加资料」。已知准确标题时，可以直接按标题取段落。需要一次匹配几种字样时，也可以用 `/导入|上传/` 这样的正则。

搜到段落后，程序把标题、正文和来源交给 Context Builder，由它按本轮问题和预算组装消息。以后接上工具时，同一段搜索逻辑也可以放在工具里，由模型提出要查什么，Node 在允许的资料里搜索。第 7 章会讲工具怎么调用，第 11、12 章会讲怎么切分文档和检索。 [章节安排](../reference/chapter-map.md)

### 2. 把必需项放进消息，再用预算筛选其余内容

`assembleContext` 把固定的回答要求放进 `system` 消息，把评审目标、本轮问题和选中的内容放进 `user` 消息。主题标签和必需清单供程序筛选用，消息里的每条资料只带 `id`、`kind`、`text`。

默认预算是 1300 字节，用来演示原文放不下、摘要能放下的情况。程序计算 `JSON.stringify(messages)` 的 UTF-8 字节数，包含 `system` 和 `user` 两条消息。全量消息用同样的算法计数，供比较大小。实际调用时，Token 用量看模型服务的返回值。

`buildContext` 先放入必需项，缺一项或放不下就报错。剩下的条目按练习数据里的顺序处理。标签相关才试着放入，试放后整份消息还在预算内就保留。旧笔记放不下时，再试下一步的摘要。

```sh
git restore --source=chapter-05-end --worktree -- packages/research-core/src/context-builder.ts
pnpm exec vitest run packages/research-core/test/context-builder.test.ts -t 'keeps required inputs|cannot fit|missing required evidence'
```

### 3. 把放不下的旧笔记换成摘要

文件格式题需要保留 A 和 B 的 README 导入段落。旧笔记 `review-notes` 则包含对照表列名、导入入口、引用界面和写建议的方法。本轮只需要保留一条评审约定，提醒模型按维度比较、给结论记下出处、标出待核实项。

这份笔记的原文占 807 字节，摘要占 101 字节。下面这句是程序选用的摘要，会放在 `review-notes` 的 `text` 里。

> 按维度对照，每条结论记录 README 段落标题。资料没说明的地方标为待核实。

<details>
<summary>展开同一条笔记的原文</summary>

```text
上轮讨论了对照表的写法。对照表每行只比一个问题，例如是否支持 PDF 导入或怎样定位引用原文。项目名称、对照维度、证据和结论可以放在不同的列，读者可以逐项核对。
记录导入能力时，先写清楚 README 明确列出的文件格式，再记下操作入口。若它只展示了一个上传例子，就在备注里写明示例覆盖的格式，并把完整支持范围留作待核实。
记录引用能力时，把界面上显示的文字和点击后的行为分别写清楚。每条结论都保留 README 的段落标题。查不到的行为留到下一次试用时核对。
写借鉴建议时，先列出两边已有的做法，说明它们对评审目标有什么帮助。整理报告前统一资料名称，补齐能找到的出处。
```

</details>

本章的 `summary` 由开发者提前写进练习数据。`buildContext` 先试放原文，原文放不下时才试放摘要。程序只替换本轮 `messages` 里的 `text`，旧笔记的原文仍可回看。

完成第 4 步后，运行下面的命令，再按表里的数字修改预算。看第一题的 `selectedMessages[1].content`，找到 `review-notes` 的 `text`，再用 `decisions` 核对程序的选择。

```sh
pnpm research:context --messages --max-input-bytes 1300
```

| 预算 | `review-notes` 放进消息的内容 | 本轮消息大小 |
| ---: | --- | ---: |
| 2405 字节 | 原文 | 1894 字节 |
| 1300 字节 | 摘要 | 1182 字节 |
| 1100 字节 | 剩余空间放不下摘要，跳过这一条 | 1020 字节 |

在前两行，其他入选内容相同。笔记正文少了 706 字节，整份消息少了 712 字节。多出来的 6 字节来自原文的三个换行。笔记先转成 `user.content` 的 JSON 字符串，整份 `messages` 再转成 JSON，换行和反斜杠经过两次转义。即使预算调到 2405 字节，程序也会跳过与文件格式题无关的引用和安装说明。

### 4. 对照全量和按需组装

恢复命令行入口后，先看每道题的大小和选择记录，再加 `--messages` 检查组装出来的消息。

```sh
git restore --source=chapter-05-end --worktree -- packages/research-core/src/context-cli.ts package.json tests/repository/workspace.test.mjs
pnpm research:context
pnpm research:context --messages
```

第 6 章会把组装好的消息发给模型，练习接收流式回复、处理请求失败和控制输出预算。

## 每一步的验证方式

| 步骤 | 应观察到的结果 |
| --- | --- |
| 1. 核对候选项 | 两道题都指定了两份 README 的相关段落和本题需要的工具说明。 |
| 2. 核对预算 | 必需内容放不下时，测试会捕获错误。 |
| 3. 核对摘要 | 用 `--messages` 检查 `review-notes` 的 `text`，确认默认预算用的是摘要。 |
| 4. 对照输入 | 两道题的按需消息都更小，保留本题需要的证据和工具说明。 |

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

在 `context-fixture.ts` 里把 `review-notes` 的 `summary` 改成「保留出处，缺失项待核实。」再运行 `pnpm research:context --messages --max-input-bytes 1130`，看短摘要能否和两份必需的 README 段落一起放进去。

## 相关解释与参考

- [第 3 章如何取出会话历史](./03-persist-conversations.md)
- [第 4 章如何生成并校验评审计划](./04-maintainable-system-prompt.md)
- [术语表中的 Context](../reference/glossary.md#context)
