import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SyncMyCardsResponse } from '@/domains/card/api/cardManagement'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import CardIssuerSyncView from '@/domains/card/views/CardIssuerSyncView.vue'

const cardManagementApiMocks = vi.hoisted(() => ({
  syncMyCards: vi.fn<() => Promise<SyncMyCardsResponse>>(),
}))

vi.mock('@/domains/card/api/cardManagement', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/card/api/cardManagement')>()),
  syncMyCards: cardManagementApiMocks.syncMyCards,
}))

const globalStubs = {
  CardPageLayout: {
    props: ['showBack'],
    template: '<main><slot /></main>',
  },
  MocaButton: {
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
  },
}

function prepareActivatedCard() {
  const store = useDirectCardConnectionStore()
  store.beginLookup('kb-kookmin')
  store.completeLookup([
    {
      id: 'user-card-1',
      userCardId: 'user-card-1',
      issuer: 'kb-kookmin',
      name: 'KB 카드',
      last4: '4710',
    },
  ])
  store.completeActivation(['user-card-1'])
  return store
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/cards/connect/select/:issuerId/sync',
        name: 'card-issuer-sync-progress',
        component: CardIssuerSyncView,
      },
      {
        path: '/cards/connect/select/:issuerId/complete',
        name: 'card-issuer-connect-complete',
        component: { template: '<div>완료</div>' },
      },
      {
        path: '/cards/connect/select/:issuerId/cards',
        name: 'card-issuer-card-select',
        component: { template: '<div>선택</div>' },
      },
      { path: '/home', name: 'home', component: { template: '<div>홈</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>로그인</div>' } },
    ],
  })
}

async function mountSyncView(pinia: ReturnType<typeof createPinia>) {
  const router = createTestRouter()
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  await router.push({ name: 'card-issuer-sync-progress', params: { issuerId: 'kb-kookmin' } })
  await router.isReady()
  const appWrapper = mount(
    { template: '<router-view />' },
    {
      global: {
        plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
        stubs: globalStubs,
      },
    },
  )
  return { queryClient, router, wrapper: appWrapper.getComponent(CardIssuerSyncView) }
}

describe('CardIssuerSyncView', () => {
  beforeEach(() => {
    cardManagementApiMocks.syncMyCards.mockReset()
  })

  it('진입 즉시 승인내역을 동기화하고 성공 후 완료 화면으로 대체한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = prepareActivatedCard()
    let resolveSync: ((response: SyncMyCardsResponse) => void) | undefined
    cardManagementApiMocks.syncMyCards.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSync = resolve
        }),
    )

    const { queryClient, router, wrapper } = await mountSyncView(pinia)
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    expect(wrapper.text()).toContain('승인내역을 불러오고 있어요')
    expect(cardManagementApiMocks.syncMyCards).toHaveBeenCalledOnce()
    expect(store.approvalSyncStatus).toBe('syncing')

    resolveSync?.({
      syncedCardCount: 1,
      syncedApprovalCount: 3,
      syncedPerformanceCount: 1,
      syncedAt: '2026-08-12T10:30:00+09:00',
    })
    await flushPromises()

    expect(store.approvalSyncStatus).toBe('success')
    expect(router.currentRoute.value.name).toBe('card-issuer-connect-complete')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cards', 'my-cards'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['benefit-report'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['performance-report'] })
  })

  it('실패 시 이전 선택 화면 이동을 막고 sync만 다시 시도한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = prepareActivatedCard()
    cardManagementApiMocks.syncMyCards
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce({
        syncedCardCount: 1,
        syncedApprovalCount: 3,
        syncedPerformanceCount: 1,
        syncedAt: '2026-08-12T10:30:00+09:00',
      })

    const { router, wrapper } = await mountSyncView(pinia)
    await flushPromises()

    expect(wrapper.text()).toContain('승인내역을 불러오지 못했어요')
    expect(store.approvalSyncStatus).toBe('failed')

    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'kb-kookmin' } })
    expect(router.currentRoute.value.name).toBe('card-issuer-sync-progress')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(cardManagementApiMocks.syncMyCards).toHaveBeenCalledTimes(2)
    expect(store.approvalSyncStatus).toBe('success')
    expect(router.currentRoute.value.name).toBe('card-issuer-connect-complete')
  })

  it('실패 후 나중에 하기를 선택하면 자동 동기화 안내 상태로 완료 처리한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = prepareActivatedCard()
    cardManagementApiMocks.syncMyCards.mockRejectedValueOnce(new Error('network failure'))

    const { router, wrapper } = await mountSyncView(pinia)
    await flushPromises()

    await wrapper.findAll('button')[1]?.trigger('click')
    await flushPromises()

    expect(store.approvalSyncStatus).toBe('skipped')
    expect(router.currentRoute.value.name).toBe('card-issuer-connect-complete')
  })

  it('새로고침으로 등록 문맥이 사라져도 sync 후 홈으로 이동한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    cardManagementApiMocks.syncMyCards.mockResolvedValueOnce({
      syncedCardCount: 1,
      syncedApprovalCount: 3,
      syncedPerformanceCount: 1,
      syncedAt: '2026-08-12T10:30:00+09:00',
    })

    const { router } = await mountSyncView(pinia)
    await flushPromises()

    expect(cardManagementApiMocks.syncMyCards).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.name).toBe('home')
  })
})
