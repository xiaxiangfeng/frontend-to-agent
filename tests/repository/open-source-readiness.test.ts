import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))

function requiredText (relativePath: string) {
  const filePath = fileURLToPath(new URL(`../../${relativePath}`, import.meta.url))
  expect(existsSync(filePath), `${relativePath} should exist`).toBe(true)
  return readFileSync(filePath, 'utf8')
}

function git (...args: string[]) {
  return execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8'
  }).trim()
}

describe('open-source repository readiness', () => {
  test('publishes reader-facing files while keeping agent plans local-only', () => {
    for (const relativePath of ['README.md', 'ROADMAP.md', 'LICENSE', 'LICENSE-DOCS.md', 'CONTRIBUTING.md']) {
      requiredText(relativePath)
    }

    const gitignore = requiredText('.gitignore')
    const vitepressConfig = requiredText('docs/.vitepress/config.mts')

    expect(gitignore).toContain('docs/superpowers/')
    expect(vitepressConfig).toContain("srcExclude: ['superpowers/**']")
    expect(git('check-ignore', 'docs/superpowers/probe.md')).toBe('docs/superpowers/probe.md')
    expect(git('ls-files', 'docs/superpowers')).toBe('')
  })

  test('uses public package metadata without enabling npm publication', () => {
    const packageJson = JSON.parse(requiredText('package.json'))

    expect(packageJson.name).toBe('frontend-to-agent')
    expect(packageJson.description).toBe('面向前端开发者的中文 Agent 工程实战教程与研究助手示例')
    expect(packageJson.license).toBe('MIT')
    expect(packageJson.private).toBe(true)
  })

  test('documents current status, startup commands and dual licensing', () => {
    const readme = requiredText('README.md')
    const documentationLicense = requiredText('LICENSE-DOCS.md')

    for (const expected of [
      '持续更新中',
      'pnpm install --frozen-lockfile',
      'pnpm dev',
      'pnpm docs:dev',
      'MIT License',
      'CC BY-NC-SA 4.0'
    ]) expect(readme).toContain(expected)

    expect(documentationLicense).toContain('禁止商业使用')
    expect(documentationLicense).toContain('https://creativecommons.org/licenses/by-nc-sa/4.0/')
  })

  test('contains no internal plan history and preserves distinct chapter tags', () => {
    expect(git('log', '--all', '--format=%H', '--', 'docs/superpowers')).toBe('')
    expect(git('rev-list', '--objects', '--all')).not.toContain('docs/superpowers')

    const start = git('rev-parse', 'chapter-01-start')
    const end = git('rev-parse', 'chapter-01-end')
    expect(start).not.toBe(end)
  })
})
