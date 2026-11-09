import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

function repositoryPath (relativePath: string) {
  return fileURLToPath(new URL(`../../${relativePath}`, import.meta.url))
}

function requiredText (relativePath: string) {
  const filePath = repositoryPath(relativePath)
  expect(existsSync(filePath), `${relativePath} should exist`).toBe(true)
  return readFileSync(filePath, 'utf8')
}

describe('local documentation site', () => {
  test('root package exposes exact VitePress commands', () => {
    const packageJson = JSON.parse(requiredText('package.json'))

    expect(packageJson.scripts['docs:dev']).toBe('vitepress dev docs')
    expect(packageJson.scripts['docs:build']).toBe('vitepress build docs')
    expect(packageJson.scripts['docs:preview']).toBe('vitepress preview docs')
  })

  test('root package pins a Vite version compatible with Vitest', () => {
    const packageJson = JSON.parse(requiredText('package.json'))

    expect(packageJson.devDependencies.vitepress).toBe('2.0.0-alpha.19')
    expect(packageJson.devDependencies.vite).toBe('8.2.2')
  })

  test('allows only the esbuild install script required by the toolchain', () => {
    const workspace = requiredText('pnpm-workspace.yaml')

    expect(workspace).toMatch(/allowBuilds:\r?\n\s+esbuild: true\s*$/)
  })
  test('site config fixes the port and exposes all four documentation types', () => {
    const config = requiredText('docs/.vitepress/config.mts')

    expect(config).toContain("lang: 'zh-CN'")
    expect(config).toContain('port: 5174')
    expect(config).toContain('strictPort: true')
    for (const section of ['教程', '原理', 'How-to', '参考']) {
      expect(config).toContain(`text: '${section}'`)
    }
  })

  test('landing page links to the first chapter and generated output is ignored', () => {
    const index = requiredText('docs/index.md')
    const gitignore = requiredText('.gitignore')

    expect(index).toContain('/tutorials/01-from-frontend-to-agent')
    expect(gitignore).toContain('docs/.vitepress/cache/')
    expect(gitignore).toContain('docs/.vitepress/dist/')
  })
})
