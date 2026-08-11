import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CardConnectCompleteView from '@/domains/card/views/CardConnectCompleteView.vue'

const push = vi.fn<(location: { name: string }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

const globalStubs = {
  CardPageLayout: {
    template: '<main><slot /><footer><slot name="footer" /></footer></main>',
  },
  MocaButton: {
    emits: ['click'],
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
}

describe('CardConnectCompleteView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('실패한 카드사를 재연결하면 성공 상태로 전환한다', async () => {
    const wrapper = mount(CardConnectCompleteView, {
      global: {
        plugins: [createPinia()],
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('연결 성공 8개')
    expect(wrapper.text()).toContain('재연결 필요 1개')
    expect(wrapper.findAll('li')).toHaveLength(9)
    expect(wrapper.get('[data-connect-complete-layout]').classes()).toEqual(
      expect.arrayContaining(['[&>main]:flex', '[&>main]:flex-col', '[&>main]:overflow-hidden']),
    )
    expect(wrapper.get('[data-connection-complete-results-scroll]').classes()).toEqual(
      expect.arrayContaining(['scrollbar-line', 'min-h-0', 'flex-1', 'overflow-y-auto']),
    )

    await wrapper.get('li button').trigger('click')
    expect(wrapper.text()).toContain('연결 중')

    vi.advanceTimersByTime(1400)
    await nextTick()

    expect(wrapper.text()).toContain('연결 성공 9개')
    expect(wrapper.text()).not.toContain('재연결 필요')
  })
})
