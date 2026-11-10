import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createQwenModel, type ChatModel } from '@agent-book/model-runtime'
import { openConversationStore } from '@agent-book/persistence'
import { type ChatOptions } from './conversations.js'

function selectModel (env: NodeJS.ProcessEnv): ChatModel {
  const mode = env.CHAT_MODEL_MODE?.trim() || 'fixture'
  if (mode === 'fixture') {
    return {
      async complete (messages) {
        const previous = messages.filter(({ role }) => role === 'user').at(-2)
        const text = previous
          ? `上一条用户消息是「${previous.content}」。`
          : '已收到，这是本会话的第一条消息。'
        return { text, elapsedMs: 0, usage: null, finishReason: 'stop' }
      }
    }
  }
  if (mode !== 'qwen') throw new Error('CHAT_MODEL_MODE 应为 fixture 或 qwen。')

  const apiKey = env.DASHSCOPE_API_KEY?.trim()
  const baseUrl = env.DASHSCOPE_BASE_URL?.trim()
  const model = env.QWEN_MODEL?.trim()
  if (!apiKey || !baseUrl || !model) {
    throw new Error('在线模式需要设置 DASHSCOPE_API_KEY、DASHSCOPE_BASE_URL 和 QWEN_MODEL。')
  }
  return createQwenModel({ apiKey, baseUrl, model })
}

export function chatOptionsFromEnvironment (env: NodeJS.ProcessEnv, rootDirectory: string): ChatOptions | undefined {
  const tokenA = env.CHAT_DEMO_TOKEN_A?.trim()
  const tokenB = env.CHAT_DEMO_TOKEN_B?.trim()
  if (!tokenA && !tokenB) return undefined
  if (!tokenA || !tokenB || tokenA === tokenB || /\s/.test(tokenA) || /\s/.test(tokenB)) {
    throw new Error('请为 CHAT_DEMO_TOKEN_A 和 CHAT_DEMO_TOKEN_B 设置两个不同且不含空白的值。')
  }

  const model = selectModel(env)
  const databaseUrl = env.DATABASE_URL?.trim() || 'file:./data/research.sqlite'
  if (!databaseUrl.startsWith('file:') || databaseUrl === 'file:') {
    throw new Error('DATABASE_URL 应为 file: 开头的 SQLite 文件位置。')
  }
  const filename = databaseUrl.startsWith('file://')
    ? fileURLToPath(databaseUrl)
    : resolve(rootDirectory, databaseUrl.slice('file:'.length))
  mkdirSync(dirname(filename), { recursive: true })

  return {
    model,
    store: openConversationStore(filename),
    identities: new Map([
      [tokenA, { tenantId: 'tenant-a', userId: 'user-a' }],
      [tokenB, { tenantId: 'tenant-b', userId: 'user-b' }]
    ])
  }
}
