import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NewCardRecommendationSheet from '@/domains/map/components/NewCardRecommendationSheet.vue'

const GOOD_DAY_CARD_IMAGE_URL =
  'https://img1.kbcard.com/ST/img/cxc/kbcard/upload/img/product/09061_img.png'
const GOOD_DAY_CARD_DETAIL_URL =
  'https://card.kbcard.com/CRD/DVIEW/HCAMCXPRICAC0076?mainCC=a&cooperationcode=09061'

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
    expect(wrapper.get('img[alt="KB국민 굿데이카드"]').attributes('src')).toBe(
      GOOD_DAY_CARD_IMAGE_URL,
    )
  })

  it('공식 굿데이카드 상품 페이지를 연다', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mountSheet()

    const detailButton = wrapper
      .findAll('button')
      .find((button) => button.text() === '카드 자세히 보기')

    expect(detailButton).toBeDefined()
    await detailButton!.trigger('click')

    expect(open).toHaveBeenCalledWith(GOOD_DAY_CARD_DETAIL_URL, '_blank', 'noopener,noreferrer')
  })
})
