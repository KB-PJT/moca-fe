import { MOCK_MANAGED_CARDS } from '@/domains/card/mocks/managedCards'

const MOCK_API_DELAY_MS = 300

let savedActiveCardOrder = MOCK_MANAGED_CARDS.filter((card) => card.isActive).map((card) => card.id)

export async function updateManagedCardOrder(cardIds: string[]) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY_MS))

  if (new Set(cardIds).size !== cardIds.length) {
    throw new Error('카드 순서에 중복된 ID가 있어요.')
  }

  savedActiveCardOrder = [...cardIds]
  return { cardIds: [...savedActiveCardOrder] }
}

export function getMockManagedCardOrder() {
  return [...savedActiveCardOrder]
}

export function resetMockManagedCardOrder() {
  savedActiveCardOrder = MOCK_MANAGED_CARDS.filter((card) => card.isActive).map((card) => card.id)
}
