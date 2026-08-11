import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CardBulkConnectView from '@/domains/card/views/CardBulkConnectView.vue'
import { useAuthStore } from '@/domains/auth/stores/auth'

const push = vi.fn<(location: { name: string }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

const globalStubs = {
  CardPageLayout: {
    template: '<main data-card-page-layout><slot /><footer><slot name="footer" /></footer></main>',
  },
  MocaButton: {
    props: ['loading'],
    emits: ['click'],
    template: '<button :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
  },
}

describe('CardBulkConnectView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    push.mockClear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('로그인 사용자 닉네임을 표시하고 2.6초 뒤 연결 준비 상태로 전환한다', async () => {
    const pinia = createPinia()
    useAuthStore(pinia).setUser({
      nickname: '채수연',
      email: 'sooyeon@example.com',
      provider: 'google',
    })

    const wrapper = mount(CardBulkConnectView, {
      global: {
        plugins: [pinia],
        stubs: globalStubs,
      },
    })

    expect(wrapper.get('[data-card-page-layout]').classes()).toContain(
      '[&>div:last-child]:bg-transparent!',
    )
    expect(wrapper.get('[data-card-page-layout]').classes()).toContain(
      '[&>div:last-child]:border-t-0',
    )
    expect(wrapper.find('section > p.text-caption.font-semibold').exists()).toBe(false)
    expect(wrapper.text()).toContain('채수연님의 카드를')
    expect(wrapper.text()).toContain('보유 카드를 확인하고 있어요')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()

    vi.advanceTimersByTime(2600)
    await nextTick()

    expect(wrapper.text()).toContain('카드를 불러올 준비가 됐어요')
    expect(wrapper.get('button').text()).toBe('연결 시작하기')
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()

    await wrapper.get('button').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'card-connect-progress' })
  })
})
