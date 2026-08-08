import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import CardIssuerConnectCompleteView from '@/domains/card/views/CardIssuerConnectCompleteView.vue'

describe('CardIssuerConnectCompleteView', () => {
  it('연동한 기관과 선택 카드 수를 완료 결과에 표시한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDirectCardConnectionStore()
    store.beginLookup('kb-kookmin')
    store.completeLookup([
      { id: 'card-1', issuer: 'kb-kookmin', name: 'KB 카드 1', last4: '1111' },
      { id: 'card-2', issuer: 'kb-kookmin', name: 'KB 카드 2', last4: '2222' },
    ])

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: CardIssuerConnectCompleteView,
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
        { path: '/home', name: 'home', component: { template: '<div />' } },
      ],
    })
    await router.push({
      name: 'card-issuer-connect-complete',
      params: { issuerId: 'kb-kookmin' },
    })
    await router.isReady()

    const wrapper = mount(CardIssuerConnectCompleteView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          CardPageLayout: {
            template: '<main><slot /><footer><slot name="footer" /></footer></main>',
          },
          MocaButton: { template: '<button><slot /></button>' },
        },
      },
    })

    expect(wrapper.text()).toContain('연동을 완료했어요')
    expect(wrapper.text()).toContain('KB국민카드 카드 2개')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })
})
