import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, test } from 'vitest'

const checkerUrl = new URL('../../scripts/check-chapter.mjs', import.meta.url)
const fixtureRoots: string[] = []
const requiredHeadings = [
  '本章目标',
  '完成后的可见结果',
  '前置条件',
  '起始代码检查点',
  '实现步骤',
  '每一步的验证方式',
  '常见错误',
  '最终验收',
  '延伸练习',
  '相关解释与参考'
]

afterEach(async () => {
  await Promise.all(fixtureRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function createChapterFixture (headings: string[]) {
  const root = await mkdtemp(join(tmpdir(), 'agent-book-chapter-'))
  fixtureRoots.push(root)
  await mkdir(join(root, 'docs', 'tutorials'), { recursive: true })
  await mkdir(join(root, 'docs', 'reference'), { recursive: true })
  await writeFile(
    join(root, 'docs', 'tutorials', '01-test-chapter.md'),
    `# 构建测试章节\n\n${headings.map((heading) => `## ${heading}\n\n已验证内容。`).join('\n\n')}\n`,
    'utf8'
  )
  await writeFile(
    join(root, 'docs', 'reference', 'chapter-map.md'),
    '| 章节 | 标题 | 阶段产物 | 起始 Tag | 结束 Tag |\n| --- | --- | --- | --- | --- |\n| 01 | 测试 | 结果 | `chapter-01-start` | `chapter-01-end` |\n',
    'utf8'
  )
  return root
}

test('rejects a chapter without final acceptance', async () => {
  expect(existsSync(fileURLToPath(checkerUrl)), 'scripts/check-chapter.mjs should exist').toBe(true)
  const root = await createChapterFixture(requiredHeadings.filter((heading) => heading !== '最终验收'))
  const { checkChapterStructure } = await import(checkerUrl.href)

  await expect(checkChapterStructure(root, '01')).resolves.toContain('Chapter 01 is missing heading: 最终验收')
})

test('accepts a complete chapter fixture', async () => {
  expect(existsSync(fileURLToPath(checkerUrl)), 'scripts/check-chapter.mjs should exist').toBe(true)
  const root = await createChapterFixture(requiredHeadings)
  const { checkChapterStructure } = await import(checkerUrl.href)

  await expect(checkChapterStructure(root, '01')).resolves.toEqual([])
})
