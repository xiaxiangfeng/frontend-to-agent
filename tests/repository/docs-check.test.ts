import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const checkerUrl = new URL('../../scripts/check-docs.mjs', import.meta.url)

test('documentation checker accepts the repository documentation', async () => {
  expect(existsSync(fileURLToPath(checkerUrl)), 'scripts/check-docs.mjs should exist').toBe(true)

  const { checkDocumentation } = await import(checkerUrl.href)

  await expect(checkDocumentation(repositoryRoot)).resolves.toEqual([])
})
