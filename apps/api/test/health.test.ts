import { expect, test } from 'vitest'

import { buildApp } from '../src/app.ts'

test('GET /health/live reports that the API process is alive', async () => {
  const app = buildApp()

  try {
    const response = await app.inject({ method: 'GET', url: '/health/live' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  } finally {
    await app.close()
  }
})
