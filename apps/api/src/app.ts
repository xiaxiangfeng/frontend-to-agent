import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import { registerConversationRoutes, type ChatOptions } from './conversations.js'

const liveResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', const: 'ok' }
  },
  required: ['status']
} as const

export function buildApp (options: FastifyServerOptions = {}, chat?: ChatOptions): FastifyInstance {
  const app = Fastify(options)

  app.get('/health/live', {
    schema: {
      response: { 200: liveResponseSchema }
    }
  }, async () => ({ status: 'ok' }))

  if (chat) registerConversationRoutes(app, chat)

  return app
}
