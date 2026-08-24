import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const docsRoot = resolve(repositoryRoot, 'docs')

describe('Diátaxis documentation structure', () => {
  test.each(['tutorials', 'explanations', 'how-to', 'reference'])('provides the %s section', (section) => {
    expect(existsSync(resolve(docsRoot, section, 'README.md'))).toBe(true)
  })

  test('chapter template contains every required learning checkpoint', () => {
    const templatePath = resolve(docsRoot, 'tutorials', '_chapter-template.md')
    expect(existsSync(templatePath), '_chapter-template.md should exist').toBe(true)

    const template = readFileSync(templatePath, 'utf8')
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

    for (const heading of requiredHeadings) {
      expect(template).toContain(`## ${heading}`)
    }
  })

  test('chapter map covers chapters 01 through 22 exactly once', () => {
    const chapterMapPath = resolve(docsRoot, 'reference', 'chapter-map.md')
    expect(existsSync(chapterMapPath), 'chapter-map.md should exist').toBe(true)

    const chapterMap = readFileSync(chapterMapPath, 'utf8')
    const chapterIds = [...chapterMap.matchAll(/^\| (\d{2}) \|/gm)].map((match) => match[1])
    const expectedIds = Array.from({ length: 22 }, (_, index) => String(index + 1).padStart(2, '0'))

    expect(chapterIds).toEqual(expectedIds)
  })
})
