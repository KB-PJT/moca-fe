import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import OnboardingView from '@/domains/auth/views/OnboardingView.vue'
import { fetchBenefitPreference, updateBenefitPreference } from '@/domains/auth/api/auth'

const push = vi.fn<(location: { name: string }) => void>()

function dispatchPointerEvent(
  element: Element,
  type: 'pointerdown' | 'pointerup' | 'pointercancel',
  clientX: number,
) {
  const event = new MouseEvent(type, { bubbles: true, clientX, button: 0 })
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    pointerType: { value: 'mouse' },
    isPrimary: { value: true },
  })
  element.dispatchEvent(event)
}

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/domains/auth/api/auth', () => ({
  fetchBenefitPreference: vi.fn<() => Promise<string>>(),
  updateBenefitPreference: vi.fn<(preference: string) => Promise<void>>(),
}))

describe('OnboardingView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchBenefitPreference).mockRejectedValue(new Error('not loaded'))
    vi.mocked(updateBenefitPreference).mockResolvedValue()
  })

  it('저장된 혜택 선호 성향을 불러와 선택 상태로 표시한다', async () => {
    vi.mocked(fetchBenefitPreference).mockResolvedValue('TRAVEL_MILEAGE')
    const wrapper = mount(OnboardingView)

    await flushPromises()
    await wrapper.get('button').trigger('click')

    const mileageButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('마일리지 쌓기'))
    expect(mileageButton?.attributes('aria-pressed')).toBe('true')
  })

  it('건너뛰기를 누르면 홈이 아닌 선호 성향 선택 화면으로 이동한다', async () => {
    const wrapper = mount(OnboardingView)

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('어떤 혜택을 우선으로 볼까요?')
    expect(wrapper.text()).not.toContain('건너뛰기')
    expect(wrapper.find('[aria-label="온보딩 진행 상태"]').exists()).toBe(false)
    expect(push).not.toHaveBeenCalled()
  })

  it('선호 성향을 선택해 저장한 뒤 홈으로 이동한다', async () => {
    const wrapper = mount(OnboardingView)

    await wrapper.get('button').trigger('click')
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    const startButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('선택하고 시작하기'))
    await startButton?.trigger('click')
    await flushPromises()

    expect(updateBenefitPreference).toHaveBeenCalledWith('IMMEDIATE_SAVINGS')
    expect(push).toHaveBeenCalledWith({ name: 'home' })
  })

  it('선택한 성향을 다시 누르면 선택을 해제한다', async () => {
    const wrapper = mount(OnboardingView)

    await wrapper.get('button').trigger('click')
    const preferenceButton = wrapper.get('button[aria-pressed="false"]')

    await preferenceButton.trigger('click')
    expect(preferenceButton.attributes('aria-pressed')).toBe('true')

    await preferenceButton.trigger('click')
    expect(preferenceButton.attributes('aria-pressed')).toBe('false')

    const startButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('선택하고 시작하기'))
    expect(startButton?.attributes()).toHaveProperty('disabled')
  })

  it('포인터 이벤트 이후에도 마지막 화면의 성향 카드를 선택할 수 있다', async () => {
    const wrapper = mount(OnboardingView)

    await wrapper.get('button').trigger('click')
    const preferenceButton = wrapper.get('button[aria-pressed="false"]')

    dispatchPointerEvent(preferenceButton.element, 'pointerdown', 160)
    dispatchPointerEvent(preferenceButton.element, 'pointerup', 160)
    await preferenceButton.trigger('click')

    expect(preferenceButton.attributes('aria-pressed')).toBe('true')
  })

  it('화면을 좌우로 드래그해 다음 및 이전 단계로 이동한다', async () => {
    const wrapper = mount(OnboardingView)
    const slide = wrapper.get('section')
    const setPointerCapture = vi.fn<(pointerId: number) => void>()
    const releasePointerCapture = vi.fn<(pointerId: number) => void>()
    Object.assign(slide.element, {
      setPointerCapture,
      hasPointerCapture: () => true,
      releasePointerCapture,
    })

    dispatchPointerEvent(slide.element, 'pointerdown', 300)
    dispatchPointerEvent(slide.element, 'pointerup', 200)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('결제 전 혜택 확인')
    expect(setPointerCapture).toHaveBeenCalledWith(1)
    expect(releasePointerCapture).toHaveBeenCalledWith(1)

    dispatchPointerEvent(slide.element, 'pointerdown', 100)
    dispatchPointerEvent(slide.element, 'pointerup', 200)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('내 카드를 한눈에')
  })
})
