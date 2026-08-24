import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'

export default neostandard({
  ts: true,
  noJsx: true,
  ignores: resolveIgnoresFromGitignore()
})
