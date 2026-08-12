import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CardLinkCardResponse,
  CardLinkResponse,
  CardOptionChoiceResponse,
  CardOptionGroupResponse,
} from '@/domains/card/api/cardLinks'
import type { CardIssuerId } from '@/domains/card/constants/cardIssuers'

export interface DiscoveredCard {
  id: string
  userCardId?: string | null
  cardId?: string | null
  issuer: CardIssuerId
  name: string
  last4: string
  cardNo?: string | null
  issuerName?: string
  cardType?: 'CREDIT' | 'CHECK' | 'UNKNOWN'
  imageUrl?: string | null
  matched?: boolean
  supported?: boolean
  optionGroups?: CardOptionGroup[]
}

export type CardOptionChoice = CardOptionChoiceResponse
export type CardOptionGroup = CardOptionGroupResponse

export interface DirectCardLookupError {
  code?: string
  message: string
  fields?: Record<string, string>
}

export type DirectCardLookupStatus = 'idle' | 'looking-up' | 'success' | 'failed'
export type ApprovalSyncStatus = 'idle' | 'syncing' | 'success' | 'failed' | 'skipped'

export const useDirectCardConnectionStore = defineStore('directCardConnection', () => {
  const issuerId = ref<CardIssuerId | null>(null)
  const linkId = ref<string | null>(null)
  const lookupStatus = ref<DirectCardLookupStatus>('idle')
  const lookupError = ref<DirectCardLookupError | null>(null)
  const discoveredCards = ref<DiscoveredCard[]>([])
  const selectedCardIds = ref<string[]>([])
  const optionSelections = ref<Record<string, Record<string, string>>>({})
  const activationCompleted = ref(false)
  const approvalSyncStatus = ref<ApprovalSyncStatus>('idle')

  const selectableCards = computed(() =>
    discoveredCards.value.filter(
      (card) => card.matched !== false && card.supported !== false && card.userCardId !== null,
    ),
  )

  const selectedCards = computed(() => {
    const selectedIds = new Set(selectedCardIds.value)
    return selectableCards.value.filter((card) => selectedIds.has(card.id))
  })

  const hasCompleteOptionSelections = computed(() =>
    selectedCards.value.every((card) =>
      (card.optionGroups ?? []).every(
        (group) => optionSelections.value[card.id]?.[group.optionGroupId],
      ),
    ),
  )

  function beginLookup(targetIssuerId: CardIssuerId) {
    issuerId.value = targetIssuerId
    linkId.value = null
    lookupStatus.value = 'looking-up'
    lookupError.value = null
    discoveredCards.value = []
    selectedCardIds.value = []
    optionSelections.value = {}
    activationCompleted.value = false
    approvalSyncStatus.value = 'idle'
  }

  function completeLookup(cards: DiscoveredCard[]) {
    discoveredCards.value = cards.map((card) => ({
      ...card,
      optionGroups: card.optionGroups?.map((group) => ({
        ...group,
        choices: group.choices.map((choice) => ({ ...choice })),
      })),
    }))
    selectedCardIds.value = selectableCards.value.map((card) => card.id)
    optionSelections.value = {}
    lookupStatus.value = 'success'
  }

  function completeCardLink(response: CardLinkResponse) {
    completeCardLinkCards(response.linkId, response.institutionCode, response.cards)
  }

  function completeCardLinkCards(
    targetLinkId: string,
    institutionCode: string,
    cards: CardLinkCardResponse[],
  ) {
    if (!issuerId.value) return

    linkId.value = targetLinkId
    completeLookup(
      cards.map((card, index) => ({
        id:
          card.userCardId ??
          card.cardId ??
          `${institutionCode}-${index}-${card.cardNo ?? card.cardName}`,
        userCardId: card.userCardId,
        cardId: card.cardId,
        issuer: issuerId.value as CardIssuerId,
        name: card.cardName,
        last4: extractCardLast4(card.cardNo),
        cardNo: card.cardNo,
        issuerName: card.issuerName,
        cardType: card.cardType,
        imageUrl: card.cardImageUrl,
        matched: card.matched,
        supported: card.supported,
        optionGroups: card.optionGroups,
      })),
    )
  }

  function updateCardLinkCard(card: CardLinkCardResponse) {
    const index = discoveredCards.value.findIndex((item) => item.userCardId === card.userCardId)
    if (index < 0) return

    const existing = discoveredCards.value[index]
    if (!existing) return

    discoveredCards.value[index] = {
      ...existing,
      cardId: card.cardId,
      name: card.cardName,
      last4: extractCardLast4(card.cardNo),
      cardNo: card.cardNo,
      issuerName: card.issuerName,
      cardType: card.cardType,
      imageUrl: card.cardImageUrl,
      matched: card.matched,
      supported: card.supported,
      optionGroups: card.optionGroups.map((group) => ({
        ...group,
        choices: group.choices.map((choice) => ({ ...choice })),
      })),
    }
  }

  function completeActivation(activatedUserCardIds: string[]) {
    const activatedIds = new Set(activatedUserCardIds)
    selectedCardIds.value = selectableCards.value
      .filter((card) => card.userCardId && activatedIds.has(card.userCardId))
      .map((card) => card.id)
    activationCompleted.value = true
    approvalSyncStatus.value = 'idle'
  }

  function setApprovalSyncStatus(status: ApprovalSyncStatus) {
    approvalSyncStatus.value = status
  }

  function failLookup(error?: DirectCardLookupError) {
    linkId.value = null
    lookupStatus.value = 'failed'
    lookupError.value = error ?? null
    discoveredCards.value = []
    selectedCardIds.value = []
    optionSelections.value = {}
    activationCompleted.value = false
    approvalSyncStatus.value = 'idle'
  }

  function setCardSelected(cardId: string, selected: boolean) {
    if (!selectableCards.value.some((card) => card.id === cardId)) return

    const selectedIds = new Set(selectedCardIds.value)

    if (selected) selectedIds.add(cardId)
    else selectedIds.delete(cardId)

    selectedCardIds.value = [...selectedIds]
  }

  function setAllSelected(selected: boolean) {
    selectedCardIds.value = selected ? selectableCards.value.map((card) => card.id) : []
  }

  function setOptionSelection(cardId: string, optionGroupId: string, optionChoiceId: string) {
    const card = discoveredCards.value.find((item) => item.id === cardId)
    const group = card?.optionGroups?.find((item) => item.optionGroupId === optionGroupId)

    if (!group?.choices.some((choice) => choice.optionChoiceId === optionChoiceId)) return

    optionSelections.value = {
      ...optionSelections.value,
      [cardId]: {
        ...optionSelections.value[cardId],
        [optionGroupId]: optionChoiceId,
      },
    }
  }

  function reset() {
    issuerId.value = null
    linkId.value = null
    lookupStatus.value = 'idle'
    lookupError.value = null
    discoveredCards.value = []
    selectedCardIds.value = []
    optionSelections.value = {}
    activationCompleted.value = false
    approvalSyncStatus.value = 'idle'
  }

  return {
    issuerId,
    linkId,
    lookupStatus,
    lookupError,
    discoveredCards,
    selectableCards,
    selectedCardIds,
    selectedCards,
    optionSelections,
    hasCompleteOptionSelections,
    activationCompleted,
    approvalSyncStatus,
    beginLookup,
    completeLookup,
    completeCardLink,
    completeCardLinkCards,
    updateCardLinkCard,
    completeActivation,
    setApprovalSyncStatus,
    failLookup,
    setCardSelected,
    setAllSelected,
    setOptionSelection,
    reset,
  }
})

function extractCardLast4(cardNo: string | null) {
  return cardNo?.replace(/\D/g, '').slice(-4) ?? ''
}
