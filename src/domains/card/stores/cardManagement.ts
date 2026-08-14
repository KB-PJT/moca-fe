import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MyCardItemResponse, MyCardsResponse } from '@/domains/card/api/cardManagement'

export interface ManagedCard {
  id: string
  name: string
  issuerName: string
  cardNo?: string | null
  last4?: string
  imageUrl?: string | null
  isActive: boolean
}

function getLast4(cardNo: string | null) {
  if (!cardNo) return undefined
  const digits = cardNo.replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : undefined
}

function toManagedCard(card: MyCardItemResponse, isActive: boolean): ManagedCard {
  return {
    id: card.userCardId,
    name: card.cardName,
    issuerName: card.issuerName,
    cardNo: card.cardNo?.trim() || null,
    last4: getLast4(card.cardNo),
    imageUrl: card.cardImageUrl,
    isActive,
  }
}

export const useCardManagementStore = defineStore('cardManagement', () => {
  const cards = ref<ManagedCard[]>([])
  const detailNavigationCardIds = ref<string[]>([])
  const homeSelectedCardId = ref<string | null>(null)
  const activationNotice = ref('')
  let shouldPreserveCardsOnNextLoad = false

  const activeCards = computed(() => cards.value.filter((card) => card.isActive))
  const inactiveCards = computed(() => cards.value.filter((card) => !card.isActive))

  function setCards(response: MyCardsResponse) {
    cards.value = [
      ...response.activeCards.map((card) => toManagedCard(card, true)),
      ...(response.inactiveCards ?? []).map((card) => toManagedCard(card, false)),
    ]
  }

  function setCardActive(cardId: string, isActive: boolean) {
    const card = cards.value.find((item) => item.id === cardId)
    if (card) card.isActive = isActive
  }

  function disconnectCard(cardId: string) {
    cards.value = cards.value.filter((card) => card.id !== cardId)
  }

  function preserveCardsOnNextLoad() {
    shouldPreserveCardsOnNextLoad = true
  }

  function setDetailNavigationCardIds(cardIds: string[]) {
    detailNavigationCardIds.value = [...new Set(cardIds)]
  }

  function setHomeSelectedCardId(cardId: string | null) {
    homeSelectedCardId.value = cardId
  }

  function setActivationNotice(message: string) {
    activationNotice.value = message
  }

  function consumeActivationNotice() {
    const message = activationNotice.value
    activationNotice.value = ''
    return message
  }

  function consumePreserveCardsOnNextLoad() {
    const shouldPreserve = shouldPreserveCardsOnNextLoad
    shouldPreserveCardsOnNextLoad = false
    return shouldPreserve
  }

  function setActiveCardOrder(cardIds: string[]) {
    const activeCardMap = new Map(
      cards.value.filter((card) => card.isActive).map((card) => [card.id, card]),
    )
    const orderedActiveCards = cardIds
      .map((cardId) => activeCardMap.get(cardId))
      .filter((card): card is ManagedCard => Boolean(card))

    for (const card of activeCardMap.values()) {
      if (!cardIds.includes(card.id)) orderedActiveCards.push(card)
    }

    let activeCardIndex = 0
    cards.value = cards.value.map((card) =>
      card.isActive ? (orderedActiveCards[activeCardIndex++] ?? card) : card,
    )
  }

  function moveActiveCard(cardId: string, offset: number) {
    const cardIds = activeCards.value.map((card) => card.id)
    const currentIndex = cardIds.indexOf(cardId)
    moveActiveCardTo(cardId, currentIndex + offset)
  }

  function moveActiveCardTo(cardId: string, targetIndex: number) {
    const cardIds = activeCards.value.map((card) => card.id)
    const currentIndex = cardIds.indexOf(cardId)

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= cardIds.length ||
      currentIndex === targetIndex
    )
      return

    const [movedCardId] = cardIds.splice(currentIndex, 1)
    if (!movedCardId) return

    cardIds.splice(targetIndex, 0, movedCardId)
    setActiveCardOrder(cardIds)
  }

  return {
    cards,
    activeCards,
    inactiveCards,
    detailNavigationCardIds,
    homeSelectedCardId,
    setCards,
    setCardActive,
    disconnectCard,
    setDetailNavigationCardIds,
    setHomeSelectedCardId,
    setActivationNotice,
    consumeActivationNotice,
    preserveCardsOnNextLoad,
    consumePreserveCardsOnNextLoad,
    setActiveCardOrder,
    moveActiveCard,
    moveActiveCardTo,
  }
})
