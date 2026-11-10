import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const developmentPackages = new Set(['research-core', 'model-runtime', 'persistence'])
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
    const entry = developmentPackages.has(packageName)
      ? { types: './src/index.ts', development: './src/index.ts', default: './dist/index.js' }
      : './dist/index.js'
    expect(packageJson.exports).toEqual({ '.': entry })
  })
})
