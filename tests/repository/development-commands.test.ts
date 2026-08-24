import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

function readJson (relativePath: string) {
  const filePath = fileURLToPath(new URL(`../../${relativePath}`, import.meta.url))
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

describe('local application development commands', () => {
  test('root package exposes combined and focused commands', () => {
    const packageJson = readJson('package.json')

    expect(packageJson.scripts.dev).toBe(
      'pnpm --parallel --filter @agent-book/api --filter @agent-book/web run dev'
    )
    expect(packageJson.scripts['dev:web']).toBe('pnpm --filter @agent-book/web dev')
    expect(packageJson.scripts['dev:api']).toBe('pnpm --filter @agent-book/api dev')
  })

  test('api watches its TypeScript entry point with an exact tsx version', () => {
    const packageJson = readJson('apps/api/package.json')

    expect(packageJson.scripts.dev).toBe('tsx watch src/server.ts')
    expect(packageJson.devDependencies.tsx).toBe('4.23.12')
  })
})
