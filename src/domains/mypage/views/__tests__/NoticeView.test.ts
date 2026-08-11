import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoticeView from '@/domains/mypage/views/NoticeView.vue'

describe('NoticeView', () => {
  it('카테고리를 탭이 아닌 필터 토글 버튼으로 제공한다', async () => {
    const wrapper = shallowMount(NoticeView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
        },
      },
    })
    const categoryFilter = wrapper.get('[aria-label="공지사항 카테고리"]')
    const cardCategory = categoryFilter
      .findAll('button')
      .find((button) => button.text().includes('카드 연동'))

    expect(categoryFilter.attributes('role')).toBeUndefined()
    expect(categoryFilter.find('[role="tab"]').exists()).toBe(false)
    expect(cardCategory).toBeDefined()
    if (!cardCategory) throw new Error('공지사항 카테고리 버튼을 찾을 수 없습니다.')

    expect(cardCategory.attributes('aria-pressed')).toBe('false')
    await cardCategory.trigger('click')
    expect(cardCategory.attributes('aria-pressed')).toBe('true')
  })

  it('여러 공지사항을 함께 열고 같은 항목을 다시 누를 때만 닫는다', async () => {
    const wrapper = shallowMount(NoticeView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
        },
      },
    })
    const noticeButtons = wrapper.findAll('button[aria-expanded]')
    const firstNotice = noticeButtons.find((button) =>
      button.text().includes('카드 실적은 언제 반영되나요?'),
    )
    const secondNotice = noticeButtons.find((button) =>
      button.text().includes('실제 카드사 혜택과 다른 이유는 무엇인가요?'),
    )

    expect(firstNotice).toBeDefined()
    expect(secondNotice).toBeDefined()
    if (!firstNotice || !secondNotice) throw new Error('공지사항 버튼을 찾을 수 없습니다.')

    await firstNotice.trigger('click')
    await secondNotice.trigger('click')

    expect(firstNotice.attributes('aria-expanded')).toBe('true')
    expect(secondNotice.attributes('aria-expanded')).toBe('true')
    expect(
      (wrapper.get(`#${firstNotice.attributes('aria-controls')}`).element as HTMLElement).style
        .display,
    ).not.toBe('none')
    expect(
      (wrapper.get(`#${secondNotice.attributes('aria-controls')}`).element as HTMLElement).style
        .display,
    ).not.toBe('none')

    await firstNotice.trigger('click')

    expect(firstNotice.attributes('aria-expanded')).toBe('false')
    expect(secondNotice.attributes('aria-expanded')).toBe('true')
    expect(
      (wrapper.get(`#${firstNotice.attributes('aria-controls')}`).element as HTMLElement).style
        .display,
    ).toBe('none')
    expect(
      (wrapper.get(`#${secondNotice.attributes('aria-controls')}`).element as HTMLElement).style
        .display,
    ).not.toBe('none')
  })

  it('카테고리를 변경하면 펼쳐진 공지사항을 모두 닫는다', async () => {
    const wrapper = shallowMount(NoticeView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
        },
      },
    })
    const firstNotice = wrapper
      .findAll('button[aria-expanded]')
      .find((button) => button.text().includes('카드 실적은 언제 반영되나요?'))
    const cardCategory = wrapper
      .get('[aria-label="공지사항 카테고리"]')
      .findAll('button')
      .find((button) => button.text().includes('카드 연동'))

    expect(firstNotice).toBeDefined()
    expect(cardCategory).toBeDefined()
    if (!firstNotice || !cardCategory) throw new Error('공지사항 버튼을 찾을 수 없습니다.')

    await firstNotice.trigger('click')
    expect(firstNotice.attributes('aria-expanded')).toBe('true')

    await cardCategory.trigger('click')

    const remainingNotice = wrapper
      .findAll('button[aria-expanded]')
      .find((button) => button.text().includes('카드 실적은 언제 반영되나요?'))

    expect(remainingNotice).toBeDefined()
    if (!remainingNotice) throw new Error('필터링된 공지사항 버튼을 찾을 수 없습니다.')

    expect(remainingNotice.attributes('aria-expanded')).toBe('false')
    expect(
      (wrapper.get(`#${remainingNotice.attributes('aria-controls')}`).element as HTMLElement).style
        .display,
    ).toBe('none')
  })
})
