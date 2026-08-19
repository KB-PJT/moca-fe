import apiClient from '@/shared/api/client'

export interface PerformanceSummaryCardItem {
  userCardId: string
  cardName: string
  achievementRate: number
  isCurrentTierAchieved: boolean
}

export interface PerformanceSummary {
  yearMonth: string
  cardCount: number
  achievedCardCount: number
  cards: PerformanceSummaryCardItem[]
}

export interface PerformanceTier {
  tier: number
  targetAmount: number
}

export interface PerformanceCardItem {
  userCardId: string
  cardName: string
  cardImageUrl: string | null
  currentPerformanceAmount: number
  currentTierTargetAmount: number
  achievementRate: number
  currentTier: number
  nextTier: number | null
  isCurrentTierAchieved: boolean
  remainingAmountToNextTier: number
  tiers: PerformanceTier[]
}

export interface PerformanceCardsResult {
  yearMonth: string
  cards: PerformanceCardItem[]
}

interface ApiResponse<T> {
  data: T
}

export async function fetchPerformanceSummary(yearMonth?: string): Promise<PerformanceSummary> {
  const response = await apiClient.get<ApiResponse<PerformanceSummary>>(
    '/api/v1/reports/performances/summary',
    { params: yearMonth ? { yearMonth } : undefined },
  )
  return response.data.data
}

export async function fetchPerformanceCards(yearMonth?: string): Promise<PerformanceCardsResult> {
  const response = await apiClient.get<ApiResponse<PerformanceCardsResult>>(
    '/api/v1/reports/performances/cards',
    { params: yearMonth ? { yearMonth } : undefined },
  )
  return response.data.data
}
