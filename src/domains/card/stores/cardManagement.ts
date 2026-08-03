import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { MOCK_MANAGED_CARDS, type ManagedCard } from '@/domains/card/mocks/managedCards'

function createMockCards() {
  return MOCK_MANAGED_CARDS.map((card) => ({ ...card }))
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

  function reset() {
    cards.value = createMockCards()
  }

  return {
    cards,
    activeCards,
    inactiveCards,
    setCardActive,
    disconnectCard,
    reset,
  }
})
