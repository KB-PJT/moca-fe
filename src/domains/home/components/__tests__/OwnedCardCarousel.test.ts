import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OwnedCardCarousel from '@/domains/home/components/OwnedCardCarousel.vue'
import type { HomeOwnedCard } from '@/domains/home/api/homeCards'

function createCard(index: number): HomeOwnedCard {
  return {
    id: `card-${index}`,
    name: `카드 ${index}`,
    imageUrl: `https://example.com/card-${index}.png`,
    accentColor: '#ff8836',
    highlightBenefitTitle: '카페 할인',
    receivedBenefitAmount: 0,
    availableBenefitAmount: 0,
    performance: { currentAmount: 0, targetAmount: 0 },
  }
}

describe('OwnedCardCarousel', () => {
  it('활성 카드를 우선 로드하고 완전히 숨겨진 카드 이미지는 렌더링하지 않는다', () => {
    const wrapper = mount(OwnedCardCarousel, {
      props: { cards: Array.from({ length: 5 }, (_, index) => createCard(index)) },
    })

    const images = wrapper.findAll('img')
    const activeImage = wrapper.get('[data-owned-card][aria-current="true"] img')
    const inactiveImages = images.filter((image) => image.element !== activeImage.element)

    expect(wrapper.findAll('[data-owned-card]')).toHaveLength(5)
    expect(images).toHaveLength(3)
    expect(activeImage.attributes('loading')).toBe('eager')
    expect(activeImage.attributes('fetchpriority')).toBe('high')
    expect(inactiveImages).toHaveLength(2)
    expect(inactiveImages.every((image) => image.attributes('loading') === 'lazy')).toBe(true)
    expect(inactiveImages.every((image) => image.attributes('fetchpriority') === 'low')).toBe(true)
  })
})
