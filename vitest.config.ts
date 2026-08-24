import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'tests/**/*.test.{ts,mjs}',
            'apps/**/test/**/*.test.{ts,tsx}',
            'packages/**/test/**/*.test.{ts,tsx}'
          ]
        }
      },
      'apps/web/vite.config.ts'
    ],
    include: [
      'tests/**/*.test.{ts,mjs}',
      'apps/**/test/**/*.test.{ts,tsx}',
      'apps/**/src/**/*.test.{ts,tsx}',
      'packages/**/test/**/*.test.{ts,tsx}'
    ]
  }
})
