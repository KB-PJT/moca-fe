import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationSettingsView from '@/domains/notification/views/NotificationSettingsView.vue'
import {
  fetchNotificationSettings,
  type NotificationSettings,
  updateNotificationSettings,
} from '@/domains/notification/api/notificationSettings'

vi.mock('@/domains/notification/api/notificationSettings', () => ({
  fetchNotificationSettings: vi.fn<() => Promise<NotificationSettings>>(),
  updateNotificationSettings:
    vi.fn<(settings: NotificationSettings) => Promise<NotificationSettings>>(),
}))

const serverSettings: NotificationSettings = {
  performanceClosingEnabled: true,
  nearbyBenefitEnabled: false,
  benefitLimitEnabled: true,
  marketingEnabled: false,
}

const SwitchStub = {
  inheritAttrs: false,
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue'],
  template: `
    <button
      type="button"
      :aria-label="$attrs['aria-label']"
      :aria-checked="String(modelValue)"
      :disabled="disabled"
      @click="$emit('update:modelValue', !modelValue)"
    />
  `,
}

function mountView() {
  return shallowMount(NotificationSettingsView, {
    global: {
      stubs: {
        PageLayout: { template: '<main><slot /></main>' },
        SectionCard: { template: '<section><slot /></section>' },
        Switch: SwitchStub,
      },
    },
  })
}

describe('NotificationSettingsView', () => {
  beforeEach(() => {
    vi.mocked(fetchNotificationSettings).mockReset()
    vi.mocked(updateNotificationSettings).mockReset()
    vi.mocked(fetchNotificationSettings).mockResolvedValue(serverSettings)
  })

  it('서버에서 조회한 알림 설정을 각 스위치에 반영한다', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[aria-label="실적 마감 알림"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('[aria-label="주변 혜택 알림"]').attributes('aria-checked')).toBe('false')
    expect(wrapper.get('[aria-label="혜택 한도 알림"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('[aria-label="마케팅 정보 알림"]').attributes('aria-checked')).toBe('false')
    expect(wrapper.get('[aria-label="전체 알림"]').attributes('aria-checked')).toBe('false')
  })

  it('개별 설정 변경 시 네 개의 최신 설정을 모두 저장한다', async () => {
    const updatedSettings = { ...serverSettings, nearbyBenefitEnabled: true }
    vi.mocked(updateNotificationSettings).mockResolvedValue(updatedSettings)
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[aria-label="주변 혜택 알림"]').trigger('click')
    await flushPromises()

    expect(updateNotificationSettings).toHaveBeenCalledWith(updatedSettings)
    expect(wrapper.get('[aria-label="주변 혜택 알림"]').attributes('aria-checked')).toBe('true')
  })

  it('저장 실패 시 이전 설정으로 되돌리고 오류를 안내한다', async () => {
    vi.mocked(updateNotificationSettings).mockRejectedValue(new Error('network error'))
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[aria-label="마케팅 정보 알림"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="마케팅 정보 알림"]').attributes('aria-checked')).toBe('false')
    expect(wrapper.get('[role="alert"]').text()).toContain('알림 설정을 저장하지 못했어요.')
  })

  it('초기 조회 실패 시 스위치를 비활성화하고 다시 시도하면 GET을 재호출한다', async () => {
    vi.mocked(fetchNotificationSettings)
      .mockRejectedValueOnce(new Error('get failed'))
      .mockResolvedValueOnce(serverSettings)
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('알림 설정을 불러오지 못했어요.')
    expect(wrapper.get('[aria-label="전체 알림"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[aria-label="주변 혜택 알림"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[aria-label="주변 혜택 알림"]').trigger('click')
    expect(updateNotificationSettings).not.toHaveBeenCalled()

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(fetchNotificationSettings).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('[aria-label="주변 혜택 알림"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[aria-label="실적 마감 알림"]').attributes('aria-checked')).toBe('true')
  })

  it('저장 실패 후 다시 시도하면 실패했던 payload로 PATCH를 재호출한다', async () => {
    const failedPayload = { ...serverSettings, marketingEnabled: true }
    vi.mocked(updateNotificationSettings)
      .mockRejectedValueOnce(new Error('patch failed'))
      .mockResolvedValueOnce(failedPayload)
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[aria-label="마케팅 정보 알림"]').trigger('click')
    await flushPromises()
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(updateNotificationSettings).toHaveBeenCalledTimes(2)
    expect(updateNotificationSettings).toHaveBeenNthCalledWith(1, failedPayload)
    expect(updateNotificationSettings).toHaveBeenNthCalledWith(2, failedPayload)
    expect(fetchNotificationSettings).toHaveBeenCalledOnce()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('[aria-label="마케팅 정보 알림"]').attributes('aria-checked')).toBe('true')
  })
})
