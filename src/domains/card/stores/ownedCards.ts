import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { CARD_ISSUERS, type CardIssuerId } from '@/domains/card/constants/cardIssuers'
import {
  getMockCardConnection,
  MOCK_CARD_CONNECTIONS,
  MOCK_OWNED_CARDS,
} from '@/domains/card/mocks/ownedCards'

export interface OwnedCard {
  id: string
  issuer: CardIssuerId
  name: string
}

export type CardConnectionStatus = 'waiting' | 'connecting' | 'connected' | 'failed'

export const useOwnedCardsStore = defineStore('ownedCards', () => {
  const ownedCards = ref<OwnedCard[]>([])
  const connectionStatuses = ref<Partial<Record<CardIssuerId, CardConnectionStatus>>>({})

  const ownedIssuers = computed(() => {
    const issuerIds = [...new Set(ownedCards.value.map((card) => card.issuer))]

    return issuerIds.map((id) => ({
      id,
      name: CARD_ISSUERS[id].name,
    }))
  })

  const connectionResults = computed(() =>
    ownedIssuers.value.map((issuer) => ({
      ...issuer,
      status: connectionStatuses.value[issuer.id] ?? 'waiting',
    })),
  )

  const connectedIssuerCount = computed(
    () => connectionResults.value.filter((issuer) => issuer.status === 'connected').length,
  )
  const failedIssuerCount = computed(
    () => connectionResults.value.filter((issuer) => issuer.status === 'failed').length,
  )

  // TODO(API): 보유카드 조회 API 응답을 OwnedCard로 정규화하고 mock 초기화를 대체한다.
  function hydrate() {
    ownedCards.value = MOCK_OWNED_CARDS.map((card) => ({ ...card }))
    connectionStatuses.value = Object.fromEntries(
      MOCK_CARD_CONNECTIONS.map((connection) => [connection.issuer, connection.status]),
    )
  }

  function setOwnedCards(cards: OwnedCard[]) {
    ownedCards.value = cards
    connectionStatuses.value = Object.fromEntries(
      ownedIssuers.value.map((issuer) => [
        issuer.id,
        getMockCardConnection(issuer.id)?.status ?? 'connected',
      ]),
    )
  }

  function resetConnectionStatuses() {
    connectionStatuses.value = Object.fromEntries(
      ownedIssuers.value.map((issuer) => [issuer.id, 'waiting']),
    )
  }

  function setIssuerConnectionStatus(issuerId: CardIssuerId, status: CardConnectionStatus) {
    connectionStatuses.value = {
      ...connectionStatuses.value,
      [issuerId]: status,
    }
  }

  hydrate()

  return {
    ownedCards,
    ownedIssuers,
    connectionResults,
    connectedIssuerCount,
    failedIssuerCount,
    hydrate,
    setOwnedCards,
    resetConnectionStatuses,
    setIssuerConnectionStatus,
  }
})
