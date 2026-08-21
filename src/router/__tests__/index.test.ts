import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MyCardItemResponse, MyCardsResponse } from '@/domains/card/api/cardManagement'

const mocks = vi.hoisted(() => ({
  authStore: { accessToken: 'access-token' as string | null },
  cardManagementStore: {
    setCards: vi.fn<(response: unknown) => void>(),
    preserveCardsOnNextLoad: vi.fn<() => void>(),
  },
  fetchMyCards: vi.fn<() => Promise<MyCardsResponse>>(),
  prefetchHomeCards: vi.fn<() => Promise<null>>(),
  clearHomeCardsPrefetch: vi.fn<() => void>(),
  restoreInitialMocaSession: vi.fn<() => Promise<boolean>>(),
}))

vi.mock('@/domains/auth/stores/auth', () => ({
  useAuthStore: () => mocks.authStore,
}))

vi.mock('@/domains/card/api/cardManagement', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/domains/card/api/cardManagement')>()),
  fetchMyCards: mocks.fetchMyCards,
}))

vi.mock('@/domains/card/stores/cardManagement', () => ({
  useCardManagementStore: () => mocks.cardManagementStore,
}))

vi.mock('@/domains/home/api/homeCardsPrefetch', () => ({
  prefetchHomeCards: mocks.prefetchHomeCards,
  clearHomeCardsPrefetch: mocks.clearHomeCardsPrefetch,
}))

vi.mock('@/shared/api/client', () => ({
  restoreInitialMocaSession: mocks.restoreInitialMocaSession,
}))

import router from '@/router'

function createCard(id: string): MyCardItemResponse {
  return {
    userCardId: id,
    cardName: `카드 ${id}`,
    cardNo: null,
    issuerId: 'issuer-id',
    issuerName: '카드사',
    cardImageUrl: null,
    memo: null,
  }
}

function createCardsResponse(
  activeCards: MyCardItemResponse[] = [],
  inactiveCards: MyCardItemResponse[] = [],
): MyCardsResponse {
  return {
    lastSyncedAt: null,
    activeCards,
    inactiveCards,
  }
}

describe('card access route guard', () => {
  beforeEach(async () => {
    await router.replace('/onboarding')
    sessionStorage.clear()
    mocks.authStore.accessToken = 'access-token'
    mocks.restoreInitialMocaSession.mockReset()
    mocks.restoreInitialMocaSession.mockResolvedValue(true)
    mocks.fetchMyCards.mockReset()
    mocks.fetchMyCards.mockResolvedValue(createCardsResponse([createCard('active')]))
    mocks.prefetchHomeCards.mockReset()
    mocks.prefetchHomeCards.mockResolvedValue(null)
    mocks.clearHomeCardsPrefetch.mockReset()
    mocks.cardManagementStore.setCards.mockReset()
    mocks.cardManagementStore.preserveCardsOnNextLoad.mockReset()
  })

  it.each([
    '/home',
    '/home/benefits',
    '/map',
    '/map/merchants/merchant-1',
    '/report',
    '/cards/manage',
    '/cards/card-1',
  ])('카드가 없으면 %s 대신 강제 카드 연동 화면으로 이동한다', async (path) => {
    mocks.fetchMyCards.mockResolvedValue(createCardsResponse())

    await router.push(path)

    expect(router.currentRoute.value.name).toBe('card-connect')
    expect(router.currentRoute.value.query.required).toBe('true')
  })

  it('비활성 카드만 있으면 재활성화 카드 관리 화면으로 이동한다', async () => {
    mocks.fetchMyCards.mockResolvedValue(createCardsResponse([], [createCard('inactive')]))

    await router.push('/map')

    expect(router.currentRoute.value.name).toBe('card-manage')
    expect(router.currentRoute.value.query.required).toBe('activate')
    expect(mocks.cardManagementStore.preserveCardsOnNextLoad).toHaveBeenCalled()
  })

  it('활성 카드가 있으면 요청한 핵심 서비스 진입을 허용한다', async () => {
    await router.push('/report')

    expect(router.currentRoute.value.name).toBe('report')
    expect(mocks.cardManagementStore.setCards).toHaveBeenCalled()
  })

  it('홈 진입 시 카드 상태 확인과 홈 카드 조회를 함께 시작한다', async () => {
    await router.push('/home')

    expect(mocks.prefetchHomeCards).toHaveBeenCalledOnce()
    expect(mocks.clearHomeCardsPrefetch).not.toHaveBeenCalled()
  })

  it.each([
    '/mypage',
    '/mypage/profile',
    '/mypage/notifications',
    '/mypage/faq',
    '/mypage/inquiry',
    '/mypage/delete-account',
  ])('%s는 카드 상태를 조회하지 않고 진입을 허용한다', async (path) => {
    await router.push(path)

    expect(router.currentRoute.value.path).toBe(path)
    expect(mocks.fetchMyCards).not.toHaveBeenCalled()
  })

  it('카드 목록 조회에 실패하면 요청한 페이지 진입을 허용한다', async () => {
    mocks.fetchMyCards.mockRejectedValue(new Error('network error'))

    await router.push('/home/benefits')

    expect(router.currentRoute.value.name).toBe('home-benefits')
  })

  it('인증되지 않은 사용자는 카드 조회 전에 로그인 화면으로 이동한다', async () => {
    mocks.authStore.accessToken = null
    mocks.restoreInitialMocaSession.mockResolvedValue(false)

    await router.push('/home')

    expect(router.currentRoute.value.name).toBe('login')
    expect(mocks.fetchMyCards).not.toHaveBeenCalled()
  })

  it('강제 카드 연동 상태를 카드 연동 하위 경로에 유지한다', async () => {
    await router.push({ name: 'card-connect', query: { required: 'true' } })
    await router.push({ name: 'card-issuer-select' })

    expect(router.currentRoute.value.name).toBe('card-issuer-select')
    expect(router.currentRoute.value.query.required).toBe('true')
  })
})
