import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const packageNames = [
  'research-core',
  'model-runtime',
  'tool-runtime',
  'knowledge-base',
  'persistence',
  'agent-langgraph',
  'evals'
]

describe.each(packageNames)('@agent-book/%s package shell', (packageName) => {
  test('has one public entry point and build configuration', () => {
    const packageRoot = resolve(repositoryRoot, 'packages', packageName)
    const packageJsonPath = resolve(packageRoot, 'package.json')

    expect(existsSync(packageJsonPath), `${packageName}/package.json should exist`).toBe(true)
    expect(existsSync(resolve(packageRoot, 'tsconfig.json'))).toBe(true)
    expect(existsSync(resolve(packageRoot, 'src/index.ts'))).toBe(true)

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    expect(packageJson.name).toBe(`@agent-book/${packageName}`)
    expect(packageJson.exports).toEqual({ '.': './dist/index.js' })
  })
})
