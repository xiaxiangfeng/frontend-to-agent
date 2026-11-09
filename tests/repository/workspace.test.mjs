import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'vitest'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))

function requiredText (relativePath) {
  const absolutePath = fileURLToPath(new URL(relativePath, `${new URL('../../', import.meta.url)}`))
  assert.equal(existsSync(absolutePath), true, `${relativePath} should exist`)
  return readFileSync(absolutePath, 'utf8')
}

test('root package exposes the workspace commands', () => {
  const packageJson = JSON.parse(requiredText('package.json'))

  assert.equal(packageJson.private, true)
  assert.match(packageJson.packageManager, /^pnpm@11\./)
  assert.match(packageJson.engines.node, /24/)
  assert.deepEqual(
    Object.keys(packageJson.scripts).sort(),
    [
      'build',
      'chapter:check',
      'dev',
      'dev:api',
      'dev:web',
      'docs:build',
      'docs:check',
      'docs:dev',
      'docs:preview',
      'lint',
      'model:ask',
      'test',
      'typecheck'
    ]
  )
})

test('pnpm workspace includes applications and packages', () => {
  const workspace = requiredText('pnpm-workspace.yaml')

  assert.match(workspace, /- ['"]apps\/\*['"]?/)
  assert.match(workspace, /- ['"]packages\/\*['"]?/)
})

test('example environment is safe and complete', () => {
  const example = requiredText('.env.example')
  const requiredVariables = [
    'DASHSCOPE_API_KEY',
    'DASHSCOPE_BASE_URL',
    'QWEN_MODEL',
    'QWEN_EMBEDDING_MODEL',
    'APP_ACCESS_TOKEN',
    'DATABASE_URL',
    'QDRANT_URL',
    'RUN_LIVE_TESTS'
  ]

  for (const variable of requiredVariables) {
    assert.match(example, new RegExp(`^${variable}=`, 'm'))
  }

  assert.doesNotMatch(example, /sk-[A-Za-z0-9]{12,}/)
  assert.doesNotMatch(example, /DASHSCOPE_API_KEY=\S+/)
})

assert.ok(repositoryRoot)
