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

// 이 API의 카드 실적은 "다음 구간"이 없는 단일 임계값(전월 실적 요건 충족 여부)이라
// (nextTier가 항상 null로 내려온다), 달성 여부와 무관하게 항상 0원부터 요건 금액까지를
// 게이지 하나로 표현한다. 요건을 넘겨 달성한 뒤에도 실제 사용액을 그대로 분자로 보여주고
// 게이지만 100%로 캡한다.
function requirementAmount(card: TierGaugeCard): number {
  return card.currentTierTargetAmount ?? card.previousMonthSpendKrw
}

export function segmentEndAmount(card: TierGaugeCard): number {
  return requirementAmount(card)
}

export function gaugeFillPercent(card: TierGaugeCard): number {
  const target = requirementAmount(card)
  if (target <= 0) return 100
  return Math.min(100, Math.max(0, Math.floor((card.previousMonthSpendKrw / target) * 100)))
}

// 지금 목표로 삼아야 할 구간 번호. 아직 현재 구간도 못 채웠으면 현재 구간, 채웠으면 다음 구간.
// 다음 구간이 없으면(최고 구간 달성) null.
export function targetTierNumber(card: TierGaugeCard): number | null {
  return card.isCurrentTierAchieved ? card.nextTier : card.currentTier
}
