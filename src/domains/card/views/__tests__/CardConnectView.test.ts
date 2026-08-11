import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CardConnectView from '@/domains/card/views/CardConnectView.vue'

const push = vi.fn<(location: { name: string }) => void>()
const routeQuery: Record<string, string | undefined> = {}

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push }),
}))

const globalStubs = {
  CardPageLayout: {
    props: ['showBack'],
    template:
      '<main :data-show-back="showBack"><slot /><footer><slot name="footer" /></footer></main>',
  },
  CardIssuerIcon: {
    template: '<span />',
  },
  CardSearchIllustration: {
    template: '<span />',
  },
  MocaButton: {
    emits: ['click'],
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
}

describe('CardConnectView', () => {
  beforeEach(() => {
    push.mockClear()
    for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  })

  it('기관 직접 선택하기를 누르면 카드사 선택 화면으로 이동한다', async () => {
    const wrapper = mount(CardConnectView, {
      global: { stubs: globalStubs },
    })

    const directSelectButton = wrapper
      .findAll('footer button')
      .find((button) => button.text() === '기관 직접 선택하기')

    expect(directSelectButton).toBeDefined()

    await directSelectButton?.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'card-issuer-select' })
  })

  it('강제 연동이면 뒤로가기를 숨기고 계정 및 고객지원 동선을 제공한다', async () => {
    routeQuery.required = 'true'
    const wrapper = mount(CardConnectView, {
      global: { stubs: globalStubs },
    })

    expect(wrapper.get('main').attributes('data-show-back')).toBe('false')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '계정 및 고객지원')
      ?.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'mypage' })
  })
})
