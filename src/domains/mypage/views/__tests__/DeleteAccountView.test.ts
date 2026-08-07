import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteAccountView from '@/domains/mypage/views/DeleteAccountView.vue'
import { deleteMocaAccount } from '@/domains/mypage/api/mypage'

const replace = vi.fn<(location: { name: string }) => Promise<void>>()
const clearSession = vi.fn<() => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/domains/auth/stores/auth', () => ({
  useAuthStore: () => ({ clearSession }),
}))

vi.mock('@/domains/mypage/api/mypage', () => ({
  deleteMocaAccount: vi.fn<(reason?: string) => Promise<void>>(),
}))

describe('DeleteAccountView', () => {
  beforeEach(() => {
    vi.mocked(deleteMocaAccount).mockReset()
    replace.mockReset()
    clearSession.mockReset()
  })

  it('동의 전에는 탈퇴 버튼을 비활성화한다', () => {
    const wrapper = mount(DeleteAccountView)

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('동의 후 선택한 사유와 함께 탈퇴하고 로그인 화면으로 이동한다', async () => {
    vi.mocked(deleteMocaAccount).mockResolvedValue()
    const wrapper = mount(DeleteAccountView)

    await wrapper.get('button[role="radio"]:nth-child(4)').trigger('click')
    await wrapper.get('[data-slot="checkbox"]').trigger('click')
    await wrapper.get('form').trigger('submit')

    expect(deleteMocaAccount).toHaveBeenCalledWith('개인정보가 걱정돼요')
    expect(clearSession).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith({ name: 'login' })
  })

  it('선택한 탈퇴 사유를 다시 누르면 선택을 해제한다', async () => {
    const wrapper = mount(DeleteAccountView)
    const reason = wrapper.get('button[role="radio"]')

    await reason.trigger('click')
    expect(reason.attributes('aria-checked')).toBe('true')

    await reason.trigger('click')
    expect(reason.attributes('aria-checked')).toBe('false')
  })
})
