import apiClient from '@/shared/api/client'

export type BenefitType = 'DISCOUNT' | 'CASHBACK' | 'POINT' | 'MILEAGE'
export type CalculationStatus = 'APPLIED' | 'PARTIALLY_APPLIED' | 'NOT_APPLIED' | 'UNCALCULATED'

export interface RecentBenefitResponse {
  approvalId: string
  benefitHistoryId: string | null
  merchantName: string
  benefitType: BenefitType | null
  benefitTitle: string | null
  cardName: string
  paymentAmount: number
  benefitAmount: number
  missedBenefitAmount: number
  calculationStatus: CalculationStatus
  rejectionReason: string | null
  occurredAt: string
}

interface RecentBenefitsApiResponse {
  success: boolean
  data: {
    history: RecentBenefitResponse[]
  }
}

export interface RecentBenefitItem {
  id: string
  merchantName: string
  benefitType: '할인' | '캐시백' | '포인트' | '마일리지' | null
  description: string
  cardName: string
  cardLastFour: string
  benefitAmount: number
  paymentAmount: number
  occurredAt: string
  monthlyBenefitUsed: number
  monthlyBenefitLimit: number
}

const benefitTypeLabels: Record<BenefitType, NonNullable<RecentBenefitItem['benefitType']>> = {
  DISCOUNT: '할인',
  CASHBACK: '캐시백',
  POINT: '포인트',
  MILEAGE: '마일리지',
}

function formatOccurredAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${getPart('month')}월 ${getPart('day')}일 ${getPart('hour')}:${getPart('minute')}`
}

export function toRecentBenefitItem(benefit: RecentBenefitResponse): RecentBenefitItem {
  const hasBenefit = Boolean(benefit.benefitType && benefit.benefitAmount > 0)

  return {
    id: benefit.approvalId,
    merchantName: benefit.merchantName,
    benefitType: hasBenefit && benefit.benefitType ? benefitTypeLabels[benefit.benefitType] : null,
    description: hasBenefit ? (benefit.benefitTitle ?? '적용 혜택') : '일반 결제',
    cardName: benefit.cardName,
    cardLastFour: '',
    benefitAmount: benefit.benefitAmount,
    paymentAmount: benefit.paymentAmount,
    occurredAt: formatOccurredAt(benefit.occurredAt),
    monthlyBenefitUsed: 0,
    monthlyBenefitLimit: 0,
  }
}

export async function fetchRecentBenefits(limit = 5): Promise<RecentBenefitItem[]> {
  const response = await apiClient.get<RecentBenefitsApiResponse>('/api/v1/home/recent-history', {
    params: { limit },
  })

  return response.data.data.history.map(toRecentBenefitItem)
}
