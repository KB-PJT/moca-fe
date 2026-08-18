import type { RankedCardBenefit } from '@/domains/map/api/merchants'

type TierGaugeCard = Pick<
  RankedCardBenefit,
  | 'previousMonthSpendKrw'
  | 'requiredPreviousSpendKrw'
  | 'currentTier'
  | 'nextTier'
  | 'currentTierTargetAmount'
  | 'isCurrentTierAchieved'
  | 'remainingAmountToNextTier'
>

export function hasPerformanceRequirement(card: TierGaugeCard): boolean {
  return card.requiredPreviousSpendKrw != null
}

// 구간을 이미 달성했으면 그 구간 목표금액부터, 아직이면 0부터 게이지를 채운다.
function segmentStartAmount(card: TierGaugeCard): number {
  return card.isCurrentTierAchieved ? (card.currentTierTargetAmount ?? 0) : 0
}

// 구간을 이미 달성했으면 다음 구간 목표금액까지, 아직이면 현재 구간 목표금액까지가 이번 구간의 끝이다.
// 다음 구간이 없으면(최고 구간) remainingAmountToNextTier가 0이라 현재 실적과 같아진다.
export function segmentEndAmount(card: TierGaugeCard): number {
  if (card.isCurrentTierAchieved) {
    return card.previousMonthSpendKrw + card.remainingAmountToNextTier
  }
  return card.currentTierTargetAmount ?? card.previousMonthSpendKrw
}

export function gaugeFillPercent(card: TierGaugeCard): number {
  const start = segmentStartAmount(card)
  const end = segmentEndAmount(card)
  const range = end - start
  if (range <= 0) return 100
  return Math.min(
    100,
    Math.max(0, Math.floor(((card.previousMonthSpendKrw - start) / range) * 100)),
  )
}

// 지금 목표로 삼아야 할 구간 번호. 아직 현재 구간도 못 채웠으면 현재 구간, 채웠으면 다음 구간.
// 다음 구간이 없으면(최고 구간 달성) null.
export function targetTierNumber(card: TierGaugeCard): number | null {
  return card.isCurrentTierAchieved ? card.nextTier : card.currentTier
}
