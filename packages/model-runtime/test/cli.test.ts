import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import type { ChatMessage } from '../src/index.ts'

const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url))

function runCli (...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, DASHSCOPE_API_KEY: '', DASHSCOPE_BASE_URL: '', QWEN_MODEL: '' }
  })
}

test('compares the same follow-up with and without the first turn', () => {
  const result = runCli('--compare')
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
  expect(result.stdout).toContain('模式 模拟')

  const requests = [...result.stdout.matchAll(/^messages (.+)$/gm)]
    .map(([, json]) => JSON.parse(json ?? '') as ChatMessage[])
  expect(requests.map((messages) => messages.map(({ role }) => role))).toEqual([
    ['system', 'user'],
    ['system', 'user'],
    ['system', 'user', 'assistant', 'user']
  ])
  expect(requests[2]?.slice(0, 2)).toEqual(requests[0])
  expect(requests[2]?.[2]?.content).toBe('收到，研究主题是 Vue 响应式。')
  expect(requests[2]?.at(-1)).toEqual(requests[1]?.at(-1))
  expect(result.stdout).toContain('这次请求没有提供研究主题。')
  expect(result.stdout).toContain('刚才的研究主题是 Vue 响应式。')
})

test('requires live credentials before sending a request', () => {
  const result = runCli('--live', '什么是 Vue 响应式？')

  expect(result.status).toBe(1)
  expect(result.stderr).toContain('请设置 DASHSCOPE_API_KEY、DASHSCOPE_BASE_URL 和 QWEN_MODEL')
  expect(result.stdout).toBe('')
})
