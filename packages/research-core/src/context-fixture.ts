import type { ContextItem } from './context-builder.ts'

export const contextQuestions = [
  {
    topic: 'import',
    question: '项目 A 和 B 分别支持导入哪些文件？',
    requiredIds: ['read-document', 'list-import-formats', 'a-import', 'b-import']
  },
  {
    topic: 'citation',
    question: '项目 A 和 B 怎么在回答里标明资料出处？',
    requiredIds: ['read-document', 'read-citation-example', 'a-citation', 'b-citation']
  }
]

export const contextItems: readonly ContextItem[] = [
  {
    id: 'read-document',
    kind: 'tool',
    text: 'read_document(sourceId, heading) 读取指定 README 的段落。',
    topics: ['import', 'citation']
  },
  {
    id: 'list-import-formats',
    kind: 'tool',
    text: 'list_import_formats(sourceId) 从指定 README 的导入说明提取文件格式。',
    topics: ['import']
  },
  {
    id: 'read-citation-example',
    kind: 'tool',
    text: 'read_citation_example(sourceId) 读取指定 README 中的引用示例。',
    topics: ['citation']
  },
  { id: 'a-import', kind: 'evidence', text: 'a-readme / 文档导入：支持上传 Markdown 和 PDF 文件。', topics: ['import'] },
  { id: 'b-import', kind: 'evidence', text: 'b-readme / 添加资料：支持导入 Markdown 和纯文本。', topics: ['import'] },
  { id: 'a-citation', kind: 'evidence', text: 'a-readme / 引用：答案附上链接，点击可以跳到原文段落。', topics: ['citation'] },
  { id: 'b-citation', kind: 'evidence', text: 'b-readme / 来源：答案下方显示所用文档的标题。', topics: ['citation'] },
  { id: 'a-install', kind: 'evidence', text: 'a-readme / 安装：安装依赖后启动本地服务。', topics: ['setup'] },
  {
    id: 'review-scope',
    kind: 'history',
    text: '这次评审以两份 README 为依据。资料没有说明的地方标为待核实。',
    topics: ['import', 'citation']
  },
  {
    id: 'review-notes',
    kind: 'history',
    topics: ['import', 'citation'],
    text: [
      '上轮讨论了对照表的写法。对照表每行只比一个问题，例如是否支持 PDF 导入或怎样定位引用原文。项目名称、对照维度、证据和结论可以放在不同的列，读者可以逐项核对。',
      '记录导入能力时，先写清楚 README 明确列出的文件格式，再记下操作入口。若它只展示了一个上传例子，就在备注里写明示例覆盖的格式，并把完整支持范围留作待核实。',
      '记录引用能力时，把界面上显示的文字和点击后的行为分别写清楚。每条结论都保留 README 的段落标题。查不到的行为留到下一次试用时核对。',
      '写借鉴建议时，先列出两边已有的做法，说明它们对评审目标有什么帮助。整理报告前统一资料名称，补齐能找到的出处。'
    ].join('\n'),
    summary: '按维度对照，每条结论记录 README 段落标题。资料没说明的地方标为待核实。'
  }
]
