import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useOwnedCardsStore } from '@/domains/card/stores/ownedCards'

describe('useOwnedCardsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mock 보유카드를 기본 데이터로 불러온다', () => {
    const store = useOwnedCardsStore()

    expect(store.ownedCards).toHaveLength(8)
    expect(store.ownedIssuers).toHaveLength(8)
    expect(store.connectedIssuerCount).toBe(7)
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
})
