// BEN-001 (POST /api/v1/benefits/estimate) 응답 필드 그대로.
// 실제 API 연동 시 이 타입 유지하고 데이터만 fetch로 교체하면 된다.
export interface CardRecommendation {
  rank: number
  cardId: number
  cardName: string
  estimatedBenefit: number
  // TODO: 스펙 표에는 'RATE_DISCOUNT' 예시만 있고 적립/무료 케이스의 실제 enum 값이 없어 확인 필요.
  benefitType: '할인' | '적립' | '무료'
  reason: string
  performanceStatus: { achieved: boolean }
  remainingCap: number

  // 아래 필드들은 BEN-001 실제 응답에는 없는 UI 목업 전용 필드.
  // 실제 API가 이 값들을 내려주면 그대로 교체하고, 안 내려주면 화면에서 뺀다.
  discountRate: number
  minPaymentAmount: number
  performanceCurrentAmount: number
  performanceRequiredAmount: number
  // 상세 페이지의 "추천 이유" 체크리스트. 실제로 적용된 조건만 넣는다(항상 초록 체크로 표시).
  reasons: { label: string; description: string }[]
  // 상세 페이지 하단 약관/유의사항 문구.
  terms: string
}

// placeId 기준. 혜택이 없는 가맹점(hasBenefit: false)은 여기 없다.
export const cardRecommendationByPlaceId: Record<string, CardRecommendation> = {
  '1': {
    rank: 1,
    cardId: 21,
    cardName: '신한카드 Deep Dream',
    estimatedBenefit: 3000,
    benefitType: '할인',
    reason: '실적 조건 충족',
    performanceStatus: { achieved: true },
    remainingCap: 27000,
    discountRate: 10,
    minPaymentAmount: 10000,
    performanceCurrentAmount: 246000,
    performanceRequiredAmount: 300000,
    reasons: [
      {
        label: '실적 조건 충족',
        description: '전월 실적 246,000원으로 조건(300,000원)을 채웠어요',
      },
      {
        label: '음식점 10% 할인 적용',
        description: '군자관 학생식당은 음식점 할인 혜택 대상이에요',
      },
      { label: '월 한도 잔여 충분', description: '이번 달 한도 27,000원이 남아 있어요' },
    ],
    terms:
      '신한카드 Deep Dream은 음식점 업종 결제 시 10% 할인. 전월 실적 300,000원 이상 시 적용되며, 월 최대 3만원까지 할인돼요. 최소결제금액 10,000원 이상.',
  },
  '2': {
    rank: 1,
    cardId: 15,
    cardName: 'KB My WE:SH',
    estimatedBenefit: 690,
    benefitType: '할인',
    reason: '카페 10% 할인',
    performanceStatus: { achieved: true },
    remainingCap: 12400,
    discountRate: 10,
    minPaymentAmount: 10000,
    performanceCurrentAmount: 152000,
    performanceRequiredAmount: 200000,
    reasons: [
      {
        label: '실적 조건 충족',
        description: '전월 실적 152,000원으로 조건(200,000원)을 채웠어요',
      },
      {
        label: '카페 10% 할인 적용',
        description: '세종대 벤치커피는 카페 할인 혜택 대상이에요',
      },
      { label: '월 한도 잔여 충분', description: '이번 달 한도 12,400원이 남아 있어요' },
    ],
    terms:
      'KB My WE:SH는 카페 업종 결제 시 10% 할인. 전월 실적 200,000원 이상 시 적용되며, 월 최대 1.5만원까지 할인돼요. 최소결제금액 10,000원 이상.',
  },
  '4': {
    rank: 1,
    cardId: 33,
    cardName: '현대카드 M',
    estimatedBenefit: 1500,
    benefitType: '적립',
    reason: '마트 5% 적립',
    performanceStatus: { achieved: false },
    remainingCap: 30000,
    discountRate: 5,
    minPaymentAmount: 30000,
    performanceCurrentAmount: 120000,
    performanceRequiredAmount: 300000,
    reasons: [
      {
        label: '실적 조건 충족',
        description: '전월 실적 120,000원으로 조건(300,000원)을 채웠어요',
      },
      { label: '마트 5% 적립 적용', description: '이마트24는 마트 적립 혜택 대상이에요' },
      { label: '월 한도 잔여 충분', description: '이번 달 한도 30,000원이 남아 있어요' },
    ],
    terms:
      '현대카드 M은 마트 업종 결제 시 5% 적립. 전월 실적 300,000원 이상 시 적용되며, 월 최대 3만원까지 적립돼요. 최소결제금액 30,000원 이상.',
  },
  '6': {
    rank: 1,
    cardId: 42,
    cardName: '삼성카드 taptap O',
    estimatedBenefit: 1050,
    benefitType: '할인',
    reason: '카페 15% 할인',
    performanceStatus: { achieved: true },
    remainingCap: 8000,
    discountRate: 15,
    minPaymentAmount: 5000,
    performanceCurrentAmount: 90000,
    performanceRequiredAmount: 100000,
    reasons: [
      {
        label: '실적 조건 충족',
        description: '전월 실적 90,000원으로 조건(100,000원)을 채웠어요',
      },
      { label: '카페 15% 할인 적용', description: '메가커피는 카페 할인 혜택 대상이에요' },
      { label: '월 한도 잔여 충분', description: '이번 달 한도 8,000원이 남아 있어요' },
    ],
    terms:
      '삼성카드 taptap O는 카페 업종 결제 시 15% 할인. 전월 실적 100,000원 이상 시 적용되며, 월 최대 8천원까지 할인돼요. 최소결제금액 5,000원 이상.',
  },
  '7': {
    rank: 1,
    cardId: 58,
    cardName: '롯데카드 LOCA',
    estimatedBenefit: 500,
    benefitType: '적립',
    reason: '편의점 5% 적립',
    performanceStatus: { achieved: true },
    remainingCap: 15000,
    discountRate: 5,
    minPaymentAmount: 5000,
    performanceCurrentAmount: 90000,
    performanceRequiredAmount: 150000,
    reasons: [
      {
        label: '실적 조건 충족',
        description: '전월 실적 90,000원으로 조건(150,000원)을 채웠어요',
      },
      { label: '편의점 5% 적립 적용', description: 'GS25는 편의점 적립 혜택 대상이에요' },
      { label: '월 한도 잔여 충분', description: '이번 달 한도 15,000원이 남아 있어요' },
    ],
    terms:
      '롯데카드 LOCA는 편의점 업종 결제 시 5% 적립. 전월 실적 150,000원 이상 시 적용되며, 월 최대 1.5만원까지 적립돼요. 최소결제금액 5,000원 이상.',
  },
}
