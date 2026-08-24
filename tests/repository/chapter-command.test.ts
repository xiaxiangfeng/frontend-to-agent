import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

test('root package exposes the chapter check command', () => {
  const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url))
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  expect(packageJson.scripts['chapter:check']).toBe('node scripts/check-chapter.mjs')
})
