import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import defaultCardImageUrl from '@/assets/img/img_default_card.webp'
import CardImage from '@/shared/components/CardImage.vue'

describe('CardImage', () => {
  it('이미지 URL이 없으면 기본 카드 이미지를 표시한다', () => {
    const wrapper = mount(CardImage, { props: { src: null, alt: '기본 카드' } })
    const frameStyle = wrapper.get('[data-slot="card-image"]').attributes('style')

    expect(wrapper.get('img').attributes('src')).toBe(defaultCardImageUrl)
    expect(wrapper.get('img').attributes('alt')).toBe('기본 카드')
    expect(frameStyle).toContain('width: 200px')
    expect(frameStyle).toContain('height: 322px')
    expect(frameStyle).toContain('border-radius: 5.9% / 3.7%')
  })

  it('이미지 로딩 방식과 네트워크 우선순위를 전달한다', () => {
    const wrapper = mount(CardImage, {
      props: { loading: 'lazy', fetchPriority: 'low' },
    })

    expect(wrapper.get('img').attributes('loading')).toBe('lazy')
    expect(wrapper.get('img').attributes('fetchpriority')).toBe('low')
  })

  it('카드 이미지 로드가 실패하면 기본 이미지로 교체한다', async () => {
    const wrapper = mount(CardImage, {
      props: { src: 'https://example.com/unavailable-card.png', alt: '테스트 카드' },
    })

    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/unavailable-card.png')

    await wrapper.get('img').trigger('error')

    expect(wrapper.get('img').attributes('src')).toBe(defaultCardImageUrl)
  })

  it('숫자 또는 CSS 문자열로 이미지 가로·세로 크기를 지정한다', async () => {
    const wrapper = mount(CardImage, { props: { width: 64, height: 40 } })
    const frame = wrapper.get('[data-slot="card-image"]')

    expect(frame.attributes('style')).toContain('width: 64px')
    expect(frame.attributes('style')).toContain('height: 40px')

    await wrapper.setProps({ width: '100%', height: 'auto' })

    expect(frame.attributes('style')).toContain('width: 100%')
    expect(frame.attributes('style')).toContain('height: auto')
  })

  it('small을 켜면 40x64 크기로 표시한다', () => {
    const wrapper = mount(CardImage, { props: { small: true } })
    const frameStyle = wrapper.get('[data-slot="card-image"]').attributes('style')

    expect(frameStyle).toContain('width: 40px')
    expect(frameStyle).toContain('height: 64px')
  })

  it('horizontal 방향이면 preset 크기를 바꾸고 이미지를 90도 회전한다', () => {
    const wrapper = mount(CardImage, {
      props: { small: true, orientation: 'horizontal' },
    })
    const frameStyle = wrapper.get('[data-slot="card-image"]').attributes('style')
    const imageStyle = wrapper.get('img').attributes('style')

    expect(frameStyle).toContain('width: 64px')
    expect(frameStyle).toContain('height: 40px')
    expect(frameStyle).toContain('border-radius: 3.7% / 5.9%')
    expect(imageStyle).toContain('width: 40px')
    expect(imageStyle).toContain('height: 64px')
    expect(imageStyle).toContain('transform: rotate(90deg)')
  })

  it('rounded를 끄면 카드 프레임의 모서리를 둥글게 처리하지 않는다', () => {
    const wrapper = mount(CardImage, { props: { rounded: false } })

    expect(wrapper.get('[data-slot="card-image"]').attributes('style')).not.toContain(
      'border-radius',
    )
  })

  it('세로 프레임에 가로 원본이 들어오면 자동으로 90도 회전한다', async () => {
    const wrapper = mount(CardImage, {
      props: { src: 'https://example.com/horizontal-card.png' },
    })
    const image = wrapper.get('img')
    Object.defineProperties(image.element, {
      naturalWidth: { configurable: true, value: 320 },
      naturalHeight: { configurable: true, value: 200 },
    })

    await image.trigger('load')

    expect(image.attributes('style')).toContain('width: 322px')
    expect(image.attributes('style')).toContain('height: 200px')
    expect(image.attributes('style')).toContain('transform: rotate(90deg)')
  })

  it('가로 프레임과 가로 원본의 방향이 같으면 회전하지 않는다', async () => {
    const wrapper = mount(CardImage, {
      props: {
        src: 'https://example.com/horizontal-card.png',
        small: true,
        orientation: 'horizontal',
      },
    })
    const image = wrapper.get('img')
    Object.defineProperties(image.element, {
      naturalWidth: { configurable: true, value: 320 },
      naturalHeight: { configurable: true, value: 200 },
    })

    await image.trigger('load')

    expect(image.attributes('style')).toContain('width: 100%')
    expect(image.attributes('style')).toContain('height: 100%')
    expect(image.attributes('style')).not.toContain('transform')
  })

  it('가로 프레임의 정사각형 원본은 회전하지 않는다', async () => {
    const wrapper = mount(CardImage, {
      props: {
        src: 'https://example.com/square-card.png',
        small: true,
        orientation: 'horizontal',
      },
    })
    const image = wrapper.get('img')
    Object.defineProperties(image.element, {
      naturalWidth: { configurable: true, value: 200 },
      naturalHeight: { configurable: true, value: 200 },
    })

    await image.trigger('load')

    expect(image.attributes('style')).toContain('width: 100%')
    expect(image.attributes('style')).toContain('height: 100%')
    expect(image.attributes('style')).not.toContain('transform')
  })

  it('원본 크기를 확인할 수 없으면 방향 미확인 상태를 유지한다', async () => {
    const wrapper = mount(CardImage, {
      props: {
        src: 'https://example.com/unloaded-card.png',
        small: true,
        orientation: 'horizontal',
      },
    })
    const image = wrapper.get('img')
    Object.defineProperties(image.element, {
      naturalWidth: { configurable: true, value: 0 },
      naturalHeight: { configurable: true, value: 0 },
    })

    await image.trigger('load')

    expect(image.attributes('style')).toContain('transform: rotate(90deg)')
  })
})
