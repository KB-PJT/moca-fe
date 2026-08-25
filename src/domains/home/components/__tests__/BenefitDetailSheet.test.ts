import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { RecentBenefitItem } from '@/domains/home/api/recentBenefits'
import BenefitDetailSheet from '@/domains/home/components/BenefitDetailSheet.vue'

const appliedBenefit: RecentBenefitItem = {
  id: 'benefit-1',
  merchantName: '스타벅스',
  benefitType: '포인트',
  description: '카페 포인트 적립',
  cardName: '테스트 카드',
  cardLastFour: '',
  benefitAmount: 1_500,
  missedBenefitAmount: 0,
  paymentAmount: 15_000,
  calculationStatus: 'APPLIED',
  rejectionReason: null,
  performanceShortfall: null,
  occurredAt: '8월 24일 12:00',
  monthlyBenefitUsed: 3_000,
  monthlyBenefitLimit: 10_000,
}

function mountSheet(item: RecentBenefitItem) {
  return mount(BenefitDetailSheet, {
    props: { item, open: true },
    global: {
      stubs: {
        Sheet: { template: '<div><slot /></div>' },
        SheetContent: { template: '<div><slot /></div>' },
        SheetTitle: { template: '<h2><slot /></h2>' },
        SheetDescription: { template: '<p><slot /></p>' },
      },
    },
  })
}

describe('BenefitDetailSheet', () => {
  it('적용 혜택의 월 사용 현황을 표시한다', () => {
    const wrapper = mountSheet(appliedBenefit)

    expect(wrapper.text()).toContain('1,500원 포인트')
    expect(wrapper.text()).not.toContain('-1,500원 포인트')
    expect(wrapper.text()).toContain('3,000 / 10,000원')
    expect(wrapper.text()).toContain('7,000원')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('30')
  })

  it('실적 미충족 내역은 실적 정보만 표시하고 월 사용 현황은 숨긴다', () => {
    const wrapper = mountSheet({
      ...appliedBenefit,
      benefitAmount: 0,
      missedBenefitAmount: 1_500,
      calculationStatus: 'NOT_APPLIED',
      rejectionReason: 'PERFORMANCE_NOT_MET',
      performanceShortfall: {
        requiredAmount: 300_000,
        achievedAmount: 200_000,
        remainingAmount: 100_000,
      },
      monthlyBenefitUsed: null,
      monthlyBenefitLimit: null,
    })

    expect(wrapper.text()).toContain('놓친 혜택')
    expect(wrapper.text()).toContain('전월 실적')
    expect(wrapper.text()).toContain('부족 실적')
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
  })
})
