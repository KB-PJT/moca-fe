import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomeView from '@/domains/home/views/HomeView.vue'

const push = vi.fn<(location: { name: string }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

describe('HomeView', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('카드 연결하기를 누르면 카드 연동 홈 화면으로 이동한다', async () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot name="action" /><slot /></section>' },
          RouterLink: { template: '<a><slot /></a>' },
          EmptyState: {
            emits: ['action'],
            template: '<button @click="$emit(\'action\')">카드 연결하기</button>',
          },
          MocaButton: { template: '<button><slot /></button>' },
        },
      },
    })

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '카드 연결하기')
      ?.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'card-connect' })
  })
})
