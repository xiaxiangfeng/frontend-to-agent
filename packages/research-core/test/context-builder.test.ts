import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { assembleContext, buildContext, type ContextRequest } from '../src/context-builder.ts'

const query = { systemPrompt: '根据提供的资料回答。', goal: '比较项目 A 和 B', question: '两个项目怎么导入文档？' }
const tool = { id: 'reader', kind: 'tool', text: '按资料 ID 读取段落。', topics: ['import'] } as const
const evidence = { id: 'import-a', kind: 'evidence', text: '项目 A 支持导入 PDF。', topics: ['import'] } as const
const history = {
  id: 'notes',
  kind: 'history',
  text: '上轮讨论了如何记录出处和未核实项。'.repeat(100),
  summary: '保留出处和未核实项。',
  topics: ['import']
} as const
const optional = { id: 'long-note', kind: 'history', text: '过长的研究记录。'.repeat(100), topics: ['import'] } as const
const unrelated = { id: 'citation-a', kind: 'evidence', text: '项目 A 支持段落链接。', topics: ['citation'] } as const

function input (maxInputBytes: number): ContextRequest {
  return {
    ...query,
    topic: 'import',
    items: [history, optional, unrelated, tool, evidence],
    requiredIds: [tool.id, evidence.id],
    maxInputBytes
  }
}

test('keeps required inputs, summarizes long related notes and explains dropped items', () => {
  const summarized = { ...history, text: history.summary }
  const expected = assembleContext(query, [tool, evidence, summarized])
  const result = buildContext(input(expected.inputBytes))

  expect(result.messages).toEqual(expected.messages)
  expect(result.inputBytes).toBe(Buffer.byteLength(JSON.stringify(result.messages), 'utf8'))
  expect(result.inputBytes).toBeLessThan(assembleContext(query, input(result.inputBytes).items).inputBytes)
  expect(result.decisions).toEqual([
    { id: history.id, action: 'summarized', reason: 'budget' },
    { id: optional.id, action: 'skipped', reason: 'budget' },
    { id: unrelated.id, action: 'skipped', reason: 'unrelated' },
    { id: tool.id, action: 'included', reason: 'required' },
    { id: evidence.id, action: 'included', reason: 'required' }
  ])
})

test('rejects a budget that cannot fit the required context', () => {
  const minimum = assembleContext(query, [tool, evidence]).inputBytes

  expect(() => buildContext(input(minimum - 1))).toThrow(/必需上下文超出输入预算/)
})

test('reports missing required evidence before producing a request', () => {
  expect(() => buildContext({ ...input(10000), requiredIds: ['import-b'] }))
    .toThrow('缺少必需上下文 import-b。')
})

test('the offline CLI keeps the relevant tool descriptions and both README excerpts for each question', () => {
  const cli = fileURLToPath(new URL('../src/context-cli.ts', import.meta.url))
  const run = spawnSync(process.execPath, [cli, '--messages'], { encoding: 'utf8' })

  expect(run.status, run.stderr).toBe(0)
  const { mode, maxInputBytes, comparisons } = JSON.parse(run.stdout)
  expect(mode).toBe('fixture')
  expect(comparisons).toHaveLength(2)

  const expectedByQuestion = [
    ['read-document', 'list-import-formats', 'a-import', 'b-import'],
    ['read-document', 'read-citation-example', 'a-citation', 'b-citation']
  ]
  for (const [index, comparison] of comparisons.entries()) {
    expect(comparison.selectedInputBytes).toBeLessThan(comparison.allInputBytes)
    expect(comparison.selectedInputBytes).toBeLessThanOrEqual(maxInputBytes)
    expect(comparison.selectedInputBytes).toBe(Buffer.byteLength(JSON.stringify(comparison.selectedMessages), 'utf8'))

    const data = JSON.parse(comparison.selectedMessages[1].content)
    expect(data.question).toBe(comparison.question)
    expect(data.context.filter(({ kind }: { kind: string }) => kind !== 'history').map(({ id }: { id: string }) => id))
      .toEqual(expectedByQuestion[index])
  }
})
