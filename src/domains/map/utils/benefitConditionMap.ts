import { formatAmountWithUnit } from '@/shared/utils/format'
import type { CardRecommendationReason } from '@/domains/map/api/merchants'
import type { ConditionItem, ConditionStatus } from '@/domains/map/types/benefitCondition'

// 요건 자체가 없는 카드(예: 최소 결제금액 제한이 없는 카드)는 만족 여부를 따질 수 없어
// 'na'로 표시한다. satisfied 값은 그대로 두고 hasRequirement로만 na 여부를 판단한다.
function statusOf(reason: CardRecommendationReason, hasRequirement: boolean): ConditionStatus {
  if (!hasRequirement) return 'na'
  return reason.satisfied ? 'met' : 'unmet'
}

function toItem(reason: CardRecommendationReason, merchantLabel: string): ConditionItem {
  switch (reason.code) {
    case 'MERCHANT_BENEFIT_MATCHED':
      return {
        key: reason.code,
        title: reason.satisfied ? '혜택 대상 가맹점' : '혜택 대상이 아닌 가맹점',
        description: merchantLabel,
        status: reason.satisfied ? 'met' : 'unmet',
      }

    case 'PREVIOUS_SPEND': {
      const status = statusOf(reason, reason.requiredValue != null)
      return {
        key: reason.code,
        title:
          status === 'na'
            ? '실적 조건 없음'
            : status === 'met'
              ? '실적 조건 충족'
              : '실적 조건 미달',
        description:
          status === 'na'
            ? undefined
            : status === 'met'
              ? `전월 실적 ${formatAmountWithUnit(reason.currentValue ?? 0)}으로 조건(${formatAmountWithUnit(reason.requiredValue ?? 0)})을 채웠어요`
              : `전월 실적이 ${formatAmountWithUnit(reason.remainingValue ?? 0)} 부족해요`,
        status,
      }
    }

    case 'MINIMUM_PAYMENT': {
      // 최소 결제금액 조건이 아예 없는 카드는 "판단 불가"가 아니라 "조건 없이 항상 통과"라
      // 다른 요건들과 달리 na가 아닌 met으로 표시한다.
      const hasRequirement = reason.requiredValue != null
      const status: ConditionStatus = !hasRequirement || reason.satisfied ? 'met' : 'unmet'
      return {
        key: reason.code,
        title: !hasRequirement
          ? '결제 조건'
          : status === 'met'
            ? '최소 결제금액 조건 충족'
            : '최소 결제금액 조건 미충족',
        description: !hasRequirement
          ? '최소 결제금액 조건이 없어요'
          : status === 'met'
            ? `최소 결제금액 ${formatAmountWithUnit(reason.requiredValue ?? 0)} 조건을 충족했어요`
            : `최소 결제금액 ${formatAmountWithUnit(reason.requiredValue ?? 0)} 이상 결제해야 해요`,
        status,
      }
    }

    case 'MONTHLY_LIMIT': {
      const status = statusOf(reason, reason.remainingValue != null)
      return {
        key: reason.code,
        title:
          status === 'na' ? '한도 제한 없음' : status === 'met' ? '한도 여유 있음' : '한도 소진',
        description:
          status === 'na'
            ? undefined
            : status === 'met'
              ? `이번 달 한도 ${formatAmountWithUnit(reason.remainingValue ?? 0)}이 남아 있어요`
              : '이번 달 한도를 모두 사용했어요',
        status,
      }
    }
  }
}

export function toConditionItems(
  reasons: CardRecommendationReason[],
  merchantLabel: string,
): ConditionItem[] {
  // 가맹점 정보는 이 목록 위 카드 헤더에 이미 나와 있어 중복이라 여기서는 뺀다.
  return reasons
    .filter((reason) => reason.code !== 'MERCHANT_BENEFIT_MATCHED')
    .map((reason) => toItem(reason, merchantLabel))
}
