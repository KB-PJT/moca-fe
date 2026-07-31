import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import CardIssuerConnectView from '@/domains/card/views/CardIssuerConnectView.vue'

const globalStubs = {
  CardPageLayout: {
    template: '<main><slot /><footer><slot name="footer" /></footer></main>',
  },
  CardIssuerIcon: {
    props: ['issuer', 'variant'],
    template: '<span />',
  },
  MocaButton: {
    props: ['disabled', 'loading', 'type'],
    template:
      '<button :type="type" :disabled="disabled || loading" :aria-busy="loading" v-bind="$attrs"><slot /></button>',
  },
  Button: {
    template: '<button v-bind="$attrs"><slot /></button>',
  },
  Switch: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" role="switch" @click="$emit(\'update:modelValue\', !modelValue)" />',
  },
}

async function mountAt(issuerId: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/cards/connect/select/:issuerId',
        name: 'card-issuer-connect',
        component: CardIssuerConnectView,
      },
      {
        path: '/cards/connect/select',
        name: 'card-issuer-select',
        component: { template: '<div />' },
      },
      {
        path: '/cards/connect/progress',
        name: 'card-connect-progress',
        component: { template: '<div />' },
      },
    ],
  })

  await router.push({
    name: 'card-issuer-connect',
    params: { issuerId },
  })
  await router.isReady()

  const wrapper = mount(CardIssuerConnectView, {
    global: {
      plugins: [router],
      stubs: globalStubs,
    },
  })

  return { router, wrapper }
}

describe('CardIssuerConnectView', () => {
  it('KB 최초 입력과 추가 인증 mock 상태를 동적으로 전환한다', async () => {
    const { wrapper } = await mountAt('kb-kookmin')

    expect(wrapper.text()).toContain('KB국민카드')
    expect(wrapper.findAll('input')).toHaveLength(2)

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('추가 인증 입력 보기'))
      ?.trigger('click')

    expect(wrapper.findAll('input')).toHaveLength(4)

    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-homepagePassword').setValue('password')
    await wrapper.get('#card-connection-cardNumber').setValue('1234a56789012345678')
    await wrapper.get('#card-connection-cardPassword').setValue('1a2')

    expect(wrapper.get<HTMLInputElement>('#card-connection-cardNumber').element.value).toBe(
      '1234 5678 9012 3456',
    )
    expect(wrapper.get<HTMLInputElement>('#card-connection-cardPassword').element.value).toBe('12')
    expect(wrapper.get('footer button').attributes('disabled')).toBeUndefined()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      {
        issuerId: 'kb-kookmin',
        values: {
          homepageId: 'moca-user',
          homepagePassword: 'password',
          cardNumber: '1234567890123456',
          cardPassword: '12',
        },
        additionalInputRequired: true,
        includeCardImages: true,
      },
    ])
  })

  it('카드번호와 비밀번호 필드는 숫자만 허용하고 비밀번호 보기 기능을 제공한다', async () => {
    const { wrapper } = await mountAt('hyundai')
    const homepagePassword = wrapper.get<HTMLInputElement>('#card-connection-homepagePassword')

    expect(wrapper.findAll('input')).toHaveLength(4)
    expect(homepagePassword.attributes('type')).toBe('password')

    await wrapper.get('button[aria-label="홈페이지 비밀번호 보기"]').trigger('click')
    expect(homepagePassword.attributes('type')).toBe('text')

    await wrapper.get('#card-connection-cardNumber').setValue('1234-5678-abcd-9012-3456')
    await wrapper.get('#card-connection-cardPassword').setValue('1a2b34')

    expect(wrapper.get<HTMLInputElement>('#card-connection-cardNumber').element.value).toBe(
      '1234 5678 9012 3456',
    )
    expect(wrapper.get<HTMLInputElement>('#card-connection-cardPassword').element.value).toBe(
      '1234',
    )
  })

  it('카드사가 변경되면 입력값과 validation 오류를 초기화한다', async () => {
    const { router, wrapper } = await mountAt('hyundai')

    await wrapper.get('#card-connection-homepageId').setValue('moca-user')
    await wrapper.get('#card-connection-cardNumber').setValue('1234')
    await wrapper.get('#card-connection-cardNumber').trigger('blur')
    expect(wrapper.text()).toContain('16자리로 입력해 주세요')
    expect(wrapper.get('#card-connection-cardNumber').attributes('aria-describedby')).toBe(
      'card-connection-cardNumber-description',
    )
    expect(wrapper.get('[role="alert"]').text()).toContain('16자리로 입력해 주세요')

    await router.push({
      name: 'card-issuer-connect',
      params: { issuerId: 'woori' },
    })
    await nextTick()

    expect(wrapper.findAll('input')).toHaveLength(3)
    expect(wrapper.get<HTMLInputElement>('#card-connection-homepageId').element.value).toBe('')
    expect(wrapper.text()).not.toContain('16자리로 입력해 주세요')

    await wrapper.get('#card-connection-birthDate').setValue('1995-01-01abc')
    expect(wrapper.get<HTMLInputElement>('#card-connection-birthDate').element.value).toBe(
      '19950101',
    )
  })
})
