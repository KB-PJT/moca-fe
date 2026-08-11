import apiClient from '@/shared/api/client'

export type BenefitType = 'DISCOUNT' | 'CASHBACK' | 'POINT'

export const BENEFIT_TYPE_COLORS: Record<BenefitType, string> = {
  DISCOUNT: '#ff8836', // --color-primary
  CASHBACK: '#a67c52', // --color-brown
  POINT: '#d6b98c', // --color-brown-light
}

export const PODIUM_RANK_COLORS: Record<1 | 2 | 3, string> = {
  1: '#ff8836', // --color-primary
  2: '#a67c52', // --color-brown
  3: '#d6b98c', // --color-brown-light
}

export interface BenefitBreakdownItem {
  type: BenefitType
  label: string
  amount: number
}

export interface BenefitSummary {
  yearMonth: string
  totalBenefitAmount: number
  previousMonthBenefitAmount: number
  differenceAmount: number
  breakdown: BenefitBreakdownItem[]
}

export interface BenefitCategoryItem {
  rank: number
  categoryCode: string
  categoryName: string
  benefitAmount: number
}

export interface BenefitCategoriesResult {
  yearMonth: string
  categories: BenefitCategoryItem[]
}

export interface MissedBenefitItem {
  benefitRuleId: string
  title: string
  type: BenefitType
  usedAmount: number
  limitAmount: number
  remainingAmount: number
  unit: 'KRW'
}

export interface MissedBenefitsReportUserCard {
  userCardId: string
  cardName: string
  cardColor: string | null
}

export interface MissedBenefitsReport {
  yearMonth: string
  userCard: MissedBenefitsReportUserCard
  totalMissedBenefitAmount: number
  benefits: MissedBenefitItem[]
}

interface ApiResponse<T> {
  data: T
}

export async function fetchBenefitSummary(yearMonth?: string): Promise<BenefitSummary> {
  const response = await apiClient.get<ApiResponse<BenefitSummary>>(
    '/api/v1/reports/benefits/summary',
    { params: yearMonth ? { yearMonth } : undefined },
  )
  return response.data.data
}

export async function fetchBenefitCategories(params?: {
  yearMonth?: string
  limit?: number
}): Promise<BenefitCategoriesResult> {
  const response = await apiClient.get<ApiResponse<BenefitCategoriesResult>>(
    '/api/v1/reports/benefits/categories',
    { params },
  )
  return response.data.data
}

export async function fetchMissedBenefits(params: {
  userCardId: string
  yearMonth?: string
}): Promise<MissedBenefitsReport> {
  const response = await apiClient.get<ApiResponse<MissedBenefitsReport>>(
    '/api/v1/reports/benefits/missed',
    { params },
  )
  return response.data.data
}
