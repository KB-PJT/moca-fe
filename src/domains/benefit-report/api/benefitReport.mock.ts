export type BenefitType = 'discount' | 'cashback' | 'point'

export interface BenefitBreakdownItem {
  type: BenefitType
  label: string
  amount: number
}

export interface MonthlyBenefitSummary {
  periodYm: string
  totalAmount: number
  breakdown: BenefitBreakdownItem[]
}

export const BENEFIT_TYPE_COLORS: Record<BenefitType, string> = {
  discount: '#ff8836', // --color-primary
  cashback: '#a67c52', // --color-brown
  point: '#d6b98c', // --color-brown-light
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
  },
  {
    periodYm: '2026-07',
    totalAmount: 38200,
    breakdown: [
      { type: 'discount', label: '할인', amount: 21000 },
      { type: 'cashback', label: '캐시백', amount: 8500 },
      { type: 'point', label: '포인트', amount: 8700 },
    ],
  },
]
