import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

test('startup guide documents every public local command and fixed port', () => {
  const guidePath = fileURLToPath(new URL('../../docs/how-to/run-project-locally.md', import.meta.url))

  expect(existsSync(guidePath), 'startup guide should exist').toBe(true)
  const guide = readFileSync(guidePath, 'utf8')

  for (const command of ['pnpm dev', 'pnpm dev:web', 'pnpm dev:api', 'pnpm docs:dev', 'pnpm docs:build']) {
    expect(guide).toContain(command)
  }

  for (const port of ['3000', '5173', '5174']) {
    expect(guide).toContain(port)
  }

  for (const url of [
    'Vue：`http://localhost:5173`',
    'Fastify：`http://127.0.0.1:3000`',
    '访问 `http://127.0.0.1:5174`'
  ]) expect(guide).toContain(url)
})
