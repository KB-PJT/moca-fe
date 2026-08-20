import { CircleDollarSign, Coins, Plane, Sparkles, type LucideIcon } from '@lucide/vue'
import type { BenefitPreferenceType } from '@/domains/auth/api/auth'

export interface BenefitPreferenceOption {
  value: BenefitPreferenceType
  title: string
  description: string
  icon: LucideIcon
}

export const BENEFIT_PREFERENCE_OPTIONS: BenefitPreferenceOption[] = [
  {
    value: 'IMMEDIATE_SAVINGS',
    title: '바로 할인받기',
    description: '결제할 때 바로 할인이나 캐시백을 받고 싶어요',
    icon: CircleDollarSign,
  },
  {
    value: 'POINT_USAGE',
    title: '포인트 모으기',
    description: '쓸 수 있는 포인트를 차곡차곡 모으고 싶어요',
    icon: Coins,
  },
  {
    value: 'TRAVEL_MILEAGE',
    title: '마일리지 쌓기',
    description: '여행에 사용할 항공 마일리지를 쌓고 싶어요',
    icon: Plane,
  },
  {
    value: 'MAXIMUM_BENEFIT',
    title: '혜택 금액 최대로',
    description: '종류보다 가장 큰 금액의 혜택이 중요해요',
    icon: Sparkles,
  },
]

export function getBenefitPreferenceLabel(value: BenefitPreferenceType): string {
  return (
    BENEFIT_PREFERENCE_OPTIONS.find((option) => option.value === value)?.title ?? '바로 할인받기'
  )
}
