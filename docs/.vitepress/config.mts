import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '前端转 Agent 开发',
  srcExclude: ['superpowers/**'],
  description: '面向前端开发者的 Agent 工程实战教程',
  vite: {
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true
    }
  },
  themeConfig: {
    nav: [
      { text: '教程', link: '/tutorials/01-from-frontend-to-agent' },
      { text: '原理', link: '/explanations/agent-vs-workflow' },
      { text: 'How-to', link: '/how-to/author-a-chapter' },
      { text: '参考', link: '/reference/chapter-map' }
    ],
    sidebar: {
      '/tutorials/': [
        {
          text: '主线教程',
          items: [
            { text: '阅读说明', link: '/tutorials/README' },
            { text: '第 1 章：从前端应用走向 Agent 应用', link: '/tutorials/01-from-frontend-to-agent' },
            { text: '第 2 章：用 TypeScript 调用千问 API', link: '/tutorials/02-call-qwen-with-typescript' },
            { text: '第 3 章：保存会话，让 A 和 B 各自续聊', link: '/tutorials/03-persist-conversations' },
            { text: '第 4 章：设计可维护的 System Prompt', link: '/tutorials/04-maintainable-system-prompt' }
          ]
        }
      ],
      '/explanations/': [
        {
          text: '原理解释',
          items: [
            { text: '阅读说明', link: '/explanations/README' },
            { text: 'Agent、聊天与 Workflow 的边界', link: '/explanations/agent-vs-workflow' }
          ]
        }
      ],
      '/how-to/': [
        {
          text: '操作指南',
          items: [
            { text: '阅读说明', link: '/how-to/README' },
            { text: '在本地启动应用与教程站', link: '/how-to/run-project-locally' },
            { text: '编写并验收一章教程', link: '/how-to/author-a-chapter' }
          ]
        }
      ],
      '/reference/': [
        {
          text: '参考资料',
          items: [
            { text: '阅读说明', link: '/reference/README' },
            { text: '术语表', link: '/reference/glossary' },
            { text: '章节检查点', link: '/reference/chapter-map' },
            { text: '验证版本', link: '/reference/versions' }
          ]
        }
      ]
    },
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    }
  }
})
