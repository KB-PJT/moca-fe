import apiClient from '@/shared/api/client'

export type BenefitType = 'DISCOUNT' | 'CASHBACK' | 'POINT' | 'MILEAGE'
export type CalculationStatus = 'APPLIED' | 'PARTIALLY_APPLIED' | 'NOT_APPLIED' | 'NOT_CALCULATED'

export interface PerformanceShortfall {
  requiredAmount: number
  achievedAmount: number
  remainingAmount: number
}

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
  performanceShortfall?: PerformanceShortfall | null
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
  missedBenefitAmount: number
  paymentAmount: number
  calculationStatus: CalculationStatus
  rejectionReason: string | null
  performanceShortfall: PerformanceShortfall | null
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

function removeMaskedCardNumber(cardName: string): string {
  return cardName.replace(/\s+\d[\d*\s-]*$/, '').trim()
}

export function toRecentBenefitItem(benefit: RecentBenefitResponse): RecentBenefitItem {
  const hasBenefit = Boolean(benefit.benefitType && benefit.benefitAmount > 0)
  const hasMissedBenefit = Boolean(benefit.benefitType && benefit.missedBenefitAmount > 0)

  return {
    id: benefit.approvalId,
    merchantName: benefit.merchantName,
    benefitType:
      (hasBenefit || hasMissedBenefit) && benefit.benefitType
        ? benefitTypeLabels[benefit.benefitType]
        : null,
    description:
      hasBenefit || hasMissedBenefit ? (benefit.benefitTitle ?? '적용 혜택') : '일반 결제',
    cardName: removeMaskedCardNumber(benefit.cardName),
    cardLastFour: '',
    benefitAmount: benefit.benefitAmount,
    missedBenefitAmount: benefit.missedBenefitAmount,
    paymentAmount: benefit.paymentAmount,
    calculationStatus: benefit.calculationStatus,
    rejectionReason: benefit.rejectionReason,
    performanceShortfall: benefit.performanceShortfall ?? null,
    occurredAt: formatOccurredAt(benefit.occurredAt),
    monthlyBenefitUsed: 0,
    monthlyBenefitLimit: 0,
  }
}

export interface RecentBenefitsParams {
  yearMonth?: string
  limit?: number
  userCardId?: string
}

export async function fetchRecentBenefits({
  yearMonth,
  limit = 5,
  userCardId,
}: RecentBenefitsParams = {}): Promise<RecentBenefitItem[]> {
  const response = await apiClient.get<RecentBenefitsApiResponse>('/api/v1/home/recent-history', {
    params: {
      ...(yearMonth ? { yearMonth } : {}),
      limit,
      ...(userCardId ? { userCardId } : {}),
    },
  })

  return response.data.data.history.map(toRecentBenefitItem)
}
