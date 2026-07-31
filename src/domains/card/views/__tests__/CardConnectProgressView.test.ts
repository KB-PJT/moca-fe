import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CardConnectProgressView from '@/domains/card/views/CardConnectProgressView.vue'

const push = vi.fn<(location: { name: string }) => void>()
const replace = vi.fn<(location: { name: string }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
}))

const globalStubs = {
  CardPageLayout: {
    emits: ['back'],
    template: '<main><button data-testid="back" @click="$emit(\'back\')" /><slot /></main>',
  },
}

describe('CardConnectProgressView', () => {
  it('뒤로가기를 누르면 카드 탐색 화면으로 이동한다', async () => {
    const wrapper = mount(CardConnectProgressView, {
      global: {
        plugins: [createPinia()],
        stubs: globalStubs,
      },
    })

    await wrapper.get('[data-testid="back"]').trigger('click')

    expect(replace).toHaveBeenCalledWith({ name: 'card-bulk-connect' })
    wrapper.unmount()
  })
})
