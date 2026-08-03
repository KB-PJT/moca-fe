// 실제 API 스펙에 정확히 대응하는 엔드포인트가 아직 없는 UI 목업 전용 데이터.
// "이 가맹점에서 내가 보유한 카드들의 혜택 순위" — CARD-004(보유 카드 목록) + BEN-001(혜택 추정)을
// 조합한 형태의 응답이 될 가능성이 높음. 실제 API 나오면 이 타입 기준으로 교체.
export interface MyCardRankItem {
  rank: number
  cardName: string
  imageUrl?: string | null
  benefitLabel: string
  performanceMet: boolean
  performanceCurrentAmount: number
  performanceRequiredAmount: number
}

// placeId 기준. cardRecommendationByPlaceId에 항목이 있는 가맹점만 존재.
export const myCardRankingByPlaceId: Record<string, MyCardRankItem[]> = {
  '1': [
    {
      rank: 1,
      cardName: 'Deep Dream',
      benefitLabel: '10% 할인',
      performanceMet: true,
      performanceCurrentAmount: 246000,
      performanceRequiredAmount: 300000,
    },
    {
      rank: 2,
      cardName: 'My WE:SH',
      benefitLabel: '5% 할인',
      performanceMet: false,
      performanceCurrentAmount: 80000,
      performanceRequiredAmount: 200000,
    },
    {
      rank: 3,
      cardName: 'Zero Edition',
      benefitLabel: '0.5% 캐시백',
      performanceMet: true,
      performanceCurrentAmount: 0,
      performanceRequiredAmount: 0,
    },
  ],
  '2': [
    {
      rank: 1,
      cardName: 'My WE:SH',
      benefitLabel: '10% 할인',
      performanceMet: false,
      performanceCurrentAmount: 120000,
      performanceRequiredAmount: 200000,
    },
    {
      rank: 2,
      cardName: 'Deep Dream',
      benefitLabel: '3% 적립',
      performanceMet: true,
      performanceCurrentAmount: 246000,
      performanceRequiredAmount: 300000,
    },
    {
      rank: 3,
      cardName: 'Zero Edition',
      benefitLabel: '0.5% 캐시백',
      performanceMet: true,
      performanceCurrentAmount: 0,
      performanceRequiredAmount: 0,
    },
  ],
  '4': [
    {
      rank: 1,
      cardName: '현대카드 M',
      benefitLabel: '5% 적립',
      performanceMet: false,
      performanceCurrentAmount: 120000,
      performanceRequiredAmount: 300000,
    },
    {
      rank: 2,
      cardName: 'Zero Edition',
      benefitLabel: '0.5% 캐시백',
      performanceMet: true,
      performanceCurrentAmount: 0,
      performanceRequiredAmount: 0,
    },
    {
      rank: 3,
      cardName: 'My WE:SH',
      benefitLabel: '1% 적립',
      performanceMet: true,
      performanceCurrentAmount: 152000,
      performanceRequiredAmount: 200000,
    },
  ],
  '6': [
    {
      rank: 1,
      cardName: 'taptap O',
      benefitLabel: '15% 할인',
      performanceMet: true,
      performanceCurrentAmount: 90000,
      performanceRequiredAmount: 100000,
    },
    {
      rank: 2,
      cardName: 'Deep Dream',
      benefitLabel: '5% 할인',
      performanceMet: true,
      performanceCurrentAmount: 246000,
      performanceRequiredAmount: 300000,
    },
    {
      rank: 3,
      cardName: 'My WE:SH',
      benefitLabel: '3% 할인',
      performanceMet: false,
      performanceCurrentAmount: 80000,
      performanceRequiredAmount: 200000,
    },
  ],
  '7': [
    {
      rank: 1,
      cardName: 'LOCA',
      benefitLabel: '5% 적립',
      performanceMet: true,
      performanceCurrentAmount: 90000,
      performanceRequiredAmount: 150000,
    },
    {
      rank: 2,
      cardName: 'Zero Edition',
      benefitLabel: '0.5% 캐시백',
      performanceMet: true,
      performanceCurrentAmount: 0,
      performanceRequiredAmount: 0,
    },
    {
      rank: 3,
      cardName: '현대카드 M',
      benefitLabel: '2% 적립',
      performanceMet: false,
      performanceCurrentAmount: 120000,
      performanceRequiredAmount: 300000,
    },
  ],
}
