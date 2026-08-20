import { flushPromises, shallowMount } from '@vue/test-utils'
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
const summaryQueryState = vi.hoisted(() => ({
  data: { locationRecommendationEnabled: true },
  isPending: false,
  isError: false,
  refetch: vi.fn<() => void>(),
}))
const benefitPreferenceQueryState = vi.hoisted(() => ({
  data: 'IMMEDIATE_SAVINGS' as string,
  isPending: false,
  isError: false,
  refetch: vi.fn<() => void>(),
}))
const locationMutationState = vi.hoisted(() => ({
  mutateAsync: vi.fn<(enabled: boolean) => Promise<void>>(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@tanstack/vue-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'cards') {
      return {
        data: ref(cardQueryState.data),
        isPending: ref(cardQueryState.isPending),
        isError: ref(cardQueryState.isError),
        refetch: cardQueryState.refetch,
      }
    }
    if (queryKey[0] === 'auth') {
      return {
        data: ref(benefitPreferenceQueryState.data),
        isPending: ref(benefitPreferenceQueryState.isPending),
        isError: ref(benefitPreferenceQueryState.isError),
        refetch: benefitPreferenceQueryState.refetch,
      }
    }
    return {
      data: ref(summaryQueryState.data),
      isPending: ref(summaryQueryState.isPending),
      isError: ref(summaryQueryState.isError),
      refetch: summaryQueryState.refetch,
    }
  },
  useQueryClient: () => ({
    setQueryData: vi.fn<() => void>(),
  }),
  useMutation: () => ({
    mutateAsync: locationMutationState.mutateAsync,
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
    summaryQueryState.data = { locationRecommendationEnabled: true }
    summaryQueryState.isPending = false
    summaryQueryState.isError = false
    summaryQueryState.refetch.mockClear()
    benefitPreferenceQueryState.data = 'IMMEDIATE_SAVINGS'
    benefitPreferenceQueryState.isPending = false
    benefitPreferenceQueryState.isError = false
    benefitPreferenceQueryState.refetch.mockClear()
    locationMutationState.mutateAsync.mockReset()
    locationMutationState.mutateAsync.mockResolvedValue()
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
            template: '<div>{{ title }} {{ description }}<slot /><slot name="right" /></div>',
          },
        },
      },
    })
  }

  function mountLocationSetting() {
    return shallowMount(MypageView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot /></section>' },
          ListItem: { template: '<div><slot /><slot name="right" /></div>' },
          Switch: {
            props: ['disabled'],
            emits: ['update:modelValue'],
            template:
              '<div><button data-location-switch :disabled="disabled" @click="$emit(\'update:modelValue\', true)" /><button data-location-off :disabled="disabled" @click="$emit(\'update:modelValue\', false)" /></div>',
          },
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
          DialogFooter: { template: '<div><slot /></div>' },
          DialogClose: { template: '<div><slot /></div>' },
          MocaButton: { template: '<button><slot /></button>' },
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

  it('위치 설정 조회 실패 시 오류를 표시하고 재조회할 수 있다', async () => {
    summaryQueryState.isError = true
    const wrapper = mountCardStatus()

    expect(wrapper.text()).toContain('설정을 불러오지 못했어요')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '다시 시도')
      ?.trigger('click')

    expect(summaryQueryState.refetch).toHaveBeenCalledOnce()
  })

  it('브라우저 위치 권한이 거부되면 서버 설정을 변경하지 않고 토스트를 표시한다', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn<
          (
            success: PositionCallback,
            error: PositionErrorCallback,
            options?: PositionOptions,
          ) => void
        >((_success, error) => error({} as GeolocationPositionError)),
      },
    })
    const wrapper = shallowMount(MypageView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot /></section>' },
          ListItem: { template: '<div><slot /><slot name="right" /></div>' },
          Switch: {
            emits: ['update:modelValue'],
            template: '<button data-location-switch @click="$emit(\'update:modelValue\', true)" />',
          },
          Dialog: { template: '<div />' },
        },
      },
    })

    await wrapper.get('[data-location-switch]').trigger('click')

    expect(wrapper.get('[role="alert"]').text()).toBe('브라우저 위치 권한을 허용해주세요.')
    expect(locationMutationState.mutateAsync).not.toHaveBeenCalled()
  })

  it('위치 추천 활성화 API 실패 시 오류 토스트를 표시한다', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn<(success: PositionCallback) => void>((success) =>
          success({} as GeolocationPosition),
        ),
      },
    })
    locationMutationState.mutateAsync.mockRejectedValueOnce(new Error('update failed'))
    const wrapper = mountLocationSetting()

    await wrapper.get('[data-location-switch]').trigger('click')
    await flushPromises()

    expect(locationMutationState.mutateAsync).toHaveBeenCalledWith(true)
    expect(wrapper.get('[role="alert"]').text()).toBe('위치 설정을 변경하지 못했어요.')
  })

  it('위치 추천 비활성화 API 실패 시 오류 토스트를 표시한다', async () => {
    locationMutationState.mutateAsync.mockRejectedValueOnce(new Error('update failed'))
    const wrapper = mountLocationSetting()

    await wrapper.get('[data-location-off]').trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '끄기')
      ?.trigger('click')
    await flushPromises()

    expect(locationMutationState.mutateAsync).toHaveBeenCalledWith(false)
    expect(wrapper.get('[role="alert"]').text()).toBe('위치 설정을 변경하지 못했어요.')
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

  it('혜택 선호 관리 화면으로 이동하며 현재 선호를 표시한다', async () => {
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

    expect(wrapper.text()).toContain('바로 할인받기')

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('혜택 선호 관리'))
      ?.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'mypage-benefit-preference' })
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
