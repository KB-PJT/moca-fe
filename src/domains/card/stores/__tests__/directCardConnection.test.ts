import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'

describe('useDirectCardConnectionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('조회 결과의 모든 카드를 기본 선택하고 개별·전체 선택을 변경한다', () => {
    const store = useDirectCardConnectionStore()
    const cards = [
      { id: 'card-1', issuer: 'kb-kookmin' as const, name: '카드 1', last4: '1111' },
      { id: 'card-2', issuer: 'kb-kookmin' as const, name: '카드 2', last4: '2222' },
    ]

    store.beginLookup('kb-kookmin')
    store.completeLookup(cards)

    expect(store.lookupStatus).toBe('success')
    expect(store.selectedCards).toHaveLength(2)

    store.setCardSelected('card-2', false)
    expect(store.selectedCardIds).toEqual(['card-1'])

    store.setAllSelected(false)
    expect(store.selectedCards).toHaveLength(0)

    store.failLookup()
    expect(store.lookupStatus).toBe('failed')
    expect(store.discoveredCards).toHaveLength(0)
  })

  it('미매칭 카드를 선택에서 제외하고 선택형 카드의 모든 옵션을 검증한다', () => {
    const store = useDirectCardConnectionStore()

    store.beginLookup('kb-kookmin')
    store.completeLookup([
      {
        id: 'matched-card',
        userCardId: 'matched-card',
        issuer: 'kb-kookmin',
        name: '선택형 카드',
        last4: '1111',
        matched: true,
        optionGroups: [
          {
            optionGroupId: 'benefit-group',
            groupKey: 'benefit',
            groupName: '혜택 패키지',
            choices: [
              {
                optionChoiceId: 'shopping-choice',
                choiceKey: 'shopping',
                choiceName: '쇼핑 중심',
              },
            ],
          },
        ],
      },
      {
        id: 'unmatched-card',
        userCardId: null,
        issuer: 'kb-kookmin',
        name: '미매칭 카드',
        last4: '2222',
        matched: false,
      },
      {
        id: 'unsupported-card',
        userCardId: 'unsupported-card',
        issuer: 'kb-kookmin',
        name: '미지원 카드',
        last4: '3333',
        matched: true,
        supported: false,
      },
    ])

    expect(store.selectedCardIds).toEqual(['matched-card'])
    expect(store.hasCompleteOptionSelections).toBe(false)

    store.setCardSelected('unmatched-card', true)
    expect(store.selectedCardIds).toEqual(['matched-card'])

    store.setCardSelected('unsupported-card', true)
    expect(store.selectedCardIds).toEqual(['matched-card'])

    store.selectedCardIds = ['matched-card', 'unmatched-card', 'unsupported-card']
    expect(store.selectedCards.map((card) => card.id)).toEqual(['matched-card'])

    store.setOptionSelection('matched-card', 'benefit-group', 'shopping-choice')
    expect(store.optionSelections).toEqual({
      'matched-card': { 'benefit-group': 'shopping-choice' },
    })
    expect(store.hasCompleteOptionSelections).toBe(true)
  })

  it('카드 연동 API 응답을 화면 모델로 변환하고 linkId를 보관한다', () => {
    const store = useDirectCardConnectionStore()

    store.beginLookup('kb-kookmin')
    store.completeCardLink({
      linkId: 'card-link-id',
      institutionCode: '0301',
      status: 'PENDING_CARD_ACTIVATION',
      cards: [
        {
          userCardId: 'user-card-id',
          cardId: 'card-id',
          cardName: 'KB 선택형 카드',
          cardNo: '943646******1069',
          institutionCode: '0301',
          issuerName: 'KB카드',
          cardType: 'CREDIT',
          cardImageUrl: 'https://example.com/card.png',
          matched: true,
          supported: true,
          optionGroups: [
            {
              optionGroupId: 'benefit-group',
              groupKey: 'benefit',
              groupName: '혜택 패키지',
              choices: [
                {
                  optionChoiceId: 'shopping-choice',
                  choiceKey: 'shopping',
                  choiceName: '쇼핑 중심',
                },
              ],
            },
          ],
        },
        {
          userCardId: null,
          cardId: null,
          cardName: '미매칭 카드',
          cardNo: null,
          institutionCode: '0301',
          issuerName: 'KB카드',
          cardType: 'UNKNOWN',
          cardImageUrl: null,
          matched: false,
          supported: false,
          optionGroups: [],
        },
      ],
    })

    expect(store.linkId).toBe('card-link-id')
    expect(store.lookupStatus).toBe('success')
    expect(store.discoveredCards[0]).toMatchObject({
      id: 'user-card-id',
      userCardId: 'user-card-id',
      cardId: 'card-id',
      issuer: 'kb-kookmin',
      name: 'KB 선택형 카드',
      last4: '1069',
      cardNo: '943646******1069',
      issuerName: 'KB카드',
      cardType: 'CREDIT',
      imageUrl: 'https://example.com/card.png',
    })
    expect(store.discoveredCards[0]?.optionGroups?.[0]?.choices[0]?.choiceName).toBe('쇼핑 중심')
    expect(store.discoveredCards[1]?.id).toBe('0301-1-미매칭 카드')
    expect(store.selectedCardIds).toEqual(['user-card-id'])
  })

  it('조회 오류를 저장하고 다음 조회 시작 시 초기화한다', () => {
    const store = useDirectCardConnectionStore()

    store.beginLookup('kb-kookmin')
    store.failLookup({ code: 'CARD_LINK_FAILED', message: '카드를 조회하지 못했습니다.' })

    expect(store.lookupStatus).toBe('failed')
    expect(store.lookupError).toEqual({
      code: 'CARD_LINK_FAILED',
      message: '카드를 조회하지 못했습니다.',
    })

    store.beginLookup('hyundai')
    expect(store.lookupError).toBeNull()
    expect(store.linkId).toBeNull()
  })

  it('카드별 인증정보 저장 응답으로 해당 카드 정보를 갱신한다', () => {
    const store = useDirectCardConnectionStore()
    store.beginLookup('hyundai')
    store.completeLookup([
      {
        id: 'user-card-id',
        userCardId: 'user-card-id',
        issuer: 'hyundai',
        name: '기존 카드명',
        last4: '5678',
      },
    ])

    store.updateCardLinkCard({
      userCardId: 'user-card-id',
      cardId: 'card-id',
      cardName: '현대카드',
      cardNo: '1234********5678',
      institutionCode: '0302',
      issuerName: '현대카드',
      cardType: 'CREDIT',
      cardImageUrl: 'https://example.com/card.png',
      matched: true,
      supported: true,
      optionGroups: [],
    })

    expect(store.discoveredCards[0]).toMatchObject({
      id: 'user-card-id',
      cardId: 'card-id',
      name: '현대카드',
      last4: '5678',
      imageUrl: 'https://example.com/card.png',
      matched: true,
      supported: true,
    })
  })
})
