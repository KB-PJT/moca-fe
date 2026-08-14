import { formatAmountWithUnit } from '@/shared/utils/format'
import type { CardRecommendationReason, RankedCardBenefit } from '@/domains/map/api/merchants'

const REWARD_TYPE_LABELS: Record<string, string> = {
  discount: '할인',
  cashback: '캐시백',
  points: '적립',
  rebate: '캐시백',
}

// rewardUnit별로 숫자 표기 방식이 달라서(퍼센트/원/포인트/마일) 하나로 묶어 표시한다.
export function formatRewardLabel(
  card: Pick<RankedCardBenefit, 'rewardType' | 'rewardUnit' | 'rewardValue'>,
): string {
  const typeLabel = REWARD_TYPE_LABELS[card.rewardType] ?? card.rewardType

  switch (card.rewardUnit) {
    case 'percent':
      return `${card.rewardValue}% ${typeLabel}`
    case 'KRW':
      return `${formatAmountWithUnit(card.rewardValue)} ${typeLabel}`
    case 'point':
      return `${card.rewardValue}P ${typeLabel}`
    case 'mile':
      return `${card.rewardValue}마일 ${typeLabel}`
  }
}

// recommendationReasons는 code + 수치만 내려오는 구조화 데이터라, 화면에 보여줄 한국어
// 문구는 프론트에서 조합해야 한다(API 스펙에 명시된 의도).
export function describeRecommendationReason(reason: CardRecommendationReason): string {
  switch (reason.code) {
    case 'MERCHANT_BENEFIT_MATCHED':
      return reason.satisfied ? '이 가맹점은 혜택 대상이에요' : '이 가맹점은 혜택 대상이 아니에요'

    case 'PREVIOUS_SPEND':
      if (reason.requiredValue == null) return '전월 실적 조건이 없어요'
      return reason.satisfied
        ? `전월 실적 ${formatAmountWithUnit(reason.currentValue ?? 0)}으로 조건(${formatAmountWithUnit(reason.requiredValue)})을 채웠어요`
        : `전월 실적이 ${formatAmountWithUnit(reason.remainingValue ?? 0)} 부족해요`

    case 'MINIMUM_PAYMENT':
      if (reason.requiredValue == null) return '최소 결제금액 조건이 없어요'
      return reason.satisfied
        ? `최소 결제금액 ${formatAmountWithUnit(reason.requiredValue)} 조건을 충족했어요`
        : `최소 결제금액 ${formatAmountWithUnit(reason.requiredValue)} 이상 결제해야 해요`

    case 'MONTHLY_LIMIT':
      if (reason.remainingValue == null) return '월 한도 정보가 없어요'
      return reason.satisfied
        ? `이번 달 한도 ${formatAmountWithUnit(reason.remainingValue)}이 남아 있어요`
        : '이번 달 한도를 모두 사용했어요'
  }
}
