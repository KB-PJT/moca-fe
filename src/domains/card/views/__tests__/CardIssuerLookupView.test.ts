import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import CardIssuerLookupView from '@/domains/card/views/CardIssuerLookupView.vue'

describe('CardIssuerLookupView', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('선택한 기관만 조회한 뒤 카드 선택 화면으로 이동한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDirectCardConnectionStore()
    store.beginLookup('kb-kookmin', true)

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

    vi.advanceTimersByTime(1800)
    await nextTick()
    await flushPromises()

    expect(store.discoveredCards).toHaveLength(3)
    expect(store.selectedCards).toHaveLength(3)
    expect(router.currentRoute.value.name).toBe('card-issuer-card-select')
    wrapper.unmount()
  })
})
