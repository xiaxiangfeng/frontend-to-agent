import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

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

function isChapterId (chapterId) {
  const numericId = Number(chapterId)
  return /^\d{2}$/.test(chapterId) && numericId >= 1 && numericId <= 22
}

export function resolveChapterId (args) {
  return args.find((argument) => argument !== '--') ?? ''
}

export async function checkChapterStructure (repositoryRoot, chapterId) {
  if (!isChapterId(chapterId)) return ['Chapter id must be between 01 and 22']

  const errors = []
  const tutorialsRoot = resolve(repositoryRoot, 'docs', 'tutorials')
  const tutorialNames = existsSync(tutorialsRoot) ? await readdir(tutorialsRoot) : []
  const matchingNames = tutorialNames.filter((name) => name.startsWith(`${chapterId}-`) && name.endsWith('.md'))

  if (matchingNames.length === 0) return [`Chapter ${chapterId} document not found`]
  if (matchingNames.length > 1) return [`Chapter ${chapterId} has multiple tutorial documents`]

  const tutorial = await readFile(resolve(tutorialsRoot, matchingNames[0]), 'utf8')
  for (const heading of requiredHeadings) {
    if (!tutorial.includes(`## ${heading}`)) errors.push(`Chapter ${chapterId} is missing heading: ${heading}`)
  }

  const chapterMapPath = resolve(repositoryRoot, 'docs', 'reference', 'chapter-map.md')
  if (!existsSync(chapterMapPath)) {
    errors.push('Chapter map not found')
    return errors
  }

  const chapterMap = await readFile(chapterMapPath, 'utf8')
  const chapterRow = chapterMap.split(/\r?\n/).find((line) => line.startsWith(`| ${chapterId} |`))
  const startTag = `chapter-${chapterId}-start`
  const endTag = `chapter-${chapterId}-end`

  if (!chapterRow) {
    errors.push(`Chapter ${chapterId} is missing from chapter map`)
  } else if (!chapterRow.includes(`\`${startTag}\``) || !chapterRow.includes(`\`${endTag}\``)) {
    errors.push(`Chapter ${chapterId} map must use ${startTag} and ${endTag}`)
  }

  return errors
}

function hasGitTag (repositoryRoot, tagName) {
  const result = spawnSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tagName}`], {
    cwd: repositoryRoot,
    stdio: 'ignore'
  })
  return result.status === 0
}

function runProjectTests (repositoryRoot) {
  const pnpmEntry = process.env.npm_execpath
  if (!pnpmEntry) return { status: 1, message: 'Run chapter:check through pnpm so npm_execpath is available' }

  const result = spawnSync(process.execPath, [pnpmEntry, 'test'], {
    cwd: repositoryRoot,
    stdio: 'inherit'
  })
  return { status: result.status ?? 1 }
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : undefined

if (invokedFile === currentFile) {
  const repositoryRoot = process.cwd()
  const chapterId = resolveChapterId(process.argv.slice(2))
  const errors = await checkChapterStructure(repositoryRoot, chapterId)

  if (errors.length > 0) {
    for (const error of errors) console.error(error)
    process.exitCode = 1
  } else {
    const startTag = `chapter-${chapterId}-start`
    if (!hasGitTag(repositoryRoot, startTag)) {
      console.error(`Start tag ${startTag} not found`)
      process.exitCode = 1
    } else {
      const testResult = runProjectTests(repositoryRoot)
      if (testResult.message) console.error(testResult.message)
      process.exitCode = testResult.status
      if (testResult.status === 0) console.log(`Chapter ${chapterId} checks passed`)
    }
  }
}
