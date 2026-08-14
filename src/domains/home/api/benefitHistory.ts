import apiClient from '@/shared/api/client'
import {
  toRecentBenefitItem,
  type BenefitType,
  type RecentBenefitItem,
} from '@/domains/home/api/recentBenefits'

interface BenefitHistoryResponseItem {
  benefitHistoryId: string
  merchantName: string
  approvedAt: string
  paymentAmount: number
  benefitAmount: number
  missedBenefitAmount: number
  benefitType: BenefitType
  benefitTitle: string
  userCardId: string
  cardName: string
  calculationStatus: 'APPLIED' | 'PARTIALLY_APPLIED' | 'NOT_APPLIED' | 'UNCALCULATED'
  rejectionReason: string | null
  performanceShortfall: {
    requiredAmount: number
    achievedAmount: number
    remainingAmount: number
  } | null
}

export interface BenefitHistorySummary {
  totalBenefitAmount: number
  discountAmount: number
  cashbackAmount: number
  pointAmount: number
  mileageAmount: number
}

interface BenefitHistoryPageResponse {
  success: boolean
  data: {
    data: BenefitHistoryResponseItem[]
    summary: BenefitHistorySummary
    meta: {
      page: number
      size: number
      totalCount: number
      hasNext: boolean
    }
  }
}

export interface BenefitHistoryResult {
  items: RecentBenefitItem[]
  summary: BenefitHistorySummary
  totalCount: number
}

export interface BenefitHistoryParams {
  yearMonth: string
  userCardId: string
  sort?: 'LATEST' | 'BENEFIT_DESC'
}

const PAGE_SIZE = 100

export async function fetchBenefitHistory({
  yearMonth,
  userCardId,
  sort = 'LATEST',
}: BenefitHistoryParams): Promise<BenefitHistoryResult> {
  const items: BenefitHistoryResponseItem[] = []
  let page = 1
  let hasNext = true
  let summary: BenefitHistorySummary = {
    totalBenefitAmount: 0,
    discountAmount: 0,
    cashbackAmount: 0,
    pointAmount: 0,
    mileageAmount: 0,
  }
  let totalCount = 0

  while (hasNext) {
    const response = await apiClient.get<BenefitHistoryPageResponse>('/api/v1/benefit-history', {
      params: { yearMonth, userCardId, sort, page, size: PAGE_SIZE },
    })
    const result = response.data.data
    items.push(...result.data)
    summary = result.summary
    totalCount = result.meta.totalCount
    hasNext = result.meta.hasNext
    page += 1
  }

  return {
    items: items.map((item) =>
      toRecentBenefitItem({
        approvalId: item.benefitHistoryId,
        benefitHistoryId: item.benefitHistoryId,
        merchantName: item.merchantName,
        benefitType: item.benefitType,
        benefitTitle: item.benefitTitle,
        cardName: item.cardName,
        paymentAmount: item.paymentAmount,
        benefitAmount: item.benefitAmount,
        missedBenefitAmount: item.missedBenefitAmount,
        calculationStatus: item.calculationStatus,
        rejectionReason: item.rejectionReason,
        performanceShortfall: item.performanceShortfall,
        occurredAt: item.approvedAt,
      }),
    ),
    summary,
    totalCount,
  }
}
