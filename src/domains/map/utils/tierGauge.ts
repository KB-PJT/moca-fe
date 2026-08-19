import type { RankedCardBenefit, RankedCardBenefitTier } from '@/domains/map/api/merchants'

type TierGaugeCard = Pick<
  RankedCardBenefit,
  'previousMonthSpendKrw' | 'requiredPreviousSpendKrw' | 'tiers'
>

export function hasPerformanceRequirement(card: TierGaugeCard): boolean {
  return card.requiredPreviousSpendKrw != null
}

function sortedTiers(card: TierGaugeCard): RankedCardBenefitTier[] {
  return [...card.tiers].sort((a, b) => a.requiredPreviousSpendKrw - b.requiredPreviousSpendKrw)
}

// 게이지 전체가 나타내는 최고 구간 요건 금액. tiers가 없는(구간 정보를 못 받은) 카드는
// 예전처럼 단일 임계값(요건 금액 하나) 기준으로 폴백한다. 모든 구간을 다 채운 경우
// "다음 구간"이 없어 이 값을 채움 비율 계산의 기준으로 대신 쓴다.
function maxTierAmount(card: TierGaugeCard): number {
  if (card.tiers.length) {
    return Math.max(...card.tiers.map((tier) => tier.requiredPreviousSpendKrw))
  }
  return card.requiredPreviousSpendKrw ?? card.previousMonthSpendKrw
}

export function isTierAchieved(card: TierGaugeCard, tier: RankedCardBenefitTier): boolean {
  return card.previousMonthSpendKrw >= tier.requiredPreviousSpendKrw
}

// tiers 배열 기준으로 아직 요건을 못 채운 첫 번째(가장 낮은) 구간.
export function nextUnachievedTier(card: TierGaugeCard): RankedCardBenefitTier | null {
  return sortedTiers(card).find((tier) => !isTierAchieved(card, tier)) ?? null
}

// 왼쪽 배지(달성한 구간)가 가리키는 금액. 하나도 못 채웠으면 0원부터.
function segmentStartAmount(card: TierGaugeCard): number {
  const tiers = sortedTiers(card)
  const achieved = tiers.filter((tier) => isTierAchieved(card, tier))
  return achieved.length ? achieved[achieved.length - 1]!.requiredPreviousSpendKrw : 0
}

// 오른쪽 배지(다음 목표 구간)가 가리키는 금액. 모든 구간을 다 채웠으면 더 갈 곳이 없으니
// 최고 구간 금액을 그대로 써서 꽉 채운 상태로 보여준다.
function segmentTargetAmount(card: TierGaugeCard): number {
  return nextUnachievedTier(card)?.requiredPreviousSpendKrw ?? maxTierAmount(card)
}

export function segmentEndAmount(card: TierGaugeCard): number {
  return segmentTargetAmount(card)
}

// 채움 비율은 전체(0원~최종구간)가 아니라, 지금 화면에 찍힌 두 배지(달성한 구간→다음
// 구간) 사이 구간 안에서의 진행률로 계산한다. 그래야 배지 위치와 채워진 정도가 서로 맞는다.
export function gaugeFillPercent(card: TierGaugeCard): number {
  const start = segmentStartAmount(card)
  const end = segmentTargetAmount(card)
  const range = end - start
  if (range <= 0) return 100
  return Math.min(
    100,
    Math.max(0, Math.floor(((card.previousMonthSpendKrw - start) / range) * 100)),
  )
}

// 게이지 왼쪽에 표시할 "달성한" 구간 번호. 더 채울 구간이 없을 만큼(모든 구간) 다 채웠으면
// 지나온 구간이 몇 개든 왼쪽은 항상 시작 구간(1)으로 표시하고, 아직 남은 구간이 있으면
// 방금 채운(가장 마지막으로 달성한) 구간 번호를 보여준다. 하나도 못 채웠으면 null(배지 없음).
export function achievedTierNumber(card: TierGaugeCard): number | null {
  const tiers = sortedTiers(card)
  const achieved = tiers.filter((tier) => isTierAchieved(card, tier))
  if (!achieved.length) return null
  if (achieved.length === tiers.length) return tiers[0]?.tier ?? null
  return achieved[achieved.length - 1]!.tier
}

// 게이지 오른쪽에 표시할 목표(또는 최종 달성) 구간 번호.
export function targetTierNumber(card: TierGaugeCard): number | null {
  const next = nextUnachievedTier(card)
  if (next) return next.tier

  const tiers = sortedTiers(card)
  if (!tiers.length) return null
  const hasAchieved = tiers.some((tier) => isTierAchieved(card, tier))
  return hasAchieved ? (tiers[tiers.length - 1]?.tier ?? null) : null
}
