import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useOwnedCardsStore } from '@/domains/card/stores/ownedCards'

describe('useOwnedCardsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mock 보유카드를 기본 데이터로 불러온다', () => {
    const store = useOwnedCardsStore()

    expect(store.ownedCards).toHaveLength(9)
    expect(store.ownedIssuers).toHaveLength(9)
    expect(store.connectedIssuerCount).toBe(8)
    expect(store.failedIssuerCount).toBe(1)
  })

  it('보유카드에서 카드사 목록을 추출하고 중복을 제거한다', () => {
    const store = useOwnedCardsStore()

    store.setOwnedCards([
      { id: 'card-1', issuer: 'kb-kookmin', name: 'KB국민 My WE:SH 카드' },
      { id: 'card-2', issuer: 'kb-kookmin', name: 'KB국민 굿데이카드' },
      { id: 'card-3', issuer: 'shinhan', name: '신한카드 Mr.Life' },
    ])

    expect(store.ownedIssuers).toEqual([
      { id: 'kb-kookmin', name: 'KB국민카드' },
      { id: 'shinhan', name: '신한카드' },
    ])
  })

  it('직접 선택한 카드만 기존 목록에 중복 없이 추가한다', () => {
    const store = useOwnedCardsStore()
    const initialCount = store.ownedCards.length

    store.addOwnedCards([
      { id: 'direct-kb-1', issuer: 'kb-kookmin', name: 'KB My WE:SH', last4: '4321' },
      { id: 'direct-kb-1', issuer: 'kb-kookmin', name: 'KB My WE:SH', last4: '4321' },
    ])

    expect(store.ownedCards).toHaveLength(initialCount + 1)
    expect(store.ownedCards[store.ownedCards.length - 1]).toMatchObject({
      id: 'direct-kb-1',
      last4: '4321',
    })
  })
})
