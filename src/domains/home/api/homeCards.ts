import axios from 'axios'
import apiClient from '@/shared/api/client'

export interface HomeCardSummaryResponse {
  receivedBenefitAmount: number
  availableBenefitAmount: number
  maximumMonthlyBenefitAmount: number
  performanceCurrentAmount: number
  performanceTargetAmount: number
  performanceRate: number
  performanceRemainingAmount: number
}

export interface HomeCardResponse {
  userCardId: string
  order: number
  cardName: string
  alias: string | null
  cardImageUrl: string | null
  autoOrderReason?: string | null
  highlightBenefit: {
    title?: string | null
    monthlyLimitText?: string | null
  }
  summary: HomeCardSummaryResponse
}

export interface HomeCardsResponse {
  yearMonth: string
  orderMode: 'AUTO' | 'MANUAL'
  selectedUserCardId?: string | null
  cards: HomeCardResponse[]
}

interface HomeCardsApiResponse {
  success: boolean
  data: HomeCardsResponse
}

export interface HomeOwnedCard {
  id: string
  name: string
  imageUrl: string | null
  accentColor: string
  highlightBenefitTitle: string
  receivedBenefitAmount: number
  availableBenefitAmount: number
  performance: {
    currentAmount: number
    targetAmount: number
  }
}

const CARD_ACCENT_COLORS = ['#ff9c70', '#5fc8e8', '#7762df', '#4c535d'] as const

export function toHomeOwnedCard(card: HomeCardResponse, index: number): HomeOwnedCard {
  return {
    id: card.userCardId,
    name: card.alias ?? card.cardName,
    imageUrl: card.cardImageUrl,
    accentColor: CARD_ACCENT_COLORS[index % CARD_ACCENT_COLORS.length] ?? '#ff9c70',
    highlightBenefitTitle: card.highlightBenefit.title ?? '',
    receivedBenefitAmount: card.summary.receivedBenefitAmount,
    availableBenefitAmount: card.summary.availableBenefitAmount,
    performance: {
      currentAmount: card.summary.performanceCurrentAmount,
      targetAmount: card.summary.performanceTargetAmount,
    },
  }
}

export async function fetchHomeCards(): Promise<HomeCardsResponse | null> {
  try {
    const response = await apiClient.get<HomeCardsApiResponse>('/api/v1/home/cards')
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}
