import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type FastifyInstance } from 'fastify'
import { afterEach, expect, test, vi } from 'vitest'
import { type ChatModel, type ModelReply } from '../../../packages/model-runtime/src/index.ts'
import { openConversationStore } from '../../../packages/persistence/src/index.ts'
import { buildApp } from '../src/app.ts'

const identities = new Map([
  ['token-a', { tenantId: 'tenant-a', userId: 'a' }],
  ['token-b', { tenantId: 'tenant-b', userId: 'b' }],
  ['token-c', { tenantId: 'tenant-a', userId: 'c' }]
])
const apps = new Set<FastifyInstance>()
const temporaryDirectories: string[] = []

function reply (text: string): ModelReply {
  return { text, elapsedMs: 2, usage: null, finishReason: 'stop' }
}

function startApp (model: ChatModel, database = ':memory:') {
  const app = buildApp({}, { model, identities, store: openConversationStore(database) })
  apps.add(app)
  return app
}

async function closeApp (app: FastifyInstance) {
  await app.close()
  apps.delete(app)
}

afterEach(async () => {
  await Promise.all([...apps].map(closeApp))
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function headers (token: string) {
  return { authorization: `Bearer ${token}` }
}

async function createConversation (app: FastifyInstance, token: string): Promise<string> {
  const response = await app.inject({ method: 'POST', url: '/conversations', headers: headers(token) })
  expect(response.statusCode).toBe(201)
  return response.json<{ conversationId: string }>().conversationId
}

function send (app: FastifyInstance, id: string, token: string, content: string) {
  return app.inject({
    method: 'POST',
    url: `/conversations/${id}/messages`,
    headers: headers(token),
    payload: { content }
  })
}

function read (app: FastifyInstance, id: string, token: string) {
  return app.inject({ method: 'GET', url: `/conversations/${id}`, headers: headers(token) })
}

test('requires verified identities and rejects cross-tenant and same-tenant cross-user access', async () => {
  const complete = vi.fn<ChatModel['complete']>()
  const app = startApp({ complete })

  expect((await app.inject({ method: 'POST', url: '/conversations' })).statusCode).toBe(401)
  expect((await app.inject({
    method: 'POST', url: '/conversations', headers: headers('unknown')
  })).statusCode).toBe(401)

  const id = await createConversation(app, 'token-a')
  for (const other of ['token-b', 'token-c']) {
    expect((await read(app, id, other)).statusCode).toBe(404)
    expect((await send(app, id, other, '试图续聊')).statusCode).toBe(404)
  }
  expect(complete).not.toHaveBeenCalled()
})

test('uses only the current conversation history when A and B alternate requests', async () => {
  const complete = vi.fn<ChatModel['complete']>()
    .mockResolvedValueOnce(reply('A 的回答'))
    .mockResolvedValueOnce(reply('B 的回答'))
    .mockResolvedValueOnce(reply('A 的后续回答'))
    .mockResolvedValueOnce(reply('A 的新会话回答'))
  const app = startApp({ complete })
  const a = await createConversation(app, 'token-a')
  const b = await createConversation(app, 'token-b')
  expect((await send(app, a, 'token-a', 'A 的问题')).statusCode).toBe(200)
  expect((await send(app, b, 'token-b', 'B 的问题')).statusCode).toBe(200)
  expect((await send(app, a, 'token-a', '接着说')).statusCode).toBe(200)
  const anotherConversation = await createConversation(app, 'token-a')
  expect((await send(app, anotherConversation, 'token-a', '开始新话题')).statusCode).toBe(200)

  expect(complete.mock.calls[1]?.[0].slice(1)).toEqual([{ role: 'user', content: 'B 的问题' }])
  expect(complete.mock.calls[2]?.[0].slice(1)).toEqual([
    { role: 'user', content: 'A 的问题' },
    { role: 'assistant', content: 'A 的回答' },
    { role: 'user', content: '接着说' }
  ])
  expect(complete.mock.calls[3]?.[0].slice(1)).toEqual([{ role: 'user', content: '开始新话题' }])
})

test('reopens the SQLite file and continues an existing conversation with a new app', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agent-book-chat-'))
  temporaryDirectories.push(directory)
  const database = join(directory, 'chat.sqlite')
  const first = startApp({ complete: vi.fn().mockResolvedValue(reply('记住 Vue 了')) }, database)
  const id = await createConversation(first, 'token-a')
  expect((await send(first, id, 'token-a', '研究 Vue')).statusCode).toBe(200)
  await closeApp(first)

  const complete = vi.fn<ChatModel['complete']>().mockResolvedValue(reply('我们在研究 Vue'))
  const restarted = startApp({ complete }, database)
  expect((await read(restarted, id, 'token-b')).statusCode).toBe(404)
  const response = await send(restarted, id, 'token-a', '刚才的主题是什么？')
  expect(response.statusCode).toBe(200)
  expect(response.json().message).toEqual({ role: 'assistant', content: '我们在研究 Vue' })
  expect(complete.mock.calls[0]?.[0].slice(1)).toEqual([
    { role: 'user', content: '研究 Vue' },
    { role: 'assistant', content: '记住 Vue 了' },
    { role: 'user', content: '刚才的主题是什么？' }
  ])
})

test('rejects whitespace and leaves no half turn when the model fails', async () => {
  const complete = vi.fn<ChatModel['complete']>().mockRejectedValue(new Error('upstream failed'))
  const app = startApp({ complete })
  const id = await createConversation(app, 'token-a')

  expect((await send(app, id, 'token-a', '   ')).statusCode).toBe(400)
  expect(complete).not.toHaveBeenCalled()
  expect((await send(app, id, 'token-a', '一次有效提问')).statusCode).toBe(502)
  expect((await read(app, id, 'token-a')).json().messages).toEqual([])
})

test('returns a conflict when another request has already written the same turn', async () => {
  const entered = Promise.withResolvers<void>()
  const slowReply = Promise.withResolvers<ModelReply>()
  const complete = vi.fn<ChatModel['complete']>()
    .mockImplementationOnce(() => {
      entered.resolve()
      return slowReply.promise
    })
    .mockResolvedValueOnce(reply('先保存的回答'))
  const app = startApp({ complete })
  const id = await createConversation(app, 'token-a')
  const slow = send(app, id, 'token-a', '较慢的请求')
  await entered.promise

  try {
    expect((await send(app, id, 'token-a', '较快的请求')).statusCode).toBe(200)
  } finally {
    slowReply.resolve(reply('较晚完成的回答'))
  }

  const conflict = await slow
  expect(conflict.statusCode).toBe(409)
  expect(conflict.json()).toEqual({ error: 'CONVERSATION_CONFLICT' })
  expect((await read(app, id, 'token-a')).json().messages).toEqual([
    { role: 'user', content: '较快的请求' },
    { role: 'assistant', content: '先保存的回答' }
  ])
})
