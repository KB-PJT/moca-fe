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
})
