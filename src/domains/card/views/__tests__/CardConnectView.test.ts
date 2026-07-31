import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CardConnectView from '@/domains/card/views/CardConnectView.vue'

const push = vi.fn<(location: { name: string }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

const globalStubs = {
  CardPageLayout: {
    template: '<main><slot /><footer><slot name="footer" /></footer></main>',
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
})
