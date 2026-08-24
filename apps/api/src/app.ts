import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'

const liveResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', const: 'ok' }
  },
  required: ['status']
} as const

export function buildApp (options: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify(options)

  app.get('/health/live', {
    schema: {
      response: { 200: liveResponseSchema }
    }
  }, async () => ({ status: 'ok' }))

  return app
}
