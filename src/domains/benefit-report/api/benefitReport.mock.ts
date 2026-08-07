export type BenefitType = 'discount' | 'cashback' | 'point'

export interface BenefitBreakdownItem {
  type: BenefitType
  label: string
  amount: number
}

export interface CategorySavingItem {
  rank: 1 | 2 | 3
  category: string
  amount: number
}

export interface MonthlyBenefitSummary {
  periodYm: string
  totalAmount: number
  breakdown: BenefitBreakdownItem[]
  categoryTop3: CategorySavingItem[]
}

export const BENEFIT_TYPE_COLORS: Record<BenefitType, string> = {
  discount: '#ff8836', // --color-primary
  cashback: '#a67c52', // --color-brown
  point: '#d6b98c', // --color-brown-light
}

export const PODIUM_RANK_COLORS: Record<1 | 2 | 3, string> = {
  1: '#ff8836', // --color-primary
  2: '#a67c52', // --color-brown
  3: '#d6b98c', // --color-brown-light
}

export type MissedBenefitUnit = 'won' | 'point'

export interface MissedBenefitCondition {
  label: string
  unit: MissedBenefitUnit
  currentAmount: number
  targetAmount: number
}

export interface MissedBenefitCard {
  cardId: string
  cardName: string
  cardImageUrl: string | null
  accentColor: string
  conditions: MissedBenefitCondition[]
}

export const MOCK_MISSED_BENEFIT_CARDS: MissedBenefitCard[] = [
  {
    cardId: 'shinhan-deep-dream',
    cardName: '신한 Deep Dream',
    cardImageUrl: null,
    accentColor: '#3f6d5e',
    conditions: [
      { label: '카페 할인', unit: 'won', currentAmount: 3000, targetAmount: 5000 },
      { label: '배달 할인', unit: 'won', currentAmount: 1000, targetAmount: 5000 },
      { label: '포인트 적립', unit: 'point', currentAmount: 800, targetAmount: 3000 },
    ],
  },
  {
    cardId: 'kb-wesh',
    cardName: 'KB My WE:SH',
    cardImageUrl: null,
    accentColor: '#ff9c70',
    conditions: [
      { label: '편의점 할인', unit: 'won', currentAmount: 4000, targetAmount: 5000 },
      { label: '포인트 적립', unit: 'point', currentAmount: 1500, targetAmount: 2000 },
    ],
  },
]

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

export const MOCK_MONTHLY_BENEFIT_SUMMARIES: MonthlyBenefitSummary[] = [
  {
    periodYm: '2026-06',
    totalAmount: 31800,
    breakdown: [
      { type: 'discount', label: '할인', amount: 17000 },
      { type: 'cashback', label: '캐시백', amount: 8000 },
      { type: 'point', label: '포인트', amount: 6800 },
    ],
    categoryTop3: [
      { rank: 1, category: '카페', amount: 10200 },
      { rank: 2, category: '편의점', amount: 7100 },
      { rank: 3, category: '교통', amount: 5400 },
    ],
  },
  {
    periodYm: '2026-07',
    totalAmount: 38200,
    breakdown: [
      { type: 'discount', label: '할인', amount: 21000 },
      { type: 'cashback', label: '캐시백', amount: 8500 },
      { type: 'point', label: '포인트', amount: 8700 },
    ],
    categoryTop3: [
      { rank: 1, category: '카페', amount: 12500 },
      { rank: 2, category: '편의점', amount: 8200 },
      { rank: 3, category: '교통', amount: 6000 },
    ],
  },
]
