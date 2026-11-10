import { type ChatModel } from '@agent-book/model-runtime'
import { sendConversationMessage, type ConversationOwner, type ConversationStore } from '@agent-book/research-core'
import { type FastifyInstance, type FastifyReply } from 'fastify'

export interface ChatOptions {
  store: ConversationStore
  model: ChatModel
  identities: ReadonlyMap<string, ConversationOwner>
}

interface ConversationParams {
  conversationId: string
}

const messageSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    content: { type: 'string', minLength: 1, maxLength: 4000 }
  },
  required: ['content']
} as const

function unauthorized (reply: FastifyReply) {
  return reply.code(401).header('WWW-Authenticate', 'Bearer').send({ error: 'UNAUTHORIZED' })
}

function notFound (reply: FastifyReply) {
  return reply.code(404).send({ error: 'CONVERSATION_NOT_FOUND' })
}

export function registerConversationRoutes (app: FastifyInstance, chat: ChatOptions) {
  function ownerFromHeader (authorization: string | undefined) {
    const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1]
    return token ? chat.identities.get(token) : undefined
  }

  app.addHook('onClose', async () => chat.store.close())

  app.post('/conversations', async (request, reply) => {
    const owner = ownerFromHeader(request.headers.authorization)
    if (!owner) return unauthorized(reply)
    return reply.code(201).send({ conversationId: chat.store.create(owner) })
  })

  app.get<{ Params: ConversationParams }>('/conversations/:conversationId', async (request, reply) => {
    reply.header('Cache-Control', 'no-store')
    const owner = ownerFromHeader(request.headers.authorization)
    if (!owner) return unauthorized(reply)

    const conversation = chat.store.read(request.params.conversationId, owner)
    return conversation ?? notFound(reply)
  })

  app.post<{ Params: ConversationParams, Body: { content: string } }>('/conversations/:conversationId/messages', {
    schema: { body: messageSchema }
  }, async (request, reply) => {
    const owner = ownerFromHeader(request.headers.authorization)
    if (!owner) return unauthorized(reply)

    const content = request.body.content.trim()
    if (!content) return reply.code(400).send({ error: 'EMPTY_MESSAGE' })

    const { conversationId } = request.params
    const result = await sendConversationMessage(chat, { conversationId, owner, content })
    switch (result.kind) {
      case 'not-found':
        return notFound(reply)
      case 'model-failed':
        request.log.warn({ conversationId }, 'Conversation model call failed')
        return reply.code(502).send({ error: 'MODEL_UNAVAILABLE' })
      case 'conflict':
        return reply.code(409).send({ error: 'CONVERSATION_CONFLICT' })
      case 'replied':
        return {
          conversationId,
          message: { role: 'assistant', content: result.reply.text },
          elapsedMs: result.reply.elapsedMs,
          usage: result.reply.usage
        }
    }
  })
}
