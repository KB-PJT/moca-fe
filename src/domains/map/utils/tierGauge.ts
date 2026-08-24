import type { RankedCardBenefit, RankedCardBenefitTier } from '@/domains/map/api/merchants'

type TierGaugeCard = Pick<
  RankedCardBenefit,
  'previousMonthSpendKrw' | 'requiredPreviousSpendKrw' | 'tiers'
>

// 요건 금액이 0원 이하인 구간은 "무조건 달성" 상태라 실적 게이지로 보여줄 의미가 없다.
// 실적과 무관하게 항상 적용되는 혜택인데 백엔드가 빈 배열 대신 0원짜리 가짜 구간을
// 채워 보내는 경우가 있어(예: 카페 카테고리 실적 무관 혜택), 그런 구간은 없는 것으로 본다.
export function visibleTiers(card: TierGaugeCard): RankedCardBenefitTier[] {
  return card.tiers.filter((tier) => tier.requiredPreviousSpendKrw > 0)
}

// requiredPreviousSpendKrw는 "다음 구간까지 남은 요건" 성격이라, 모든 구간을 다 채운
// 카드는 더 갈 구간이 없어 이 값이 null로 내려온다. 그래도 tiers엔 구간 정보가 그대로
// 있으니, 둘 중 하나라도 있으면 실적 요건이 있는 카드로 본다.
export function hasPerformanceRequirement(card: TierGaugeCard): boolean {
  return card.requiredPreviousSpendKrw != null || visibleTiers(card).length > 0
}

function sortedTiers(card: TierGaugeCard): RankedCardBenefitTier[] {
  return [...visibleTiers(card)].sort(
    (a, b) => a.requiredPreviousSpendKrw - b.requiredPreviousSpendKrw,
  )
}

// 게이지 전체가 나타내는 최고 구간 요건 금액. tiers가 없는(구간 정보를 못 받은) 카드는
// 예전처럼 단일 임계값(요건 금액 하나) 기준으로 폴백한다. 각 구간 배지 위치·채움 비율을
// 전부 이 금액 기준으로 계산해 0원~최종구간을 실제 비율대로 한 막대에 그린다.
export function maxTierAmount(card: TierGaugeCard): number {
  const tiers = visibleTiers(card)
  if (tiers.length) {
    return Math.max(...tiers.map((tier) => tier.requiredPreviousSpendKrw))
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

// 0원부터 최종 구간까지, 전체 막대 기준 채움 비율.
export function gaugeFillPercent(card: TierGaugeCard): number {
  const max = maxTierAmount(card)
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, Math.floor((card.previousMonthSpendKrw / max) * 100)))
}

// 구간 배지를 막대 위 몇 %지점에 놓을지.
export function tierPositionPercent(card: TierGaugeCard, tier: RankedCardBenefitTier): number {
  const max = maxTierAmount(card)
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, (tier.requiredPreviousSpendKrw / max) * 100))
}

// 구간 배지·캡션은 기본적으로 그 지점 가운데 정렬하되, 막대 양 끝(0%/100%)에 가까운
// 구간은 가운데 정렬하면 배지 절반이 막대 밖으로 튀어나오므로 안쪽 가장자리에 붙인다.
export function tierMarkerAlign(
  card: TierGaugeCard,
  tier: RankedCardBenefitTier,
): 'start' | 'center' | 'end' {
  const percent = tierPositionPercent(card, tier)
  if (percent <= 10) return 'start'
  if (percent >= 90) return 'end'
  return 'center'
}
