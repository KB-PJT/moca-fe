import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BenefitHistoryView from '@/domains/home/views/BenefitHistoryView.vue'

describe('BenefitHistoryView', () => {
  it('전체 혜택 내역을 표시하고 혜택을 선택하면 상세 시트를 연다', async () => {
    const wrapper = mount(BenefitHistoryView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          BenefitDetailSheet: {
            props: ['open', 'item'],
            template: '<div data-detail-sheet :data-open="open">{{ item?.merchantName }}</div>',
          },
        },
      },
    })

    expect(wrapper.text()).not.toContain('전체 카드')
    expect(wrapper.text()).toContain('KB My WE:SH')
    expect(wrapper.text()).toContain('현대카드 ZERO Edition3')
    expect(wrapper.text()).toContain('7월')
    expect(wrapper.text()).toContain('7월 받은 혜택')
    expect(wrapper.text()).toContain('13,750원')
    expect(wrapper.text()).toContain('할인')
    expect(wrapper.text()).toContain('캐시백')
    expect(wrapper.text()).toContain('포인트')
    expect(wrapper.text()).toContain('혜택에 해당하는 결제')
    expect(wrapper.text()).toContain('227,000원')
    expect(wrapper.text()).toContain('총 12건')
    expect(wrapper.text()).toContain('7월 13일')

    await wrapper.get('button[aria-label="스타벅스 내역 상세 보기"]').trigger('click')

    const detailSheet = wrapper.get('[data-detail-sheet]')
    expect(detailSheet.attributes('data-open')).toBe('true')
    expect(detailSheet.text()).toBe('스타벅스')
  })

  it('조회 월을 변경하면 해당 월의 빈 상태를 표시한다', async () => {
    const wrapper = mount(BenefitHistoryView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          BenefitDetailSheet: { template: '<div />' },
        },
      },
    })

    await wrapper.get('button[aria-label="이전 달"]').trigger('click')

    expect(wrapper.text()).toContain('6월')
    expect(wrapper.text()).toContain('해당 월의 혜택 내역이 없어요.')
  })

  it('카드를 변경하면 해당 카드의 승인 내역과 혜택 합계를 표시한다', async () => {
    const wrapper = mount(BenefitHistoryView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          BenefitDetailSheet: { template: '<div />' },
        },
      },
    })

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'KB국민 청춘대로 톡톡카드')
      ?.trigger('click')

    expect(wrapper.text()).toContain('총 3건')
    expect(wrapper.text()).toContain('2,900원')
    expect(wrapper.text()).toContain('맥도날드')
    expect(wrapper.text()).toContain('카카오페이')
    expect(wrapper.text()).not.toContain('스타벅스')
  })

  it('과거순을 선택하면 오래된 혜택부터 표시한다', async () => {
    const wrapper = mount(BenefitHistoryView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          BenefitDetailSheet: { template: '<div />' },
        },
      },
    })

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '과거순')
      ?.trigger('click')

    const dateHeadings = wrapper.findAll('section h2').map((heading) => heading.text())
    expect(dateHeadings[1]).toBe('7월 1일')
  })
})
