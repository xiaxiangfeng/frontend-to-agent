import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const configUrl = new URL('../../tsconfig.base.json', import.meta.url)
const configPath = fileURLToPath(configUrl)

describe('shared TypeScript configuration', () => {
  test('enables the strict production safety options', () => {
    expect(existsSync(configPath), 'tsconfig.base.json should exist').toBe(true)

    const config = JSON.parse(readFileSync(configPath, 'utf8'))

    expect(config.compilerOptions).toMatchObject({
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      moduleResolution: 'Bundler'
    })
  })
})
