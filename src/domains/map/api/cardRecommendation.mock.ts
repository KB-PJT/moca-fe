// BEN-001 (POST /api/v1/benefits/estimate) 응답 필드 그대로.
// 실제 API 연동 시 이 타입 유지하고 데이터만 fetch로 교체하면 된다.
export interface CardRecommendation {
  rank: number
  cardId: string
  cardName: string
  imageUrl?: string | null
  estimatedBenefit: number
  benefitType: '할인' | '적립' | '무료'
  reason: string
  performanceStatus: '충족' | '미충족'
  remainingCap: number

  // 아래 필드들은 BEN-001 실제 응답에는 없는 UI 목업 전용 필드.
  // 실제 API가 이 값들을 내려주면 그대로 교체하고, 안 내려주면 화면에서 뺀다.
  discountRate: number
  minPaymentAmount: number
  performanceCurrentAmount: number
  performanceRequiredAmount: number
}

// placeId 기준. 혜택이 없는 가맹점(hasBenefit: false)은 여기 없다.
export const cardRecommendationByPlaceId: Record<string, CardRecommendation> = {
  '1': {
    rank: 1,
    cardId: 'card-shinhan-deepdream',
    cardName: '신한카드 Deep Dream',
    estimatedBenefit: 3000,
    benefitType: '할인',
    reason: '실적 조건 충족',
    performanceStatus: '충족',
    remainingCap: 27000,
    discountRate: 10,
    minPaymentAmount: 10000,
    performanceCurrentAmount: 246000,
    performanceRequiredAmount: 300000,
  },
  '2': {
    rank: 1,
    cardId: 'card-kb-mywesh',
    cardName: 'KB My WE:SH',
    estimatedBenefit: 690,
    benefitType: '할인',
    reason: '카페 10% 할인',
    performanceStatus: '충족',
    remainingCap: 12400,
    discountRate: 10,
    minPaymentAmount: 10000,
    performanceCurrentAmount: 152000,
    performanceRequiredAmount: 200000,
  },
  '4': {
    rank: 1,
    cardId: 'card-hyundai-m',
    cardName: '현대카드 M',
    estimatedBenefit: 1500,
    benefitType: '적립',
    reason: '마트 5% 적립',
    performanceStatus: '미충족',
    remainingCap: 30000,
    discountRate: 5,
    minPaymentAmount: 30000,
    performanceCurrentAmount: 120000,
    performanceRequiredAmount: 300000,
  },
  '6': {
    rank: 1,
    cardId: 'card-samsung-taptapo',
    cardName: '삼성카드 taptap O',
    estimatedBenefit: 1050,
    benefitType: '할인',
    reason: '카페 15% 할인',
    performanceStatus: '충족',
    remainingCap: 8000,
    discountRate: 15,
    minPaymentAmount: 5000,
    performanceCurrentAmount: 90000,
    performanceRequiredAmount: 100000,
  },
  '7': {
    rank: 1,
    cardId: 'card-lotte-loca',
    cardName: '롯데카드 LOCA',
    estimatedBenefit: 500,
    benefitType: '적립',
    reason: '편의점 5% 적립',
    performanceStatus: '충족',
    remainingCap: 15000,
    discountRate: 5,
    minPaymentAmount: 5000,
    performanceCurrentAmount: 90000,
    performanceRequiredAmount: 150000,
  },
}
