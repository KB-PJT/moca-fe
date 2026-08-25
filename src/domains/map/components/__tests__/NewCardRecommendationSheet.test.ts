import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NewCardRecommendationSheet from '@/domains/map/components/NewCardRecommendationSheet.vue'

function mountSheet() {
  return mount(NewCardRecommendationSheet, {
    props: { open: true },
    global: {
      stubs: {
        Sheet: { template: '<div><slot /></div>' },
        SheetContent: { template: '<div><slot /></div>' },
        SheetTitle: { template: '<h1><slot /></h1>' },
        SheetDescription: { template: '<p><slot /></p>' },
        MocaButton: { template: '<button><slot /></button>' },
      },
    },
  })
}

describe('NewCardRecommendationSheet', () => {
  afterEach(() => vi.restoreAllMocks())

  it('카페 소비 패턴에 맞춰 굿데이카드를 추천한다', () => {
    const wrapper = mountSheet()

    expect(wrapper.text()).toContain('이번 달 카페 6번째 이용이에요')
    expect(wrapper.text()).toContain('카페 혜택이 큰 카드를 추천해요')
    expect(wrapper.text()).toContain('굿데이카드')
    expect(wrapper.text()).toContain('카페 10%')
    expect(wrapper.text()).toContain('전월 실적 60만원 이상 · 월 최대 5천원')
    expect(wrapper.text()).toContain('카페 이용 48,700원 기준')
    expect(wrapper.text()).toContain('4,870원')
    expect(wrapper.get('img[alt="KB국민 굿데이카드"]').attributes('src')).toContain('09061_img.png')
  })

  it('공식 굿데이카드 상품 페이지를 연다', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mountSheet()

    await wrapper.get('button:last-child').trigger('click')

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('cooperationcode=09061'),
      '_blank',
      'noopener,noreferrer',
    )
  })
})
