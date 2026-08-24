import { describe, expect, it } from 'vitest'

import { resolvePackageManagerCommand } from '../../scripts/check-chapter.mjs'

describe('chapter check package manager command', () => {
  it('executes a Windows pnpm executable directly', () => {
    expect(resolvePackageManagerCommand('C:\\pnpm\\pnpm.exe', 'C:\\node\\node.exe', 'win32')).toEqual({
      command: 'C:\\pnpm\\pnpm.exe',
      args: ['test'],
      shell: false
    })
  })

  it('executes a JavaScript pnpm entry through Node', () => {
    expect(resolvePackageManagerCommand('/pnpm/pnpm.cjs', '/node/bin/node', 'linux')).toEqual({
      command: '/node/bin/node',
      args: ['/pnpm/pnpm.cjs', 'test'],
      shell: false
    })
  })

  it('uses the Windows shell for cmd shims', () => {
    expect(resolvePackageManagerCommand('C:\\pnpm\\pnpm.cmd', 'C:\\node\\node.exe', 'win32')).toEqual({
      command: 'C:\\pnpm\\pnpm.cmd',
      args: ['test'],
      shell: true
    })
  })
})
