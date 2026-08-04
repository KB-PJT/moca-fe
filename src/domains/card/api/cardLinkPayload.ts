import type {
  ActivateCardLinkCardsRequest,
  CardOptionGroupResponse,
  CreateCardLinkRequest,
  UserCardOptionSelectionsRequest,
} from '@/domains/card/api/cardLinks'
import {
  CARD_CONNECTION_CONFIGS,
  type CardConnectionFieldKey,
} from '@/domains/card/constants/cardConnection'
import { CARD_ISSUERS, type CardIssuerId } from '@/domains/card/constants/cardIssuers'

export type CardConnectionValues = Partial<Record<CardConnectionFieldKey, string>>

export interface SelectedCardForActivation {
  id: string
  userCardId?: string | null
  optionGroups?: readonly CardOptionGroupResponse[]
}

export type CardOptionSelectionsByCardId = Readonly<
  Record<string, Readonly<Record<string, string>>>
>

export type CardLinkPayloadValidationReason =
  | 'NO_ACTIVE_CARDS'
  | 'INVALID_USER_CARD'
  | 'MISSING_OPTION_SELECTION'
  | 'INVALID_OPTION_SELECTION'

export class CardLinkPayloadValidationError extends Error {
  constructor(
    readonly reason: CardLinkPayloadValidationReason,
    message: string,
  ) {
    super(message)
    this.name = 'CardLinkPayloadValidationError'
  }
}

export function buildCreateCardLinkRequest(
  issuerId: CardIssuerId,
  values: CardConnectionValues,
): CreateCardLinkRequest {
  const config = CARD_CONNECTION_CONFIGS[issuerId]
  const visibleFieldKeys = new Set(
    [...config.loginFields, ...config.additionalFields].map((field) => field.key),
  )
  const request: CreateCardLinkRequest = {
    institutionCode: CARD_ISSUERS[issuerId].institutionCode,
  }

  if (visibleFieldKeys.has('homepageId') && hasValue(values.homepageId)) {
    request.id = values.homepageId
  }
  if (visibleFieldKeys.has('homepagePassword') && hasValue(values.homepagePassword)) {
    request.password = values.homepagePassword
  }
  if (visibleFieldKeys.has('cardNumber') && hasValue(values.cardNumber)) {
    request.cardNo = values.cardNumber
  }
  if (visibleFieldKeys.has('cardPassword') && hasValue(values.cardPassword)) {
    request.cardPassword = values.cardPassword
  }
  if (visibleFieldKeys.has('birthDate') && hasValue(values.birthDate)) {
    request.birthDate = values.birthDate
  }

  return request
}

export function buildActivateCardLinkCardsRequest(
  selectedCards: readonly SelectedCardForActivation[],
  optionSelections: CardOptionSelectionsByCardId,
): ActivateCardLinkCardsRequest {
  if (selectedCards.length === 0) {
    throw new CardLinkPayloadValidationError(
      'NO_ACTIVE_CARDS',
      '활성화할 카드를 한 장 이상 선택해 주세요.',
    )
  }

  const activeUserCardIds: string[] = []
  const selectedCardOptions: UserCardOptionSelectionsRequest[] = []

  for (const card of selectedCards) {
    if (!card.userCardId) {
      throw new CardLinkPayloadValidationError(
        'INVALID_USER_CARD',
        '매칭되지 않은 카드는 활성화할 수 없습니다.',
      )
    }

    activeUserCardIds.push(card.userCardId)

    const groups = card.optionGroups ?? []
    if (groups.length === 0) continue

    selectedCardOptions.push({
      userCardId: card.userCardId,
      optionSelections: groups.map((group) => {
        const optionChoiceId = optionSelections[card.id]?.[group.optionGroupId]

        if (!optionChoiceId) {
          throw new CardLinkPayloadValidationError(
            'MISSING_OPTION_SELECTION',
            `${group.groupName} 옵션을 선택해 주세요.`,
          )
        }
        if (!group.choices.some((choice) => choice.optionChoiceId === optionChoiceId)) {
          throw new CardLinkPayloadValidationError(
            'INVALID_OPTION_SELECTION',
            `${group.groupName}에 유효하지 않은 옵션이 선택되었습니다.`,
          )
        }

        return {
          optionGroupId: group.optionGroupId,
          optionChoiceId,
        }
      }),
    })
  }

  const request: ActivateCardLinkCardsRequest = { activeUserCardIds }
  if (selectedCardOptions.length > 0) request.optionSelections = selectedCardOptions

  return request
}

function hasValue(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0
}
