import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const documentationSections = ['tutorials', 'explanations', 'how-to', 'reference']
const requiredTutorialHeadings = [
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

async function findMarkdownFiles (directory) {
  if (!existsSync(directory)) return []

  const entries = await readdir(directory, { withFileTypes: true })
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(directory, entry.name)
    if (entry.isDirectory()) return findMarkdownFiles(entryPath)
    return extname(entry.name) === '.md' ? [entryPath] : []
  }))

  return nestedFiles.flat()
}

function validateRelativeLinks (filePath, content) {
  const errors = []
  const links = content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)

  for (const match of links) {
    const href = match[1]?.trim()
    if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) continue

    const target = decodeURIComponent(href.split('#')[0] ?? '')
    if (!target) continue

    const targetPath = resolve(dirname(filePath), target)
    if (!existsSync(targetPath)) errors.push(`${filePath}: broken relative link ${href}`)
  }

  return errors
}

export async function checkDocumentation (repositoryRoot) {
  const docsRoot = resolve(repositoryRoot, 'docs')
  const errors = []
  const sectionFiles = []

  for (const section of documentationSections) {
    const sectionRoot = resolve(docsRoot, section)
    if (!existsSync(resolve(sectionRoot, 'README.md'))) {
      errors.push(`${section}: README.md is missing`)
      continue
    }
    sectionFiles.push(...await findMarkdownFiles(sectionRoot))
  }

  const templatePath = resolve(docsRoot, 'tutorials', '_chapter-template.md')
  if (!existsSync(templatePath)) {
    errors.push('tutorials: _chapter-template.md is missing')
  } else {
    const template = await readFile(templatePath, 'utf8')
    for (const heading of requiredTutorialHeadings) {
      if (!template.includes(`## ${heading}`)) errors.push(`chapter template: missing heading ${heading}`)
    }
  }

  const tutorialFiles = sectionFiles.filter((filePath) => {
    const fileName = filePath.slice(filePath.lastIndexOf('\\') + 1).slice(filePath.lastIndexOf('/') + 1)
    return /^\d{2}-.*\.md$/.test(fileName)
  })

  for (const tutorialPath of tutorialFiles) {
    const tutorial = await readFile(tutorialPath, 'utf8')
    for (const heading of requiredTutorialHeadings) {
      if (!tutorial.includes(`## ${heading}`)) errors.push(`${tutorialPath}: missing heading ${heading}`)
    }
  }

  for (const filePath of sectionFiles) {
    const content = await readFile(filePath, 'utf8')
    if (/\b(?:TODO|TBD|PLACEHOLDER)\b/.test(content)) errors.push(`${filePath}: unresolved placeholder`)
    errors.push(...validateRelativeLinks(filePath, content))
  }

  const chapterMapPath = resolve(docsRoot, 'reference', 'chapter-map.md')
  if (!existsSync(chapterMapPath)) {
    errors.push('reference: chapter-map.md is missing')
  } else {
    const chapterMap = await readFile(chapterMapPath, 'utf8')
    const chapterIds = [...chapterMap.matchAll(/^\| (\d{2}) \|/gm)].map((match) => match[1])
    const expectedIds = Array.from({ length: 22 }, (_, index) => String(index + 1).padStart(2, '0'))
    if (chapterIds.join(',') !== expectedIds.join(',')) errors.push('chapter map: expected chapters 01 through 22 exactly once')
  }

  return errors
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : undefined

if (invokedFile === currentFile) {
  const errors = await checkDocumentation(process.cwd())
  if (errors.length > 0) {
    for (const error of errors) console.error(error)
    process.exitCode = 1
  } else {
    console.log('Documentation checks passed')
  }
}
