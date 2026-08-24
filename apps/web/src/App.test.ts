import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'

import App from './App.vue'

test('introduces the AI research assistant', () => {
  const wrapper = mount(App)

  expect(wrapper.get('h1').text()).toBe('AI 技术研究助手')
})
