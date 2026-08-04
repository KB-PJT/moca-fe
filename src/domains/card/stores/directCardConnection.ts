import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
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

export const useDirectCardConnectionStore = defineStore('directCardConnection', () => {
  const issuerId = ref<CardIssuerId | null>(null)
  const linkId = ref<string | null>(null)
  const includeCardImages = ref(true)
  const lookupStatus = ref<DirectCardLookupStatus>('idle')
  const lookupError = ref<DirectCardLookupError | null>(null)
  const discoveredCards = ref<DiscoveredCard[]>([])
  const selectedCardIds = ref<string[]>([])
  const optionSelections = ref<Record<string, Record<string, string>>>({})

  const selectableCards = computed(() =>
    discoveredCards.value.filter((card) => card.matched !== false && card.userCardId !== null),
  )

  const selectedCards = computed(() => {
    const selectedIds = new Set(selectedCardIds.value)
    return discoveredCards.value.filter((card) => selectedIds.has(card.id))
  })

  const hasCompleteOptionSelections = computed(() =>
    selectedCards.value.every((card) =>
      (card.optionGroups ?? []).every(
        (group) => optionSelections.value[card.id]?.[group.optionGroupId],
      ),
    ),
  )

  function beginLookup(targetIssuerId: CardIssuerId, shouldIncludeCardImages: boolean) {
    issuerId.value = targetIssuerId
    linkId.value = null
    includeCardImages.value = shouldIncludeCardImages
    lookupStatus.value = 'looking-up'
    lookupError.value = null
    discoveredCards.value = []
    selectedCardIds.value = []
    optionSelections.value = {}
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
    if (!issuerId.value) return

    linkId.value = response.linkId
    completeLookup(
      response.cards.map((card, index) => ({
        id:
          card.userCardId ??
          card.cardId ??
          `${response.institutionCode}-${index}-${card.cardNo ?? card.cardName}`,
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

  function failLookup(error?: DirectCardLookupError) {
    linkId.value = null
    lookupStatus.value = 'failed'
    lookupError.value = error ?? null
    discoveredCards.value = []
    selectedCardIds.value = []
    optionSelections.value = {}
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
    includeCardImages.value = true
    lookupStatus.value = 'idle'
    lookupError.value = null
    discoveredCards.value = []
    selectedCardIds.value = []
    optionSelections.value = {}
  }

  return {
    issuerId,
    linkId,
    includeCardImages,
    lookupStatus,
    lookupError,
    discoveredCards,
    selectableCards,
    selectedCardIds,
    selectedCards,
    optionSelections,
    hasCompleteOptionSelections,
    beginLookup,
    completeLookup,
    completeCardLink,
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
