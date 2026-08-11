import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CardIssuerSelectView from '@/domains/card/views/CardIssuerSelectView.vue'

const push = vi.fn<(location: { name: string; params: { issuerId: string } }) => void>()
const replace = vi.fn<(location: { name: string }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
}))

const globalStubs = {
  CardPageLayout: {
    emits: ['back'],
    template:
      '<main><button type="button" aria-label="뒤로가기" @click="$emit(\'back\')" /><slot /><footer><slot name="footer" /></footer></main>',
  },
  CardIssuerIcon: {
    props: ['issuer', 'variant'],
    template: '<span />',
  },
}

describe('CardIssuerSelectView', () => {
  beforeEach(() => {
    push.mockClear()
    replace.mockClear()
  })

  it('뒤로가기를 누르면 카드 연동 홈으로 이동한다', async () => {
    const wrapper = mount(CardIssuerSelectView, {
      global: { stubs: globalStubs },
    })

    await wrapper.get('button[aria-label="뒤로가기"]').trigger('click')

    expect(replace).toHaveBeenCalledWith({ name: 'card-connect' })
  })

  it('9개 카드사를 표시하고 카드사를 누르면 해당 입력 화면으로 이동한다', async () => {
    const wrapper = mount(CardIssuerSelectView, {
      global: { stubs: globalStubs },
    })

    const issuerButtons = wrapper.findAll('ul button')

    expect(issuerButtons).toHaveLength(9)
    expect(issuerButtons.every((button) => !button.classes().includes('shadow-btn'))).toBe(true)
    expect(issuerButtons.every((button) => button.classes().includes('border'))).toBe(true)

    await issuerButtons[0]?.trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'card-issuer-connect',
      params: { issuerId: 'kb-kookmin' },
    })
  })
})
