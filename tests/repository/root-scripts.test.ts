import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

test('root typecheck delegates to each workspace implementation', () => {
  const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url))
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  expect(packageJson.scripts.typecheck).toBe('pnpm -r --if-present typecheck')
})
