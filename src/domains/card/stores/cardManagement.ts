import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMockManagedCardOrder } from '@/domains/card/api/cardManagement.mock'
import { MOCK_MANAGED_CARDS, type ManagedCard } from '@/domains/card/mocks/managedCards'

function createMockCards() {
  const cards = MOCK_MANAGED_CARDS.map((card) => ({ ...card }))
  const savedOrder = getMockManagedCardOrder()
  const activeCardMap = new Map(
    cards.filter((card) => card.isActive).map((card) => [card.id, card]),
  )
  const activeCards = savedOrder
    .map((cardId) => activeCardMap.get(cardId))
    .filter((card): card is ManagedCard => Boolean(card))

  for (const card of activeCardMap.values()) {
    if (!savedOrder.includes(card.id)) activeCards.push(card)
  }

  return [...activeCards, ...cards.filter((card) => !card.isActive)]
}

export const useCardManagementStore = defineStore('cardManagement', () => {
  const cards = ref<ManagedCard[]>(createMockCards())

  const activeCards = computed(() => cards.value.filter((card) => card.isActive))
  const inactiveCards = computed(() => cards.value.filter((card) => !card.isActive))

  function setCardActive(cardId: string, isActive: boolean) {
    const card = cards.value.find((item) => item.id === cardId)
    if (card) card.isActive = isActive
  }

  function disconnectCard(cardId: string) {
    cards.value = cards.value.filter((card) => card.id !== cardId)
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

  function reset() {
    cards.value = createMockCards()
  }

  return {
    cards,
    activeCards,
    inactiveCards,
    setCardActive,
    disconnectCard,
    setActiveCardOrder,
    moveActiveCard,
    moveActiveCardTo,
    reset,
  }
})
