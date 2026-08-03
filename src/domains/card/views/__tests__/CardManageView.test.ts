import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CardManageView from '@/domains/card/views/CardManageView.vue'

const push = vi.fn<(location: { name: string }) => void>()
const routeQuery: Record<string, string | string[] | undefined> = {}

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push }),
}))

const globalStubs = {
  PageLayout: {
    template: '<main><slot /><footer><slot name="footer" /></footer></main>',
  },
  BottomBar: {
    props: ['activePath'],
    template: '<nav :data-active-path="activePath" />',
  },
  CardImage: {
    template: '<span />',
  },
  MocaButton: {
    emits: ['click'],
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
}

function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(CardManageView, {
    global: { plugins: [pinia], stubs: globalStubs },
  })
}

describe('CardManageView', () => {
  beforeEach(() => {
    push.mockClear()
    for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('활성 카드와 비활성 카드를 구분해 표시한다', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
    expect(wrapper.text()).toContain('신한 Deep Dream')
    expect(wrapper.text()).toContain('현대 Zero Edition')
  })

  it('카드를 비활성화하고 다시 활성화한다', async () => {
    const wrapper = mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 비활성화"]').trigger('click')

    expect(wrapper.text()).toContain('등록된 카드 2개')
    expect(wrapper.text()).toContain('비활성화 된 카드 2개')

    await wrapper.get('button[aria-label="신한 Deep Dream 활성화"]').trigger('click')

    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
  })

  it('연결 해제한 카드를 목록에서 제거한다', async () => {
    const wrapper = mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 연결 해제"]').trigger('click')

    expect(wrapper.text()).toContain('등록된 카드 2개')
    expect(wrapper.text()).not.toContain('신한 Deep Dream')
  })

  it('새로고침 중 상태를 표시하고 목데이터를 다시 불러온다', async () => {
    vi.useFakeTimers()
    const wrapper = mountView()

    await wrapper.get('button[aria-label="신한 Deep Dream 비활성화"]').trigger('click')
    await wrapper.get('button[aria-label="카드 목록 새로고침"]').trigger('click')

    expect(wrapper.text()).toContain('새로고침 중')

    await vi.advanceTimersByTimeAsync(700)

    expect(wrapper.text()).toContain('등록된 카드 3개')
    expect(wrapper.text()).toContain('비활성화 된 카드 1개')
    expect(wrapper.text()).toContain('새로고침')
  })

  it('카드 추가하기를 누르면 카드 연결 화면으로 이동한다', async () => {
    const wrapper = mountView()

    await wrapper.get('footer button').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'card-connect' })
  })

  it.each([
    ['home', '/home'],
    ['mypage', '/mypage'],
  ])('%s에서 진입하면 해당 하단 탭을 활성화한다', (from, activePath) => {
    routeQuery.from = from

    const wrapper = mountView()

    expect(wrapper.get('nav').attributes('data-active-path')).toBe(activePath)
  })

  it('직접 접근하면 하단 탭을 강제로 활성화하지 않는다', () => {
    const wrapper = mountView()

    expect(wrapper.get('nav').attributes('data-active-path')).toBeUndefined()
  })
})
