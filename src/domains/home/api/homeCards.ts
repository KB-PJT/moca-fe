import {
  CARD_ISSUERS,
  CARD_ISSUER_LIST,
  DEFAULT_CARD_ISSUER_ACCENT_COLOR,
  isCardIssuerId,
} from '@/domains/card/constants/cardIssuers'
import { consumePrefetchedHomeCards } from '@/domains/home/api/homeCardsPrefetch'

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
  issuerId?: string | null
  issuerName?: string | null
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

export function resolveHomeCardAccentColor(card: HomeCardResponse): string {
  if (card.issuerId) {
    if (isCardIssuerId(card.issuerId)) return CARD_ISSUERS[card.issuerId].accentColor

    const issuer = CARD_ISSUER_LIST.find((item) => item.institutionCode === card.issuerId)
    if (issuer) return issuer.accentColor
  }

  const issuerLabel = card.issuerName?.trim() || card.cardName
  const normalizedIssuerLabel = issuerLabel.toLowerCase()
  const issuer = CARD_ISSUER_LIST.find(
    (item) =>
      item.name.toLowerCase() === normalizedIssuerLabel ||
      item.aliases.some((alias) => normalizedIssuerLabel.includes(alias.toLowerCase())),
  )

  return issuer?.accentColor ?? DEFAULT_CARD_ISSUER_ACCENT_COLOR
}

export function toHomeOwnedCard(card: HomeCardResponse): HomeOwnedCard {
  return {
    id: card.userCardId,
    name: card.cardName,
    imageUrl: card.cardImageUrl,
    accentColor: resolveHomeCardAccentColor(card),
    highlightBenefitTitle: card.highlightBenefit.title ?? '',
    receivedBenefitAmount: card.summary.receivedBenefitAmount,
    availableBenefitAmount: card.summary.availableBenefitAmount,
    performance: {
      currentAmount: card.summary.performanceCurrentAmount,
      targetAmount: card.summary.performanceTargetAmount,
    },
  }
}

export function fetchHomeCards(): Promise<HomeCardsResponse | null> {
  return consumePrefetchedHomeCards()
}
