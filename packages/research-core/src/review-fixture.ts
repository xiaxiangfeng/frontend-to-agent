import type { ResearchPlan, ResearchPlanRequest } from './research-plan.ts'

export const reviewRequest: ResearchPlanRequest = {
  goal: '对比两个开源文档问答项目 A 和 B 的文档导入与证据引用方式，给出有出处的借鉴建议。',
  sources: [
    { id: 'a-readme', description: '练习项目 A 的 README，查找文档导入与引用相关说明。' },
    { id: 'b-readme', description: '练习项目 B 的 README，查找文档导入与引用相关说明。' }
  ]
}

export const reviewPlan: ResearchPlan = {
  questions: ['两个项目如何接收待导入文档？', '两个项目如何让读者定位答案的原始资料？'],
  steps: [
    {
      action: '分别从两个 README 提取文档导入与引用相关说明。',
      sourceIds: ['a-readme', 'b-readme'],
      doneWhen: '为每个项目记录对应段落的标题，并标记 README 未说明的部分。'
    },
    {
      action: '按文档导入和证据引用两个维度对照记录。',
      sourceIds: ['a-readme', 'b-readme'],
      doneWhen: '对照表中的每条借鉴建议都有出处或标为待核实。'
    }
  ],
  deliverable: '一份 Markdown 评审报告，包含对照表、带出处的借鉴建议和待核实问题。'
}
