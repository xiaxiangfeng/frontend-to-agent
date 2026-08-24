import { expect, test } from 'vitest'

import { resolveChapterId } from '../../scripts/check-chapter.mjs'

test('ignores pnpm argument separators when reading the chapter id', () => {
  expect(resolveChapterId(['--', '01'])).toBe('01')
})
