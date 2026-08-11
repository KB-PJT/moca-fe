// 실적 리포트 탭 전용 목업. 혜택 리포트 탭(benefitReport.ts)과는 별개 작업으로,
// GET /reports/performances/summary, GET /reports/performances/cards 연동 전까지 사용한다.
export interface CardPerformance {
  cardId: string
  cardName: string
  cardImageUrl: string | null
  accentColor: string
  currentAmount: number
  previousAmount: number
  tier1TargetAmount: number
  tier2TargetAmount: number
}

export const MOCK_CARD_PERFORMANCES: CardPerformance[] = [
  {
    cardId: 'kb-wesh',
    cardName: 'KB My WE:SH',
    cardImageUrl: null,
    accentColor: '#ff9c70',
    currentAmount: 382_000,
    previousAmount: 310_000,
    tier1TargetAmount: 250_000,
    tier2TargetAmount: 500_000,
  },
  {
    cardId: 'shinhan-deep-dream',
    cardName: '신한 Deep Dream',
    cardImageUrl: null,
    accentColor: '#3f6d5e',
    currentAmount: 300_000,
    previousAmount: 270_000,
    tier1TargetAmount: 150_000,
    tier2TargetAmount: 300_000,
  },
  {
    cardId: 'hyundai-zero-edition',
    cardName: '현대 Zero Edition',
    cardImageUrl: null,
    accentColor: '#4c535d',
    currentAmount: 162_000,
    previousAmount: 195_000,
    tier1TargetAmount: 200_000,
    tier2TargetAmount: 300_000,
  },
]
