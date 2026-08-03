import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'

describe('useDirectCardConnectionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('조회 결과의 모든 카드를 기본 선택하고 개별·전체 선택을 변경한다', () => {
    const store = useDirectCardConnectionStore()
    const cards = [
      { id: 'card-1', issuer: 'kb-kookmin' as const, name: '카드 1', last4: '1111' },
      { id: 'card-2', issuer: 'kb-kookmin' as const, name: '카드 2', last4: '2222' },
    ]

    store.beginLookup('kb-kookmin', true)
    store.completeLookup(cards)

    expect(store.lookupStatus).toBe('success')
    expect(store.selectedCards).toHaveLength(2)

    store.setCardSelected('card-2', false)
    expect(store.selectedCardIds).toEqual(['card-1'])

    store.setAllSelected(false)
    expect(store.selectedCards).toHaveLength(0)

    store.failLookup()
    expect(store.lookupStatus).toBe('failed')
    expect(store.discoveredCards).toHaveLength(0)
  })
})
