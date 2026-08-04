import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import HomeView from '@/domains/home/views/HomeView.vue'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'

describe('HomeView', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  function mountView(pinia = createPinia()) {
    return mount(HomeView, {
      global: {
        plugins: [pinia],
        stubs: {
          PageLayout: { template: '<main><slot /></main>' },
          MainHeader: { template: '<header />' },
          SectionCard: { template: '<section><slot name="action" /><slot /></section>' },
          RouterLink: RouterLinkStub,
          MocaButton: { template: '<button><slot /></button>' },
        },
      },
    })
  }

  it('관리 링크를 통해 홈에서 카드 관리 화면으로 이동한다', () => {
    const wrapper = mountView()

    const manageLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text() === '관리')

    expect(manageLink?.props('to')).toEqual({ name: 'card-manage', query: { from: 'home' } })
    expect(wrapper.findAll('[data-owned-card]')).toHaveLength(4)
    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB My WE:SH')
    expect(wrapper.get('[data-received-benefit]').text()).toBe('21,800원')
    expect(wrapper.get('[data-available-benefit]').text()).toBe('8,200원')
    expect(wrapper.get('[data-performance-rate]').text()).toBe('실적 달성 현황(76%)')
    expect(wrapper.get('[data-performance-remaining]').text()).toContain('118,000원')

    const detailLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.text().includes('상세보기'))

    expect(detailLink?.props('to')).toEqual({
      name: 'card-detail',
      params: { id: 'home-kb-wesh' },
    })

    const memoLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('aria-label') === 'KB My WE:SH 메모 확인하기')

    expect(memoLink?.props('to')).toEqual({
      name: 'card-detail',
      params: { id: 'home-kb-wesh' },
    })
    expect(wrapper.get('[data-card-memo]').text()).toContain('스타벅스, 폴바셋 10% 할인')
  })

  it('카드를 넘기면 선택 카드와 페이지 표시가 함께 변경된다', async () => {
    const wrapper = mountView()
    const carousel = wrapper.get('[data-card-carousel]')

    carousel.element.scrollLeft = 228
    await carousel.trigger('scroll')

    expect(wrapper.findAll('[data-owned-card]')[1]?.attributes('aria-current')).toBe('true')
    expect(wrapper.findAll('[data-card-indicator]')[1]?.classes()).toContain('w-6')
    expect(wrapper.get('[data-selected-card-name]').text()).toBe('KB국민 청춘대로 톡톡카드')
    expect(wrapper.get('[data-received-benefit]').text()).toBe('16,400원')
    expect(wrapper.get('[data-available-benefit]').text()).toBe('6,600원')
    expect(wrapper.get('[data-performance-rate]').text()).toBe('실적 달성 현황(80%)')
    expect(wrapper.get('[data-performance-remaining]').text()).toContain('59,000원')
  })

  it('상세 화면에서 수정한 카드 메모를 홈 카드 위에 표시한다', () => {
    const pinia = createPinia()
    const cardMemoStore = useCardMemoStore(pinia)
    cardMemoStore.setMemo('home-kb-wesh', '주말 카페 결제용 카드')

    const wrapper = mountView(pinia)

    expect(wrapper.get('[data-card-memo]').text()).toBe('주말 카페 결제용 카드')
  })
})
