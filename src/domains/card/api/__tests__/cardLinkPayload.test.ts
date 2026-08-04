import { describe, expect, it } from 'vitest'
import {
  buildActivateCardLinkCardsRequest,
  buildCreateCardLinkRequest,
  CardLinkPayloadValidationError,
  type CardLinkPayloadValidationReason,
  type CardOptionSelectionsByCardId,
  type SelectedCardForActivation,
} from '@/domains/card/api/cardLinkPayload'

interface InvalidPayloadCase {
  name: string
  cards: SelectedCardForActivation[]
  selections: CardOptionSelectionsByCardId
  reason: CardLinkPayloadValidationReason
}

const INVALID_PAYLOAD_CASES: InvalidPayloadCase[] = [
  {
    name: '선택 카드 없음',
    cards: [],
    selections: {},
    reason: 'NO_ACTIVE_CARDS',
  },
  {
    name: '미매칭 카드',
    cards: [{ id: 'unmatched-card', userCardId: null }],
    selections: {},
    reason: 'INVALID_USER_CARD',
  },
  {
    name: '필수 옵션 누락',
    cards: [
      {
        id: 'option-card',
        userCardId: 'option-user-card',
        optionGroups: [
          {
            optionGroupId: 'benefit-group',
            groupKey: 'benefit',
            groupName: '혜택 패키지',
            choices: [
              {
                optionChoiceId: 'shopping-choice',
                choiceKey: 'shopping',
                choiceName: '쇼핑형',
              },
            ],
          },
        ],
      },
    ],
    selections: {},
    reason: 'MISSING_OPTION_SELECTION',
  },
  {
    name: '유효하지 않은 옵션',
    cards: [
      {
        id: 'option-card',
        userCardId: 'option-user-card',
        optionGroups: [
          {
            optionGroupId: 'benefit-group',
            groupKey: 'benefit',
            groupName: '혜택 패키지',
            choices: [
              {
                optionChoiceId: 'shopping-choice',
                choiceKey: 'shopping',
                choiceName: '쇼핑형',
              },
            ],
          },
        ],
      },
    ],
    selections: { 'option-card': { 'benefit-group': 'invalid-choice' } },
    reason: 'INVALID_OPTION_SELECTION',
  },
]

describe('cardLink payload', () => {
  it('KB 입력값을 카드 연동 요청 필드로 변환한다', () => {
    expect(
      buildCreateCardLinkRequest('kb-kookmin', {
        homepageId: 'moca-user',
        homepagePassword: 'secret',
        cardNumber: '1234123412341234',
        cardPassword: '12',
        birthDate: '19950101',
      }),
    ).toEqual({
      institutionCode: '0301',
      id: 'moca-user',
      password: 'secret',
      cardNo: '1234123412341234',
      cardPassword: '12',
    })
  })

  it('카드사 화면에 없는 필드와 빈 값은 요청에서 제외한다', () => {
    expect(
      buildCreateCardLinkRequest('samsung', {
        homepageId: 'moca-user',
        homepagePassword: 'secret',
        cardNumber: '1234123412341234',
        cardPassword: '',
      }),
    ).toEqual({
      institutionCode: '0303',
      id: 'moca-user',
      password: 'secret',
    })

    expect(
      buildCreateCardLinkRequest('woori', {
        homepageId: 'moca-user',
        homepagePassword: 'secret',
        birthDate: '19950101',
      }),
    ).toEqual({
      institutionCode: '0309',
      id: 'moca-user',
      password: 'secret',
      birthDate: '19950101',
    })
  })

  it('선택 카드와 옵션을 활성화 요청으로 변환한다', () => {
    const request = buildActivateCardLinkCardsRequest(
      [
        { id: 'plain-card', userCardId: 'plain-user-card' },
        {
          id: 'option-card',
          userCardId: 'option-user-card',
          optionGroups: [
            {
              optionGroupId: 'benefit-group',
              groupKey: 'benefit',
              groupName: '혜택 패키지',
              choices: [
                {
                  optionChoiceId: 'shopping-choice',
                  choiceKey: 'shopping',
                  choiceName: '쇼핑형',
                },
              ],
            },
          ],
        },
      ],
      { 'option-card': { 'benefit-group': 'shopping-choice' } },
    )

    expect(request).toEqual({
      activeUserCardIds: ['plain-user-card', 'option-user-card'],
      optionSelections: [
        {
          userCardId: 'option-user-card',
          optionSelections: [{ optionGroupId: 'benefit-group', optionChoiceId: 'shopping-choice' }],
        },
      ],
    })
  })

  it('옵션 없는 카드만 선택하면 optionSelections를 생략한다', () => {
    expect(
      buildActivateCardLinkCardsRequest([{ id: 'plain-card', userCardId: 'plain-user-card' }], {}),
    ).toEqual({ activeUserCardIds: ['plain-user-card'] })
  })

  it.each(INVALID_PAYLOAD_CASES)('$name 요청을 차단한다', ({ cards, selections, reason }) => {
    expect(() => buildActivateCardLinkCardsRequest(cards, selections)).toThrowError(
      expect.objectContaining<Partial<CardLinkPayloadValidationError>>({ reason }),
    )
  })
})
