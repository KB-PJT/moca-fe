import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MypageView from '@/domains/mypage/views/MypageView.vue'

const push = vi.fn<(location: { name: string; query?: Record<string, string> }) => void>()
const cardQueryState = vi.hoisted(() => ({
  data: {
    activeCards: [{ userCardId: '1' }, { userCardId: '2' }],
    inactiveCards: [{ userCardId: '3' }],
  },
  isPending: false,
  isError: false,
  refetch: vi.fn<() => void>(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@tanstack/vue-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) =>
    queryKey[0] === 'cards'
      ? {
          data: ref(cardQueryState.data),
          isPending: ref(cardQueryState.isPending),
          isError: ref(cardQueryState.isError),
          refetch: cardQueryState.refetch,
        }
      : {
          data: ref({ locationPermissionGranted: true }),
        },
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
    cardQueryState.data = {
      activeCards: [{ userCardId: '1' }, { userCardId: '2' }],
      inactiveCards: [{ userCardId: '3' }],
    }
    cardQueryState.isPending = false
    cardQueryState.isError = false
    cardQueryState.refetch.mockClear()
    window.history.replaceState({}, '')
  })

  function mountCardStatus() {
    return shallowMount(MypageView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot /></section>' },
          ListItem: {
            props: ['title', 'description'],
            template: '<div>{{ title }} {{ description }}<slot /></div>',
          },
        },
      },
    })
  }

  it('카드 조회 중에는 0개 대신 로딩 상태를 표시한다', () => {
    cardQueryState.isPending = true

    expect(mountCardStatus().text()).toContain('연결 카드 조회 중')
  })

  it('카드 조회 실패 시 오류를 표시하고 재조회할 수 있다', async () => {
    cardQueryState.isError = true
    const wrapper = mountCardStatus()

    expect(wrapper.text()).toContain('카드 조회 실패')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('다시 시도'))
      ?.trigger('click')

    expect(cardQueryState.refetch).toHaveBeenCalledOnce()
  })

  it('카드 조회 성공 후 활성 카드가 없으면 0개를 표시한다', () => {
    cardQueryState.data = { activeCards: [], inactiveCards: [] }

    const text = mountCardStatus().text()
    expect(text).toContain('연결 카드 0개')
    expect(text).toContain('등록한 카드 0개')
  })

  it('내 카드 관리에 마이페이지 진입 정보를 전달한다', async () => {
    const wrapper = shallowMount(MypageView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot /></section>' },
          ListItem: {
            props: ['title', 'description'],
            emits: ['click'],
            template:
              '<button @click="$emit(\'click\')">{{ title }} {{ description }}<slot /></button>',
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
    expect(wrapper.text()).toContain('연결 카드 2개')
    expect(wrapper.text()).toContain('등록한 카드 2개')
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
