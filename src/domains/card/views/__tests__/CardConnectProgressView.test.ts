import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CardConnectProgressView from '@/domains/card/views/CardConnectProgressView.vue'
import { useAuthStore } from '@/domains/auth/stores/auth'

const push = vi.fn<(location: { name: string }) => void>()
const replace = vi.fn<(location: { name: string }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
}))

const globalStubs = {
  CardPageLayout: {
    props: ['title'],
    emits: ['back'],
    template:
      '<main><header data-app-bar-title>{{ title }}</header><button data-testid="back" @click="$emit(\'back\')" /><slot /></main>',
  },
}

describe('CardConnectProgressView', () => {
  it('뒤로가기를 누르면 카드 탐색 화면으로 이동한다', async () => {
    const pinia = createPinia()
    useAuthStore(pinia).setUser({
      nickname: '채수연',
      email: 'sooyeon@example.com',
      provider: 'google',
    })

    const wrapper = mount(CardConnectProgressView, {
      global: {
        plugins: [pinia],
        stubs: globalStubs,
      },
    })

    await nextTick()

    expect(wrapper.get('[data-app-bar-title]').text()).toBe('카드 연결')
    expect(wrapper.text()).toContain('채수연님의 카드를')
    expect(wrapper.text()).toContain('0개 / 9개 카드사 확인')
    expect(wrapper.text()).toContain('초 남음')
    expect(wrapper.get('[data-connect-progress-layout]').classes()).toEqual(
      expect.arrayContaining(['[&>main]:flex', '[&>main]:flex-col', '[&>main]:overflow-hidden']),
    )
    expect(wrapper.get('[data-connection-results-scroll]').classes()).toEqual(
      expect.arrayContaining(['scrollbar-line', 'min-h-0', 'flex-1', 'overflow-y-auto']),
    )

    await wrapper.get('[data-testid="back"]').trigger('click')

    expect(replace).toHaveBeenCalledWith({ name: 'card-bulk-connect' })
    wrapper.unmount()
  })
})
