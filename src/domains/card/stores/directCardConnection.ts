import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { CardIssuerId } from '@/domains/card/constants/cardIssuers'

export interface DiscoveredCard {
  id: string
  issuer: CardIssuerId
  name: string
  last4: string
  imageUrl?: string | null
}

export type DirectCardLookupStatus = 'idle' | 'looking-up' | 'success' | 'failed'

export const useDirectCardConnectionStore = defineStore('directCardConnection', () => {
  const issuerId = ref<CardIssuerId | null>(null)
  const includeCardImages = ref(true)
  const lookupStatus = ref<DirectCardLookupStatus>('idle')
  const discoveredCards = ref<DiscoveredCard[]>([])
  const selectedCardIds = ref<string[]>([])

  const selectedCards = computed(() => {
    const selectedIds = new Set(selectedCardIds.value)
    return discoveredCards.value.filter((card) => selectedIds.has(card.id))
  })

  function beginLookup(targetIssuerId: CardIssuerId, shouldIncludeCardImages: boolean) {
    issuerId.value = targetIssuerId
    includeCardImages.value = shouldIncludeCardImages
    lookupStatus.value = 'looking-up'
    discoveredCards.value = []
    selectedCardIds.value = []
  }

  function completeLookup(cards: DiscoveredCard[]) {
    discoveredCards.value = cards.map((card) => ({ ...card }))
    selectedCardIds.value = cards.map((card) => card.id)
    lookupStatus.value = 'success'
  }

  function failLookup() {
    lookupStatus.value = 'failed'
    discoveredCards.value = []
    selectedCardIds.value = []
  }

  function setCardSelected(cardId: string, selected: boolean) {
    const selectedIds = new Set(selectedCardIds.value)

    if (selected) selectedIds.add(cardId)
    else selectedIds.delete(cardId)

    selectedCardIds.value = [...selectedIds]
  }

  function setAllSelected(selected: boolean) {
    selectedCardIds.value = selected ? discoveredCards.value.map((card) => card.id) : []
  }

  function reset() {
    issuerId.value = null
    includeCardImages.value = true
    lookupStatus.value = 'idle'
    discoveredCards.value = []
    selectedCardIds.value = []
  }

  return {
    issuerId,
    includeCardImages,
    lookupStatus,
    discoveredCards,
    selectedCardIds,
    selectedCards,
    beginLookup,
    completeLookup,
    failLookup,
    setCardSelected,
    setAllSelected,
    reset,
  }
})
