import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BenefitPreferenceView from '@/domains/mypage/views/BenefitPreferenceView.vue'

const back = vi.fn<() => void>()
const queryState = vi.hoisted(() => ({
  data: 'IMMEDIATE_SAVINGS' as string,
  isPending: false,
  isError: false,
  refetch: vi.fn<() => void>(),
}))
const mutationState = vi.hoisted(() => ({
  mutateAsync: vi.fn<(preference: string) => Promise<void>>(),
}))
const setQueryData = vi.fn<() => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ back }),
}))

vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => ({
    data: ref(queryState.data),
    isPending: ref(queryState.isPending),
    isError: ref(queryState.isError),
    refetch: queryState.refetch,
  }),
  useQueryClient: () => ({
    setQueryData,
  }),
  useMutation: () => ({
    mutateAsync: mutationState.mutateAsync,
    isPending: ref(false),
    isError: ref(false),
  }),
}))

describe('BenefitPreferenceView', () => {
  beforeEach(() => {
    back.mockClear()
    queryState.data = 'IMMEDIATE_SAVINGS'
    queryState.isPending = false
    queryState.isError = false
    queryState.refetch.mockClear()
    mutationState.mutateAsync.mockReset()
    mutationState.mutateAsync.mockResolvedValue()
    setQueryData.mockClear()
  })

  function mountView() {
    return mount(BenefitPreferenceView, {
      global: {
        stubs: {
          PageLayout: { template: '<div><slot /><slot name="footer" /></div>' },
        },
      },
    })
  }

  it('저장된 선호를 선택 상태로 표시하고 현재 선택임을 안내한다', () => {
    queryState.data = 'TRAVEL_MILEAGE'
    const wrapper = mountView()

    const mileageButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('마일리지 쌓기'))
    expect(mileageButton?.attributes('aria-pressed')).toBe('true')
    expect(mileageButton?.text()).toContain('현재 선택')
    expect(wrapper.text()).toContain('현재')
    expect(wrapper.text()).toContain('마일리지 쌓기')
  })

  it('현재 선호와 같은 항목만 선택된 상태에서는 저장 버튼이 비활성화된다', () => {
    const wrapper = mountView()

    const saveButton = wrapper
      .findAll('button')
      .find(
        (button) =>
          button.text() === '현재 선택 유지 중' || button.text() === '이 혜택으로 변경하기',
      )
    expect(saveButton?.attributes()).toHaveProperty('disabled')
  })

  it('다른 선호를 선택해 저장하면 뒤로 이동한다', async () => {
    const wrapper = mountView()

    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    const saveButton = wrapper
      .findAll('button')
      .find(
        (button) =>
          button.text() === '현재 선택 유지 중' || button.text() === '이 혜택으로 변경하기',
      )
    await saveButton?.trigger('click')
    await flushPromises()

    expect(mutationState.mutateAsync).toHaveBeenCalledWith('POINT_USAGE')
    expect(back).toHaveBeenCalledOnce()
  })

  it('저장 실패 시 오류 메시지를 표시한다', async () => {
    mutationState.mutateAsync.mockRejectedValueOnce(new Error('save failed'))
    const wrapper = mountView()

    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    const saveButton = wrapper
      .findAll('button')
      .find(
        (button) =>
          button.text() === '현재 선택 유지 중' || button.text() === '이 혜택으로 변경하기',
      )
    await saveButton?.trigger('click')
    await flushPromises()

    expect(back).not.toHaveBeenCalled()
  })

  it('조회 실패 시 오류를 표시하고 재조회할 수 있다', async () => {
    queryState.isError = true
    const wrapper = mountView()

    expect(wrapper.text()).toContain('혜택 선호 정보를 불러오지 못했어요.')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '다시 시도')
      ?.trigger('click')

    expect(queryState.refetch).toHaveBeenCalledOnce()
  })
})
