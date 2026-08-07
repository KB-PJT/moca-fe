import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import CardIssuerLookupView from '@/domains/card/views/CardIssuerLookupView.vue'

describe('CardIssuerLookupView', () => {
  it('실제 카드 연동 성공 상태를 구독해 카드 선택 화면으로 이동한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDirectCardConnectionStore()
    store.beginLookup('kb-kookmin')

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/progress',
          name: 'card-issuer-connect-progress',
          component: CardIssuerLookupView,
        },
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: { template: '<div />' },
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
      ],
    })
    await router.push({
      name: 'card-issuer-connect-progress',
      params: { issuerId: 'kb-kookmin' },
    })
    await router.isReady()

    const wrapper = mount(CardIssuerLookupView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          CardPageLayout: { template: '<main><slot /></main>' },
          BulkCardConnectIllustration: { template: '<span />' },
        },
      },
    })

    expect(wrapper.text()).toContain('KB국민카드 연동 중')
    expect(wrapper.text()).toContain('해당 기관의 보유카드를 조회하고 있어요')

    store.completeCardLink({
      linkId: 'link-id',
      institutionCode: '0301',
      status: 'PENDING_CARD_ACTIVATION',
      cards: [],
    })
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('card-issuer-card-select')
    wrapper.unmount()
  })

  it('조회 실패 메시지를 표시하고 카드사 연결 화면으로 돌아간다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDirectCardConnectionStore()
    store.beginLookup('kb-kookmin')
    store.failLookup({ code: 'CARD_LINK_FAILED', message: '카드사 정보를 확인해 주세요.' })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/progress',
          name: 'card-issuer-connect-progress',
          component: CardIssuerLookupView,
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
      ],
    })
    await router.push({
      name: 'card-issuer-connect-progress',
      params: { issuerId: 'kb-kookmin' },
    })
    await router.isReady()

    const wrapper = mount(CardIssuerLookupView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          CardPageLayout: { template: '<main><slot /></main>' },
          BulkCardConnectIllustration: { template: '<span />' },
          MocaButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        },
      },
    })

    expect(wrapper.text()).toContain('카드사 정보를 확인해 주세요.')
    expect(wrapper.text()).toContain('돌아가서 다시 시도하기')
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('card-issuer-connect')
    expect(store.lookupStatus).toBe('idle')
  })
})
