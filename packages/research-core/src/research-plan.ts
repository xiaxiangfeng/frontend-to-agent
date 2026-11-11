import type { ChatModel, TokenUsage } from '@agent-book/model-runtime'
import { researchPlanPromptVersion, researchPlanSystemPrompt } from './research-plan-prompt.ts'

export interface ResearchPlanRequest {
  goal: string
  sources: readonly { id: string, description: string }[]
}

export interface ResearchPlan {
  questions: string[]
  steps: { action: string, sourceIds: string[], doneWhen: string }[]
  deliverable: string
}

export interface ResearchPlanResult {
  plan: ResearchPlan
  promptVersion: string
  elapsedMs: number
  usage: TokenUsage | null
}

function readObject (value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} 应为对象。`)
  }
  return value as Record<string, unknown>
}

function readList (value: unknown, field: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} 应为非空数组。`)
  }
  return value
}

function readText (value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} 应为非空字符串。`)
  }
  return value
}

function parseResearchPlan (text: string, allowedSourceIds: ReadonlySet<string>): ResearchPlan {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('研究计划不是有效的 JSON。')
  }

  const object = readObject(value, '研究计划')
  const questions = readList(object.questions, 'questions').map((question, index) =>
    readText(question, `questions[${index}]`))
  const steps = readList(object.steps, 'steps').map((entry, index) => {
    const field = `steps[${index}]`
    const step = readObject(entry, field)
    const action = readText(step.action, `${field}.action`)
    const doneWhen = readText(step.doneWhen, `${field}.doneWhen`)
    const sourceIds = readList(step.sourceIds, `${field}.sourceIds`).map((id, sourceIndex) => {
      const sourceField = `${field}.sourceIds[${sourceIndex}]`
      const sourceId = readText(id, sourceField)
      if (!allowedSourceIds.has(sourceId)) throw new Error(`${sourceField} 使用了未授权来源。`)
      return sourceId
    })
    return { action, sourceIds, doneWhen }
  })
  return { questions, steps, deliverable: readText(object.deliverable, 'deliverable') }
}

export async function createResearchPlan (model: ChatModel, request: ResearchPlanRequest): Promise<ResearchPlanResult> {
  const goal = readText(request.goal, 'goal').trim()
  const sources = request.sources
  const allowedSourceIds = new Set(sources.map(({ id }) => id))
  if (allowedSourceIds.size === 0) throw new Error('研究任务需要至少一个已授权来源。')

  const reply = await model.complete([
    { role: 'system', content: researchPlanSystemPrompt },
    { role: 'user', content: JSON.stringify({ goal, sources }) }
  ], { responseFormat: 'json', maxOutputTokens: 1024 })
  if (reply.finishReason === 'length') throw new Error('研究计划达到模型输出上限。')

  return {
    plan: parseResearchPlan(reply.text, allowedSourceIds),
    promptVersion: researchPlanPromptVersion,
    elapsedMs: reply.elapsedMs,
    usage: reply.usage
  }
}
