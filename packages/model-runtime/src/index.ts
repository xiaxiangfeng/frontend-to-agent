export const packageName = '@agent-book/model-runtime' as const

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface ModelReply {
  text: string
  elapsedMs: number
  usage: TokenUsage | null
  finishReason: string | null
}

export interface ChatModel {
  complete (messages: readonly ChatMessage[]): Promise<ModelReply>
}

export interface QwenModelOptions {
  baseUrl: string
  apiKey: string
  model: string
}

function asRecord (value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null
}

function isTokenCount (value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function readUsage (value: unknown): TokenUsage | null {
  const usage = asRecord(value)
  const inputTokens = usage?.prompt_tokens
  const outputTokens = usage?.completion_tokens
  const totalTokens = usage?.total_tokens
  if (!isTokenCount(inputTokens) || !isTokenCount(outputTokens) || !isTokenCount(totalTokens)) return null
  return { inputTokens, outputTokens, totalTokens }
}

export function createQwenModel (options: QwenModelOptions, transport: typeof fetch = fetch): ChatModel {
  const endpoint = URL.parse(options.baseUrl)
  const path = endpoint?.pathname.replace(/\/+$/, '')
  if (!endpoint || endpoint.protocol !== 'https:' || path !== '/compatible-mode/v1' ||
    endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error('DASHSCOPE_BASE_URL 应为以 /compatible-mode/v1 结尾的 HTTPS 基础地址。')
  }
  endpoint.pathname = path + '/chat/completions'

  return {
    async complete (messages) {
      const startedAt = performance.now()
      const signal = AbortSignal.timeout(30_000)
      const response = await transport(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          stream: false,
          enable_thinking: false,
          max_completion_tokens: 256
        }),
        signal,
        redirect: 'error'
      }).catch(() => {
        if (signal.aborted) throw new Error('百炼请求超过 30 秒。')
        throw new Error('无法连接百炼接口，请检查网络和调用地址。')
      })

      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined)
        throw new Error(`百炼请求失败（HTTP ${response.status}）。`)
      }

      const payload: unknown = await response.json().catch(() => {
        if (signal.aborted) throw new Error('百炼请求超过 30 秒。')
        throw new Error('百炼返回的内容无法解析成 JSON。')
      })
      const result = asRecord(payload)
      const choices = result?.choices
      const choice = Array.isArray(choices) ? asRecord(choices[0]) : null
      const text = asRecord(choice?.message)?.content
      if (typeof text !== 'string' || text.trim() === '') {
        throw new Error('百炼响应缺少可用的文本回复。')
      }

      const finishReason = choice?.finish_reason
      return {
        text,
        elapsedMs: Math.round(performance.now() - startedAt),
        usage: readUsage(result?.usage),
        finishReason: typeof finishReason === 'string' ? finishReason : null
      }
    }
  }
}
