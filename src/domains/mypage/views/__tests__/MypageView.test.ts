import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MypageView from '@/domains/mypage/views/MypageView.vue'

const push = vi.fn<(location: { name: string; query?: Record<string, string> }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => ({
    data: ref({
      connectedCardCount: 4,
      locationPermissionGranted: true,
      lastSyncedAt: '방금 전',
    }),
  }),
  useQueryClient: () => ({
    setQueryData: vi.fn<() => void>(),
  }),
  useMutation: () => ({
    mutateAsync: vi.fn<() => Promise<void>>(),
    isPending: ref(false),
  }),
}))

vi.mock('@/domains/auth/stores/auth', () => ({
  useAuthStore: () => ({
    user: { nickname: '테스트' },
    clearSession: vi.fn<() => void>(),
  }),
}))

describe('MypageView', () => {
  beforeEach(() => {
    push.mockClear()
    window.history.replaceState({}, '')
  })

  it('내 카드 관리에 마이페이지 진입 정보를 전달한다', async () => {
    const wrapper = shallowMount(MypageView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot /></section>' },
          ListItem: {
            props: ['title'],
            emits: ['click'],
            template: '<button @click="$emit(\'click\')">{{ title }}<slot /></button>',
          },
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
          DialogFooter: { template: '<div><slot /></div>' },
          DialogClose: { template: '<div><slot /></div>' },
          MocaButton: { template: '<button><slot /></button>' },
          Switch: { template: '<span />' },
        },
      },
    })

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('내 카드 관리'))
      ?.trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'card-manage',
      query: { from: 'mypage' },
    })
  })

  it('문의하기 화면으로 이동한다', async () => {
    const wrapper = shallowMount(MypageView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot /></section>' },
          ListItem: {
            props: ['title'],
            emits: ['click'],
            template: '<button @click="$emit(\'click\')">{{ title }}<slot /></button>',
          },
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
          DialogFooter: { template: '<div><slot /></div>' },
          DialogClose: { template: '<div><slot /></div>' },
          MocaButton: { template: '<button><slot /></button>' },
          Switch: { template: '<span />' },
        },
      },
    })

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('문의하기'))
      ?.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'mypage-inquiry' })
  })

  it('문의 접수 상태로 진입하면 완료 토스트를 한 번 표시한다', async () => {
    window.history.replaceState({ inquirySubmitted: true }, '')

    const wrapper = shallowMount(MypageView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot /></section>' },
          ListItem: { template: '<div />' },
          Dialog: { template: '<div />' },
          MocaButton: { template: '<button />' },
          Switch: { template: '<span />' },
        },
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.get('[role="status"]').text()).toBe('문의가 접수되었습니다.')
    expect(window.history.state.inquirySubmitted).toBeUndefined()
  })
})
