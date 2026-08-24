import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const appModuleUrl = new URL('../src/app.ts', import.meta.url)

test('GET /health/live reports that the API process is alive', async () => {
  expect(existsSync(fileURLToPath(appModuleUrl)), 'apps/api/src/app.ts should exist').toBe(true)

  const { buildApp } = await import(appModuleUrl.href)
  const app = buildApp()

  try {
    const response = await app.inject({ method: 'GET', url: '/health/live' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  } finally {
    await app.close()
  }
})
