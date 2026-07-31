import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CardIssuerSelectView from '@/domains/card/views/CardIssuerSelectView.vue'

const push = vi.fn<(location: { name: string; params: { issuerId: string } }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

const globalStubs = {
  CardPageLayout: {
    template: '<main><slot /><footer><slot name="footer" /></footer></main>',
  },
  CardIssuerIcon: {
    props: ['issuer', 'variant'],
    template: '<span />',
  },
}

describe('CardIssuerSelectView', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('9개 카드사를 표시하고 카드사를 누르면 해당 입력 화면으로 이동한다', async () => {
    const wrapper = mount(CardIssuerSelectView, {
      global: { stubs: globalStubs },
    })

    const issuerButtons = wrapper.findAll('ul button')

    expect(issuerButtons).toHaveLength(9)

    await issuerButtons[0]?.trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'card-issuer-connect',
      params: { issuerId: 'kb-kookmin' },
    })
  })
})
