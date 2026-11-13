import type { ChatMessage } from '@agent-book/model-runtime'

export interface ContextItem {
  id: string
  kind: 'tool' | 'evidence' | 'history'
  text: string
  topics: readonly string[]
  summary?: string
}

interface ContextQuestion {
  systemPrompt: string
  goal: string
  question: string
}

export interface ContextRequest extends ContextQuestion {
  topic: string
  items: readonly ContextItem[]
  requiredIds: readonly string[]
  maxInputBytes: number
}

interface ContextDecision {
  id: string
  action: 'included' | 'summarized' | 'skipped'
  reason: 'required' | 'related' | 'unrelated' | 'budget'
}

export function assembleContext (input: ContextQuestion, items: readonly ContextItem[]) {
  const { systemPrompt, goal, question } = input
  const context = items.map(({ id, kind, text }) => ({ id, kind, text }))
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify({ goal, question, context }) }
  ]
  return { messages, inputBytes: Buffer.byteLength(JSON.stringify(messages), 'utf8') }
}

export function buildContext (request: ContextRequest) {
  const { items, topic, maxInputBytes } = request
  if (!Number.isSafeInteger(maxInputBytes) || maxInputBytes < 1) {
    throw new Error('输入预算应为正整数字节数。')
  }

  const byId = new Map(items.map(item => [item.id, item]))
  if (byId.size !== items.length) throw new Error('上下文条目 ID 应唯一。')
  const requiredIds = new Set(request.requiredIds)
  const selected = [...requiredIds].map(id => {
    const item = byId.get(id)
    if (!item) throw new Error(`缺少必需上下文 ${id}。`)
    return item
  })
  let result = assembleContext(request, selected)
  if (result.inputBytes > maxInputBytes) {
    throw new Error(`必需上下文超出输入预算（需要 ${result.inputBytes} 字节，上限 ${maxInputBytes} 字节）。`)
  }

  const decisions: ContextDecision[] = []
  for (const item of items) {
    const { id } = item
    if (requiredIds.has(id)) {
      decisions.push({ id, action: 'included', reason: 'required' })
      continue
    }
    if (!item.topics.includes(topic)) {
      decisions.push({ id, action: 'skipped', reason: 'unrelated' })
      continue
    }

    const full = assembleContext(request, [...selected, item])
    if (full.inputBytes <= maxInputBytes) {
      selected.push(item)
      result = full
      decisions.push({ id, action: 'included', reason: 'related' })
      continue
    }

    if (item.kind === 'history' && item.summary) {
      const shortened = { ...item, text: item.summary }
      const compact = assembleContext(request, [...selected, shortened])
      if (compact.inputBytes <= maxInputBytes) {
        selected.push(shortened)
        result = compact
        decisions.push({ id, action: 'summarized', reason: 'budget' })
        continue
      }
    }
    decisions.push({ id, action: 'skipped', reason: 'budget' })
  }
  return { ...result, decisions }
}
