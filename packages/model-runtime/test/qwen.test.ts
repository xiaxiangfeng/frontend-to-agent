import { expect, test, vi } from 'vitest'
import { createQwenModel, type ChatMessage } from '../src/index.ts'

const options = {
  baseUrl: 'https://example.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/',
  apiKey: 'test-key',
  model: 'qwen3.8-flash'
}

const messages: ChatMessage[] = [{ role: 'user', content: '什么是 Vue 响应式？' }]

test('sends the selected messages and exposes the provider token counts', async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
    choices: [{ message: { content: 'Vue 会追踪响应式数据的依赖。' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 28, completion_tokens: 12, total_tokens: 40 }
  }))

  const reply = await createQwenModel(options, transport).complete(messages)

  expect(transport).toHaveBeenCalledTimes(1)
  const [url, request] = transport.mock.calls[0] ?? []
  expect(String(url)).toBe('https://example.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions')
  expect(request?.method).toBe('POST')
  expect(new Headers(request?.headers).get('authorization')).toBe('Bearer test-key')
  expect(JSON.parse(String(request?.body))).toMatchObject({
    model: options.model,
    messages,
    enable_thinking: false,
    max_completion_tokens: 256,
    stream: false
  })
  expect(reply).toMatchObject({
    text: 'Vue 会追踪响应式数据的依赖。',
    finishReason: 'stop',
    usage: { inputTokens: 28, outputTokens: 12, totalTokens: 40 }
  })
})

test('reports an HTTP failure without exposing the provider error body', async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('private data', { status: 401 }))

  await expect(createQwenModel(options, transport).complete(messages))
    .rejects.toThrow(/^百炼请求失败（HTTP 401）。$/)
})

test('accepts a text reply when the provider omits usage', async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
    choices: [{ message: { content: '回答。' } }]
  }))

  await expect(createQwenModel(options, transport).complete(messages))
    .resolves.toMatchObject({ text: '回答。', usage: null })
})

test('rejects a successful HTTP response without usable reply text', async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
    choices: [{ message: { content: null } }]
  }))

  await expect(createQwenModel(options, transport).complete(messages))
    .rejects.toThrow('百炼响应缺少可用的文本回复。')
})
