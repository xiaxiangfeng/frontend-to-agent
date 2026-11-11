import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { ChatModel, ModelReply } from '@agent-book/model-runtime'
import { expect, test, vi } from 'vitest'
import { createResearchPlan } from '../src/research-plan.ts'
import { reviewPlan, reviewRequest } from '../src/review-fixture.ts'

function simulateReply (text: string, finishReason = 'stop') {
  const reply: ModelReply = { text, elapsedMs: 12, usage: null, finishReason }
  return { complete: vi.fn<ChatModel['complete']>().mockResolvedValue(reply) }
}

test('uses a versioned system instruction and returns a validated plan', async () => {
  const model = simulateReply(JSON.stringify(reviewPlan))

  await expect(createResearchPlan(model, reviewRequest)).resolves.toEqual({
    plan: reviewPlan,
    promptVersion: 'research-plan.v1',
    elapsedMs: 12,
    usage: null
  })

  const request = model.complete.mock.calls[0]
  expect(model.complete).toHaveBeenCalledTimes(1)
  expect(request?.[0]).toEqual([
    { role: 'system', content: expect.stringContaining('JSON') },
    { role: 'user', content: JSON.stringify(reviewRequest) }
  ])
  expect(request?.[0][0]?.content).not.toContain(reviewRequest.goal)
  expect(request?.[1]).toEqual({ responseFormat: 'json', maxOutputTokens: 1024 })
})

test.each([
  ['不是 JSON', '请先阅读文档。', /研究计划不是有效的 JSON/],
  ['没有研究问题', JSON.stringify({ ...reviewPlan, questions: [] }), /questions/],
  ['没有交付物', JSON.stringify({ ...reviewPlan, deliverable: ' ' }), /deliverable/],
  ['没有完成条件', JSON.stringify({
    ...reviewPlan,
    steps: [{ action: '阅读项目说明', sourceIds: ['a-readme'] }]
  }), /steps\[0\]\.doneWhen/],
  ['来源超出范围', JSON.stringify({
    ...reviewPlan,
    steps: [{ action: '查找项目介绍', sourceIds: ['web-search'], doneWhen: '找到三篇文章' }]
  }), /steps\[0\]\.sourceIds.*未授权/]
])('rejects invalid plan output (%s)', async (_scenario, text, error) => {
  await expect(createResearchPlan(simulateReply(text), reviewRequest)).rejects.toThrow(error)
})

test('rejects a response that reached its output limit', async () => {
  await expect(createResearchPlan(simulateReply(JSON.stringify(reviewPlan), 'length'), reviewRequest))
    .rejects.toThrow(/研究计划达到模型输出上限/)
})

test('prints the validated comparison plan with the offline CLI', () => {
  const cli = fileURLToPath(new URL('../src/plan-cli.ts', import.meta.url))
  const result = spawnSync(process.execPath, ['--conditions=development', cli], { encoding: 'utf8' })

  expect(result.status).toBe(0)
  expect(result.stderr).toBe('')
  expect(JSON.parse(result.stdout)).toEqual({
    mode: 'fixture',
    plan: reviewPlan,
    promptVersion: 'research-plan.v1',
    elapsedMs: 0,
    usage: null
  })
})
