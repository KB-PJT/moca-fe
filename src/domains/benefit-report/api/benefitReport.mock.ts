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
