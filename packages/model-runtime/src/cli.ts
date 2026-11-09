import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { parseArgs } from 'node:util'
import { createQwenModel, type ChatMessage, type ChatModel, type QwenModelOptions } from './index.ts'

const system: ChatMessage = { role: 'system', content: '你是一位技术研究助手，请用简短中文回答。' }
const topic: ChatMessage = { role: 'user', content: '我的研究主题是 Vue 响应式。' }
const followUp: ChatMessage = { role: 'user', content: '刚才的研究主题是什么？' }

const simulateFetch: typeof fetch = async (_url, request) => {
  const { messages } = JSON.parse(String(request?.body)) as { messages: ChatMessage[] }
  const question = messages.at(-1)?.content
  let text = '已收到你的技术问题。这是一条模拟回复。'

  if (question === topic.content) text = '收到，研究主题是 Vue 响应式。'
  if (question === followUp.content) {
    const hasTopic = messages.some(({ role, content }) => role === 'user' && content === topic.content)
    text = hasTopic ? '刚才的研究主题是 Vue 响应式。' : '这次请求没有提供研究主题。'
  }

  const inputTokens = messages.length * 12
  return Response.json({
    choices: [{ message: { content: text }, finish_reason: 'stop' }],
    usage: { prompt_tokens: inputTokens, completion_tokens: 12, total_tokens: inputTokens + 12 }
  })
}

function readLiveOptions (): QwenModelOptions {
  if (existsSync('.env')) loadEnvFile()
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim()
  const baseUrl = process.env.DASHSCOPE_BASE_URL?.trim()
  const model = process.env.QWEN_MODEL?.trim()
  if (!apiKey || !baseUrl || !model) {
    throw new Error('请设置 DASHSCOPE_API_KEY、DASHSCOPE_BASE_URL 和 QWEN_MODEL。')
  }
  return { apiKey, baseUrl, model }
}

async function ask (model: ChatModel, messages: ChatMessage[], label?: string): Promise<string> {
  if (label) {
    console.log(`\n${label}`)
    console.log('messages', JSON.stringify(messages))
  }

  const reply = await model.complete(messages)
  console.log('回复', reply.text)
  console.log('耗时', `${reply.elapsedMs} ms`)
  if (reply.usage) {
    const { inputTokens, outputTokens, totalTokens } = reply.usage
    console.log(`Token 用量 输入 ${inputTokens}，输出 ${outputTokens}，合计 ${totalTokens}`)
  } else {
    console.log('Token 用量未返回')
  }
  if (reply.finishReason === 'length') console.log('回复达到输出上限。')
  return reply.text
}

async function main () {
  const { values, positionals } = parseArgs({
    options: { live: { type: 'boolean' }, compare: { type: 'boolean' } },
    allowPositionals: true
  })
  const question = positionals.join(' ').trim()
  if (values.compare ? positionals.length > 0 : !question) {
    throw new Error('用法 pnpm model:ask [--live] "你的问题" 或 pnpm model:ask [--live] --compare')
  }

  const model = values.live
    ? createQwenModel(readLiveOptions())
    : createQwenModel({
      baseUrl: 'https://fixture.invalid/compatible-mode/v1',
      apiKey: 'fixture-key',
      model: 'fixture-model'
    }, simulateFetch)

  console.log('模式', values.live ? '百炼在线' : '模拟')
  if (values.compare) {
    const firstReply = await ask(model, [system, topic], '第一轮')
    await ask(model, [system, followUp], '追问 A · 只带本轮问题')
    await ask(model, [system, topic, { role: 'assistant', content: firstReply }, followUp], '追问 B · 带上前一轮消息')
  } else {
    await ask(model, [system, { role: 'user', content: question }])
  }
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
